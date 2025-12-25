'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import type { CartItem } from './cart-context';
import { incrementDiscountCodeUsage } from './discount-actions';
import { getAdminFirestore } from './firebase/admin';
import type { Order } from './firebase/firestore/orders';
import { getPlatformCommissionRate } from './platform-settings-actions';

const verifyPaymentSchema = z.object({
  reference: z.string(),
  idempotencyKey: z.string(),
  cartItems: z.any(),
  total: z.number(),
  deliveryAddress: z.string(),
  customerInfo: z.any(),
  discountCode: z.string().optional(),
  shippingType: z.enum(['delivery', 'pickup', 'contact']).optional(),
  shippingPrice: z.number().optional(),
});

/**
 * Verify payment with idempotency check
 * Prevents duplicate order creation for the same payment
 */
export async function verifyPaymentAndCreateOrder(data: unknown) {
  const validation = verifyPaymentSchema.safeParse(data);
  if (!validation.success) {
    throw new Error('Invalid payment verification data.');
  }

  const { reference, idempotencyKey, cartItems, total, deliveryAddress, customerInfo, discountCode, shippingType, shippingPrice } = validation.data;
  
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecretKey) {
    throw new Error("Paystack secret key is not configured on the server.");
  }

  const firestore = getAdminFirestore();
  const customerId = (await headers()).get('X-User-UID');
  
  // For guest checkout, use email as identifier or create guest user
  let finalCustomerId = customerId;
  let isGuestOrder = false;
  
  if (!customerId) {
    // Guest checkout - use email to create or find guest user
    if (!customerInfo?.email) {
      throw new Error("Email is required for guest checkout.");
    }
    
    isGuestOrder = true;
    // Create a guest user record or use email-based ID
    const guestId = `guest_${customerInfo.email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    
    // Check if guest user exists, otherwise create one
    const guestUserRef = firestore.collection('users').doc(guestId);
    const guestUserDoc = await guestUserRef.get();
    
    if (!guestUserDoc.exists) {
      await guestUserRef.set({
        email: customerInfo.email,
        displayName: customerInfo.name || `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim(),
        firstName: customerInfo.firstName || '',
        lastName: customerInfo.lastName || '',
        phone: customerInfo.phone || '',
        role: 'buyer', // Guest users are buyers
        isGuest: true,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    
    finalCustomerId = guestId;
  }

  // Check for existing order with same idempotency key (prevent duplicates)
  const existingOrderQuery = await firestore
    .collection('orders')
    .where('idempotencyKey', '==', idempotencyKey)
    .limit(1)
    .get();

  if (!existingOrderQuery.empty) {
    const existingOrder = existingOrderQuery.docs[0].data();
    return {
      success: true,
      orderId: existingOrderQuery.docs[0].id,
      alreadyExists: true,
      message: 'Order already created for this payment',
    };
  }

  // Verify with Paystack with retry logic
  let paystackResult;
  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Paystack API error: ${response.status}`);
      }

      paystackResult = await response.json();

      if (!paystackResult.status || !paystackResult.data) {
        throw new Error(paystackResult.message || 'Paystack verification failed');
      }

      break; // Success, exit retry loop
    } catch (error: any) {
      retries++;
      
      if (retries >= maxRetries) {
        // Log failed payment attempt for manual reconciliation
        await firestore.collection('failed_payments').add({
          reference,
          idempotencyKey,
          customerId: finalCustomerId,
          amount: total,
          error: error.message || 'Payment verification failed after retries',
          retryCount: retries,
          createdAt: FieldValue.serverTimestamp(),
        });

        throw new Error(`Payment verification failed after ${maxRetries} attempts: ${error.message}`);
      }

      // Exponential backoff: wait 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries - 1) * 1000));
    }
  }

  const { status, amount } = paystackResult.data;

  // Validate payment status and amount
  if (status !== 'success') {
    throw new Error(`Payment not successful. Status: ${status}`);
  }

  if (amount / 100 !== total) {
    // Log amount mismatch for reconciliation
    await firestore.collection('payment_mismatches').add({
      reference,
      idempotencyKey,
      expectedAmount: total,
      actualAmount: amount / 100,
      customerId: finalCustomerId,
      createdAt: FieldValue.serverTimestamp(),
    });

    throw new Error(`Amount mismatch. Expected: ₦${total}, Received: ₦${amount / 100}`);
  }

  // Create order with idempotency key
  const sellerId = cartItems[0].sellerId;
  const commissionRate = await getPlatformCommissionRate();
  
  const orderData: Omit<Order, 'id' | 'createdAt'> = {
    customerId: finalCustomerId,
    sellerId: sellerId,
    items: cartItems.map(({ id, name, price, quantity }: CartItem) => ({ productId: id, name, price, quantity })),
    total: total,
    status: 'Processing',
    deliveryAddress: deliveryAddress,
    customerInfo: {
      ...customerInfo,
      isGuest: isGuestOrder, // Mark as guest order
    },
    escrowStatus: 'held',
    paymentReference: reference,
    idempotencyKey, // Store idempotency key
    commissionRate: commissionRate, // Store commission rate for historical accuracy
    shippingType: shippingType || 'delivery', // Store shipping type (delivery or pickup)
    shippingPrice: shippingPrice || 0, // Store shipping price
  };

  const ordersCollectionRef = firestore.collection('orders');
  const orderRef = await ordersCollectionRef.add({
    ...orderData,
    createdAt: FieldValue.serverTimestamp(),
    paystackReference: reference,
  });

  // Decrement product stock for each item in the order
  try {
    const stockUpdateBatch = firestore.batch();
    for (const item of cartItems) {
      const productRef = firestore.collection('products').doc(item.id);
      const productDoc = await productRef.get();
      
      if (productDoc.exists) {
        const currentStock = productDoc.data()?.stock || 0;
        const newStock = Math.max(0, currentStock - item.quantity);
        stockUpdateBatch.update(productRef, {
          stock: newStock,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
    await stockUpdateBatch.commit();
  } catch (error) {
    console.error('Failed to update product stock:', error);
    // Don't fail the order if stock update fails, but log it for manual reconciliation
  }

  // Increment discount code usage if applied
  if (discountCode && sellerId) {
    try {
      await incrementDiscountCodeUsage(discountCode, sellerId);
    } catch (error) {
      console.error('Failed to increment discount code usage:', error);
      // Don't fail the order if discount code update fails
    }
  }

  // Create payment record
  await firestore.collection('payments').add({
    orderId: orderRef.id,
    customerId: finalCustomerId,
    sellerId: sellerId,
    amount: total,
    reference: reference,
    idempotencyKey,
    status: 'completed',
    method: 'Paystack',
    discountCode: discountCode || null,
    isGuest: isGuestOrder,
    verifiedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  });

  // Create initial system messages in chat
  const chatCollection = orderRef.collection('chat');
  
  await chatCollection.add({
    orderId: orderRef.id,
    senderId: 'system',
    senderType: 'system',
    message: 'Order placed',
    isSystemMessage: true,
    createdAt: FieldValue.serverTimestamp(),
  });

  await chatCollection.add({
    orderId: orderRef.id,
    senderId: 'system',
    senderType: 'system',
    message: 'Payment confirmed',
    isSystemMessage: true,
    createdAt: FieldValue.serverTimestamp(),
  });

  revalidatePath('/profile');
  revalidatePath('/seller/orders');

  return { success: true, orderId: orderRef.id };
}

/**
 * Retry failed payment verification
 */
export async function retryPaymentVerification(data: unknown) {
  const validation = verifyPaymentSchema.safeParse(data);
  if (!validation.success) {
    throw new Error('Invalid payment verification data.');
  }

  // Same logic as verifyPaymentAndCreateOrder, but with additional logging
  const result = await verifyPaymentAndCreateOrder(data);
  
  // Log retry success
  const firestore = getAdminFirestore();
  await firestore.collection('payment_retries').add({
    reference: validation.data.reference,
    idempotencyKey: validation.data.idempotencyKey,
    success: true,
    orderId: result.orderId,
    retriedAt: FieldValue.serverTimestamp(),
  });

  return result;
}

/**
 * Find recent Paystack transaction by email and amount
 * Useful when we don't have the exact reference
 */
export async function findRecentTransactionByEmail(email: string, amount: number) {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecretKey) {
    throw new Error("Paystack secret key is not configured.");
  }

  try {
    // Amount is in kobo, so multiply by 100
    const amountInKobo = Math.round(amount * 100);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/216e8403-ed09-402a-a608-99b1722965bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'payment-actions.ts:279',message:'findRecentTransactionByEmail entry',data:{email,amount,amountInKobo},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    // Query all recent transactions (Paystack API doesn't support filtering by email directly)
    // We'll get the most recent 100 transactions and filter client-side
    const response = await fetch(
      `https://api.paystack.co/transaction?perPage=100`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/216e8403-ed09-402a-a608-99b1722965bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'payment-actions.ts:305',message:'Paystack API error',data:{status:response.status,errorData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.error('Paystack transaction list error:', errorData);
      return null;
    }

    const result = await response.json();
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/216e8403-ed09-402a-a608-99b1722965bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'payment-actions.ts:311',message:'Paystack API response',data:{resultStatus:result.status,hasData:!!result.data,dataLength:result.data?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    if (!result.status || !result.data) {
      console.log('No transaction data returned from Paystack');
      return null;
    }

    // Find transaction matching email and amount (within 1 kobo tolerance)
    const transactions = result.data || [];
    console.log(`🔍 Checking ${transactions.length} recent transactions for email: ${email}, amount: ${amountInKobo} kobo`);
    
    // Filter to only recent transactions (last 10 minutes) to avoid false matches
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/216e8403-ed09-402a-a608-99b1722965bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'payment-actions.ts:320',message:'Starting transaction search',data:{transactionCount:transactions.length,email,amountInKobo,tenMinutesAgo,now:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    const matchingTransaction = transactions.find((tx: any) => {
      const txEmail = tx.customer?.email || tx.customer_email || '';
      const txAmount = tx.amount || 0;
      const emailMatch = txEmail.toLowerCase() === email.toLowerCase();
      const amountMatch = Math.abs(txAmount - amountInKobo) <= 1; // Allow 1 kobo difference
      
      // Check if transaction is recent (within last 10 minutes)
      const txDate = tx.paid_at ? new Date(tx.paid_at) : null;
      const txTimestamp = txDate ? txDate.getTime() : 0;
      const isRecent = txTimestamp > tenMinutesAgo;
      
      const matches = emailMatch && amountMatch && tx.status === 'success' && isRecent;
      
      // #region agent log
      if (txEmail || txAmount > 0) {
        fetch('http://127.0.0.1:7242/ingest/216e8403-ed09-402a-a608-99b1722965bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'payment-actions.ts:332',message:'Transaction check',data:{txReference:tx.reference,txEmail,txAmount,emailMatch,amountMatch,isRecent,txStatus:tx.status,matches,paidAt:tx.paid_at},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      }
      // #endregion
      
      if (emailMatch && amountMatch && isRecent) {
        console.log(`🔍 Found candidate transaction:`, {
          reference: tx.reference,
          status: tx.status,
          email: txEmail,
          amount: txAmount,
          paidAt: tx.paid_at,
          matches
        });
      }
      
      return matches;
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/216e8403-ed09-402a-a608-99b1722965bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'payment-actions.ts:352',message:'Transaction search result',data:{found:!!matchingTransaction,matchingReference:matchingTransaction?.reference},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    if (matchingTransaction) {
      console.log('✅ Found matching transaction:', matchingTransaction.reference);
      return {
        reference: matchingTransaction.reference,
        status: matchingTransaction.status,
        amount: matchingTransaction.amount / 100,
        paidAt: matchingTransaction.paid_at,
      };
    }

    console.log('❌ No matching transaction found');
    return null;
  } catch (error: any) {
    console.error('Error finding recent transaction:', error);
    return null;
  }
}

/**
 * Check payment status without creating order
 * Useful for recovery flows
 */
export async function checkPaymentStatus(reference: string) {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecretKey) {
    throw new Error("Paystack secret key is not configured.");
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to verify payment');
    }

    const result = await response.json();
    
    if (!result.status || !result.data) {
      return { 
        exists: false, 
        status: 'unknown',
        message: result.message || 'Payment not found'
      };
    }

    return {
      exists: true,
      status: result.data.status,
      amount: result.data.amount / 100,
      paidAt: result.data.paid_at,
      reference: result.data.reference,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Payment verification timed out. Please try again.');
    }
    throw error;
  }
}

/**
 * Create pending payment (pay-later flow)
 */
export async function createPendingPayment(data: unknown) {
  const schema = z.object({
    cartItems: z.any(),
    total: z.number(),
    deliveryAddress: z.string(),
    customerInfo: z.any(),
    expiresAt: z.number().optional(), // Optional expiration timestamp
  });

  const validation = schema.safeParse(data);
  if (!validation.success) {
    throw new Error('Invalid payment data.');
  }

  const { cartItems, total, deliveryAddress, customerInfo, expiresAt } = validation.data;
  const customerId = (await headers()).get('X-User-UID');
  
  if (!customerId) {
    throw new Error("User authentication not found.");
  }

  const firestore = getAdminFirestore();
  // Generate idempotency key (simple UUID-like string)
  const idempotencyKey = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  // Create pending payment record
  const pendingPaymentRef = await firestore.collection('pending_payments').add({
    customerId,
    sellerId: cartItems[0].sellerId,
    cartItems,
    total,
    deliveryAddress,
    customerInfo,
    idempotencyKey,
    status: 'pending',
    expiresAt: expiresAt || Date.now() + (24 * 60 * 60 * 1000), // Default 24 hours
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    pendingPaymentId: pendingPaymentRef.id,
    idempotencyKey,
    expiresAt: expiresAt || Date.now() + (24 * 60 * 60 * 1000),
  };
}

