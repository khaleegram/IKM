'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { getAdminFirestore } from './firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import type { Order } from './firebase/firestore/orders';
import type { CartItem } from './cart-context';
import { incrementDiscountCodeUsage } from './discount-actions';

const verifyPaymentSchema = z.object({
  reference: z.string(),
  idempotencyKey: z.string(),
  cartItems: z.any(),
  total: z.number(),
  deliveryAddress: z.string(),
  customerInfo: z.any(),
  discountCode: z.string().optional(),
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

  const { reference, idempotencyKey, cartItems, total, deliveryAddress, customerInfo, discountCode } = validation.data;
  
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecretKey) {
    throw new Error("Paystack secret key is not configured on the server.");
  }

  const firestore = getAdminFirestore();
  const customerId = (await headers()).get('X-User-UID');
  
  if (!customerId) {
    throw new Error("User authentication not found. Cannot create order.");
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
          customerId,
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
      customerId,
      createdAt: FieldValue.serverTimestamp(),
    });

    throw new Error(`Amount mismatch. Expected: ₦${total}, Received: ₦${amount / 100}`);
  }

  // Create order with idempotency key
  const sellerId = cartItems[0].sellerId;
  const commissionRate = await getPlatformCommissionRate();
  
  const orderData: Omit<Order, 'id' | 'createdAt'> = {
    customerId: customerId,
    sellerId: sellerId,
    items: cartItems.map(({ id, name, price, quantity }: CartItem) => ({ productId: id, name, price, quantity })),
    total: total,
    status: 'Processing',
    deliveryAddress: deliveryAddress,
    customerInfo: customerInfo,
    escrowStatus: 'held',
    paymentReference: reference,
    idempotencyKey, // Store idempotency key
    commissionRate: commissionRate, // Store commission rate for historical accuracy
  };

  const ordersCollectionRef = firestore.collection('orders');
  const orderRef = await ordersCollectionRef.add({
    ...orderData,
    createdAt: FieldValue.serverTimestamp(),
    paystackReference: reference,
  });

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
    customerId: customerId,
    sellerId: sellerId,
    amount: total,
    reference: reference,
    idempotencyKey,
    status: 'completed',
    method: 'Paystack',
    discountCode: discountCode || null,
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

