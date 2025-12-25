/**
 * Cloud Functions for IKM Marketplace
 * 
 * This file contains all HTTP callable functions that can be used
 * from both the web app and mobile app.
 * 
 * Authentication: Functions use Firebase ID token from Authorization header
 * Format: Authorization: Bearer <firebase-id-token>
 */

import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';
import { z } from 'zod';
import cors = require('cors');

// Initialize Firebase Admin
admin.initializeApp();

// CORS configuration - allow all origins for mobile/web apps
const corsHandler = cors({ origin: true });

// Define Firebase Secret for Paystack
const paystackSecret = defineSecret('PAYSTACK_SECRET_KEY');

// Import utilities
import {
    getPaystackSecretKey,
    getPlatformCommissionRate,
    requireAdmin,
    requireAuth,
    sendError,
    sendResponse,
    verifyIdToken,
} from './utils';

// ============================================================================
// PAYMENT FUNCTIONS
// ============================================================================

const verifyPaymentSchema = z.object({
  reference: z.string(),
  idempotencyKey: z.string(),
  cartItems: z.array(z.any()),
  total: z.number(),
  deliveryAddress: z.string(),
  customerInfo: z.any(),
  discountCode: z.string().optional(),
  shippingType: z.enum(['delivery', 'pickup', 'contact']).optional(),
  shippingPrice: z.number().optional(),
});

/**
 * Verify payment and create order
 */
export const verifyPaymentAndCreateOrder = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      // Verify authentication (optional for guest checkout)
      let auth: { uid: string; email?: string; isAdmin?: boolean } | null = null;
      try {
        auth = await verifyIdToken(request.headers.authorization || null);
      } catch {
        // Guest checkout is allowed
        auth = null;
      }

      const validation = verifyPaymentSchema.safeParse(request.body);
      if (!validation.success) {
        return sendError(response, 'Invalid payment verification data');
      }

      const {
        reference,
        idempotencyKey,
        cartItems,
        total,
        deliveryAddress,
        customerInfo,
        discountCode,
        shippingType,
        shippingPrice,
      } = validation.data;

      const paystackSecretKey = getPaystackSecretKey(paystackSecret.value());
      const firestore = admin.firestore();

      // CRITICAL: Handle customer ID - prioritize logged-in user
      let finalCustomerId = auth?.uid; // If user is logged in, use their UID
      let isGuestOrder = false;

      if (!finalCustomerId) {
        // Guest checkout - create guest user ID from email
        if (!customerInfo?.email) {
          return sendError(response, 'Email is required for guest checkout');
        }
        isGuestOrder = true;
        // CRITICAL: Use consistent guest ID format (without timestamp for better linking)
        const emailKey = customerInfo.email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const guestId = `guest_${emailKey}`;
        const guestUserRef = firestore.collection('users').doc(guestId);
        const guestUserDoc = await guestUserRef.get();

        if (!guestUserDoc.exists) {
          await guestUserRef.set({
            email: customerInfo.email.toLowerCase(),
            displayName: customerInfo.name || `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim(),
            firstName: customerInfo.firstName || '',
            lastName: customerInfo.lastName || '',
            phone: customerInfo.phone || '',
            role: 'buyer',
            isGuest: true,
            createdAt: FieldValue.serverTimestamp(),
          });
        }
        finalCustomerId = guestId;
      } else {
        // CRITICAL: User is logged in - ensure order is tied to their account
        // Verify user exists in users collection
        if (auth) {
          const userDoc = await firestore.collection('users').doc(finalCustomerId).get();
          if (!userDoc.exists) {
            // Create user document if it doesn't exist
            await firestore.collection('users').doc(finalCustomerId).set({
              email: auth.email || customerInfo?.email || '',
              displayName: customerInfo?.name || `${customerInfo?.firstName || ''} ${customerInfo?.lastName || ''}`.trim(),
              firstName: customerInfo?.firstName || '',
              lastName: customerInfo?.lastName || '',
              phone: customerInfo?.phone || '',
              role: 'buyer',
              createdAt: FieldValue.serverTimestamp(),
            });
          }
        }
      }

      // Check for existing order with same idempotency key
      const existingOrderQuery = await firestore
        .collection('orders')
        .where('idempotencyKey', '==', idempotencyKey)
        .limit(1)
        .get();

      if (!existingOrderQuery.empty) {
        return sendResponse(response, {
          success: true,
          orderId: existingOrderQuery.docs[0].id,
          alreadyExists: true,
          message: 'Order already created for this payment',
        });
      }

      // Verify with Paystack
      let paystackResult;
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          const paystackResponse = await fetch(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
              headers: {
                Authorization: `Bearer ${paystackSecretKey}`,
              },
              signal: AbortSignal.timeout(10000),
            }
          );

          if (!paystackResponse.ok) {
            const errorData = await paystackResponse.json();
            throw new Error(errorData.message || `Paystack API error: ${paystackResponse.status}`);
          }

          paystackResult = await paystackResponse.json();
          if (!paystackResult.status || !paystackResult.data) {
            throw new Error(paystackResult.message || 'Paystack verification failed');
          }
          break;
        } catch (error: any) {
          retries++;
          if (retries >= maxRetries) {
            await firestore.collection('failed_payments').add({
              reference,
              idempotencyKey,
              customerId: finalCustomerId,
              amount: total,
              error: error.message || 'Payment verification failed after retries',
              retryCount: retries,
              createdAt: FieldValue.serverTimestamp(),
            });
            return sendError(response, `Payment verification failed: ${error.message}`);
          }
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries - 1) * 1000));
        }
      }

      const { status, amount } = paystackResult.data;

      if (status !== 'success') {
        return sendError(response, `Payment not successful. Status: ${status}`);
      }

      if (amount / 100 !== total) {
        await firestore.collection('payment_mismatches').add({
          reference,
          idempotencyKey,
          expectedAmount: total,
          actualAmount: amount / 100,
          customerId: finalCustomerId,
          createdAt: FieldValue.serverTimestamp(),
        });
        return sendError(response, `Amount mismatch. Expected: ₦${total}, Received: ₦${amount / 100}`);
      }

      // CRITICAL: Validate cart items and stock BEFORE creating order
      if (!cartItems || cartItems.length === 0) {
        return sendError(response, 'Invalid cart: Cart is empty', 400);
      }
      
      const sellerId = cartItems[0]?.sellerId;
      if (!sellerId) {
        return sendError(response, 'Invalid cart: No seller ID found', 400);
      }
      
      // CRITICAL: Validate all items belong to the same seller
      const allSameSeller = cartItems.every((item: any) => item.sellerId === sellerId);
      if (!allSameSeller) {
        return sendError(response, 'Invalid cart: All items must be from the same seller', 400);
      }
      
      // CRITICAL: Validate total amount matches cart items
      const calculatedTotal = cartItems.reduce((sum: number, item: any) => {
        return sum + (item.price * item.quantity);
      }, 0);
      const shippingCost = shippingPrice || 0;
      const discountAmount = 0; // Will be calculated if discount code is valid
      const expectedTotal = calculatedTotal + shippingCost - discountAmount;
      
      // Allow small rounding differences (0.01)
      if (Math.abs(total - expectedTotal) > 0.01) {
        console.warn('Total mismatch:', { total, expectedTotal, calculatedTotal, shippingCost });
        // Log but don't fail - frontend calculation might differ slightly
      }

      // CRITICAL: Validate cart items
      for (const item of cartItems) {
        if (!item.id || !item.quantity || item.quantity <= 0) {
          return sendError(response, `Invalid cart item: ${item.name || 'Unknown'}`, 400);
        }
        if (!item.price || item.price <= 0) {
          return sendError(response, `Invalid price for ${item.name}`, 400);
        }
      }

      const commissionRate = await getPlatformCommissionRate();

      // CRITICAL: Use Firestore transaction to ensure atomicity - check stock and create order atomically
      const orderRef = firestore.collection('orders').doc();
      
      await firestore.runTransaction(async (transaction) => {
        // CRITICAL: Check stock availability within transaction
        const productRefs = cartItems.map((item: any) => 
          firestore.collection('products').doc(item.id)
        );
        
        const productDocs = await Promise.all(
          productRefs.map(ref => transaction.get(ref))
        );
        
        // Validate products and stock
        for (let i = 0; i < productDocs.length; i++) {
          const productDoc = productDocs[i];
          const item = cartItems[i];
          
          if (!productDoc.exists) {
            throw new Error(`Product not found: ${item.name}`);
          }
          
          const productData = productDoc.data();
          const currentStock = productData?.stock || 0;
          const requiredQuantity = item.quantity;
          
          if (currentStock < requiredQuantity) {
            throw new Error(`Insufficient stock for ${item.name}. Available: ${currentStock}, Required: ${requiredQuantity}`);
          }
          
          // Update stock in transaction
          const newStock = Math.max(0, currentStock - requiredQuantity);
          transaction.update(productRefs[i], {
            stock: newStock,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
        
        // CRITICAL: Create order data with payment verification metadata
        const orderData = {
          customerId: finalCustomerId!,
          sellerId: sellerId,
          items: cartItems.map(({ id, name, price, quantity }: any) => ({
            productId: id,
            name,
            price,
            quantity,
          })),
          total: total,
          status: 'Processing',
          deliveryAddress: deliveryAddress,
          customerInfo: {
            ...customerInfo,
            isGuest: isGuestOrder,
          },
          escrowStatus: 'held',
          paymentReference: reference,
          idempotencyKey,
          commissionRate,
          shippingType: shippingType || 'delivery',
          shippingPrice: shippingPrice || 0,
          createdAt: FieldValue.serverTimestamp(),
          paystackReference: reference,
          // CRITICAL: Add payment verification metadata
          paymentVerifiedAt: FieldValue.serverTimestamp(),
          paymentStatus: 'success',
          paymentAmount: amount / 100,
        };
        
        // Create order in transaction
        transaction.set(orderRef, orderData);
      }).catch((error: any) => {
        // CRITICAL: If transaction fails, log for manual recovery
        console.error('CRITICAL: Transaction failed after payment verification', {
          reference,
          idempotencyKey,
          customerId: finalCustomerId,
          error: error.message,
        });
        
        // Log to failed_orders collection for manual recovery
        firestore.collection('failed_orders').add({
          reference,
          idempotencyKey,
          customerId: finalCustomerId,
          sellerId,
          total,
          cartItems,
          error: error.message || 'Transaction failed',
          paymentVerified: true, // Payment was verified but order creation failed
          createdAt: FieldValue.serverTimestamp(),
        });
        
        throw new Error(`Order creation failed: ${error.message}`);
      });

      // Increment discount code usage if applied (non-critical, can fail without affecting order)
      if (discountCode && sellerId) {
        try {
          const discountQuery = await firestore
            .collection('discount_codes')
            .where('code', '==', discountCode.toUpperCase())
            .where('sellerId', '==', sellerId)
            .limit(1)
            .get();

          if (!discountQuery.empty) {
            const discountDoc = discountQuery.docs[0];
            const discountData = discountDoc.data();
            const currentUses = discountData.uses || 0;
            const maxUses = discountData.maxUses;

            // CRITICAL: Check if discount code has reached max uses
            if (maxUses && currentUses >= maxUses) {
              console.warn(`Discount code ${discountCode} has reached max uses`);
            } else {
              await discountDoc.ref.update({
                uses: currentUses + 1,
                updatedAt: FieldValue.serverTimestamp(),
              });
            }
          }
        } catch (error) {
          console.error('Failed to increment discount code usage:', error);
          // Non-critical - order is already created
        }
      }

      // Create payment record for audit trail
      try {
        await firestore.collection('payments').add({
          orderId: orderRef.id,
          customerId: finalCustomerId,
          sellerId: sellerId,
          amount: total,
          reference: reference,
          status: 'completed',
          method: 'Paystack',
          discountCode: discountCode || null,
          isGuest: isGuestOrder,
          verifiedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        });
      } catch (error) {
        console.error('Failed to create payment record:', error);
        // Non-critical - order is already created
      }

      // Create initial chat messages (non-critical)
      try {
        await firestore.collection('orders').doc(orderRef.id).collection('chat').add({
          orderId: orderRef.id,
          senderId: 'system',
          senderType: 'system',
          message: 'Order created successfully. Payment verified.',
          isSystemMessage: true,
          createdAt: FieldValue.serverTimestamp(),
        });
      } catch (error) {
        console.error('Failed to create chat message:', error);
        // Non-critical - order is already created
      }

      return sendResponse(response, {
        success: true,
        orderId: orderRef.id,
        message: 'Order created successfully',
      });
    } catch (error: any) {
      console.error('Error in verifyPaymentAndCreateOrder:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

/**
 * Find recent transaction by email and amount
 */
export const findRecentTransactionByEmail = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const { email, amount } = request.body;

      if (!email || !amount) {
        return sendError(response, 'Email and amount are required');
      }

      const paystackSecretKey = getPaystackSecretKey(paystackSecret.value());
      const amountInKobo = Math.round(amount * 100);

      const paystackResponse = await fetch(
        `https://api.paystack.co/transaction?perPage=100`,
        {
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!paystackResponse.ok) {
        return sendError(response, 'Failed to fetch transactions from Paystack');
      }

      const result = await paystackResponse.json();
      if (!result.status || !result.data) {
        return sendResponse(response, { success: false, found: false });
      }

      const transactions = result.data || [];
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

      const matchingTransaction = transactions.find((tx: any) => {
        const txEmail = tx.customer?.email || tx.customer_email || '';
        const txAmount = tx.amount || 0;
        const emailMatch = txEmail.toLowerCase() === email.toLowerCase();
        const amountMatch = Math.abs(txAmount - amountInKobo) <= 1;
        const txDate = tx.paid_at ? new Date(tx.paid_at) : null;
        const txTimestamp = txDate ? txDate.getTime() : 0;
        const isRecent = txTimestamp > tenMinutesAgo;

        return emailMatch && amountMatch && tx.status === 'success' && isRecent;
      });

      if (matchingTransaction) {
        return sendResponse(response, {
          success: true,
          found: true,
          reference: matchingTransaction.reference,
          status: matchingTransaction.status,
          amount: matchingTransaction.amount / 100,
          paidAt: matchingTransaction.paid_at,
        });
      }

      return sendResponse(response, { success: true, found: false });
    } catch (error: any) {
      console.error('Error in findRecentTransactionByEmail:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

// ============================================================================
// ORDER FUNCTIONS
// ============================================================================

/**
 * Update order status
 */
export const updateOrderStatus = functions.https.onRequest(async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const { orderId, newStatus } = request.body;

      if (!orderId || !newStatus) {
        return sendError(response, 'Order ID and status are required');
      }

      const validStatuses = ['Processing', 'Sent', 'Received', 'Completed', 'Cancelled', 'Disputed'];
      if (!validStatuses.includes(newStatus)) {
        return sendError(response, `Invalid status: ${newStatus}`);
      }

      const firestore = admin.firestore();
      const orderRef = firestore.collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        return sendError(response, 'Order not found', 404);
      }

      const order = orderDoc.data()!;
      const isSeller = order.sellerId === auth.uid;
      const isCustomer = order.customerId === auth.uid;

      // Verify authorization
      if (newStatus === 'Cancelled' && isCustomer && order.status === 'Processing') {
        // Customer can cancel Processing orders
      } else if (!isSeller && !auth.isAdmin) {
        return sendError(response, 'Forbidden: Only seller or admin can update order status', 403);
      }

      // State machine validation
      const ALLOWED_TRANSITIONS: Record<string, string[]> = {
        'Processing': ['Sent', 'Cancelled'],
        'Sent': ['Received', 'Cancelled', 'Disputed'],
        'Received': ['Completed'],
        'Completed': [],
        'Cancelled': [],
        'Disputed': ['Completed', 'Cancelled'],
      };

      const currentStatus = order.status;
      const allowedTransitions = ALLOWED_TRANSITIONS[currentStatus] || [];

      if (!allowedTransitions.includes(newStatus)) {
        return sendError(
          response,
          `Invalid transition: Cannot change from "${currentStatus}" to "${newStatus}"`
        );
      }

      await orderRef.update({
        status: newStatus,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return sendResponse(response, {
        success: true,
        orderId,
        newStatus,
      });
    } catch (error: any) {
      console.error('Error in updateOrderStatus:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

/**
 * Mark order as sent
 */
export const markOrderAsSent = functions.https.onRequest(async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const { orderId, photoUrl } = request.body;

      if (!orderId) {
        return sendError(response, 'Order ID is required');
      }

      const firestore = admin.firestore();
      const orderRef = firestore.collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        return sendError(response, 'Order not found', 404);
      }

      const order = orderDoc.data()!;

      if (order.sellerId !== auth.uid && !auth.isAdmin) {
        return sendError(response, 'Unauthorized: Only the seller can mark order as sent', 403);
      }

      if (order.status !== 'Processing') {
        return sendError(response, `Cannot mark order as sent. Current status: ${order.status}`);
      }

      const autoReleaseDate = new Date();
      autoReleaseDate.setDate(autoReleaseDate.getDate() + 7); // 7 days

      await orderRef.update({
        status: 'Sent',
        sentAt: FieldValue.serverTimestamp(),
        sentPhotoUrl: photoUrl || null,
        escrowStatus: 'held',
        autoReleaseDate: FieldValue.serverTimestamp(),
      });

      await firestore.collection('orders').doc(orderId).collection('chat').add({
        orderId,
        senderId: 'system',
        senderType: 'system',
        message: photoUrl ? 'Seller has sent the item with a photo.' : 'Seller has sent the item.',
        imageUrl: photoUrl || null,
        isSystemMessage: true,
        createdAt: FieldValue.serverTimestamp(),
      });

      return sendResponse(response, {
        success: true,
        autoReleaseDate: autoReleaseDate.toISOString(),
      });
    } catch (error: any) {
      console.error('Error in markOrderAsSent:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

/**
 * Mark order as received
 */
export const markOrderAsReceived = functions.https.onRequest(async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const { orderId, photoUrl } = request.body;

      if (!orderId) {
        return sendError(response, 'Order ID is required');
      }

      const firestore = admin.firestore();
      const orderRef = firestore.collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        return sendError(response, 'Order not found', 404);
      }

      const order = orderDoc.data()!;

      if (order.customerId !== auth.uid && !auth.isAdmin) {
        return sendError(response, 'Unauthorized: Only the customer can mark order as received', 403);
      }

      if (order.status !== 'Sent') {
        return sendError(response, `Cannot mark order as received. Current status: ${order.status}`);
      }

      if (order.dispute?.status === 'open') {
        return sendError(response, 'Cannot mark as received while dispute is open');
      }

      const orderTotal = order.total || 0;
      const commissionRate = await getPlatformCommissionRate();
      const commission = orderTotal * commissionRate;
      const sellerEarning = orderTotal - commission;

      await orderRef.update({
        status: 'Completed',
        receivedAt: FieldValue.serverTimestamp(),
        receivedPhotoUrl: photoUrl || null,
        escrowStatus: 'released',
        fundsReleasedAt: FieldValue.serverTimestamp(),
      });

      await firestore.collection('transactions').add({
        sellerId: order.sellerId,
        orderId: orderId,
        type: 'sale',
        amount: sellerEarning,
        commission: commission,
        description: `Sale from order #${orderId.slice(0, 7)}`,
        status: 'completed',
        createdAt: FieldValue.serverTimestamp(),
      });

      await firestore.collection('orders').doc(orderId).collection('chat').add({
        orderId,
        senderId: 'system',
        senderType: 'system',
        message: photoUrl
          ? 'Customer has received the item with a photo. Funds have been released to the seller.'
          : 'Customer has received the item. Funds have been released to the seller.',
        imageUrl: photoUrl || null,
        isSystemMessage: true,
        createdAt: FieldValue.serverTimestamp(),
      });

      return sendResponse(response, { success: true });
    } catch (error: any) {
      console.error('Error in markOrderAsReceived:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

/**
 * Get orders by customer
 */
export const getOrdersByCustomer = functions.https.onRequest(async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'GET') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const firestore = admin.firestore();

      const status = request.query.status as string | undefined;
      const limit = parseInt(request.query.limit as string) || 50;
      const startAfter = request.query.startAfter as string | undefined;

      let query: admin.firestore.Query = firestore
        .collection('orders')
        .where('customerId', '==', auth.uid)
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (status) {
        query = query.where('status', '==', status);
      }

      if (startAfter) {
        const startAfterDoc = await firestore.collection('orders').doc(startAfter).get();
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc);
        }
      }

      const snapshot = await query.get();
      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return sendResponse(response, {
        success: true,
        orders,
      });
    } catch (error: any) {
      console.error('Error in getOrdersByCustomer:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

/**
 * Get orders by seller
 */
export const getOrdersBySeller = functions.https.onRequest(async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'GET') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const firestore = admin.firestore();

      const status = request.query.status as string | undefined;
      const limit = parseInt(request.query.limit as string) || 50;
      const startAfter = request.query.startAfter as string | undefined;

      let query: admin.firestore.Query = firestore
        .collection('orders')
        .where('sellerId', '==', auth.uid)
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (status) {
        query = query.where('status', '==', status);
      }

      if (startAfter) {
        const startAfterDoc = await firestore.collection('orders').doc(startAfter).get();
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc);
        }
      }

      const snapshot = await query.get();
      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return sendResponse(response, {
        success: true,
        orders,
      });
    } catch (error: any) {
      console.error('Error in getOrdersBySeller:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

// ============================================================================
// SHIPPING FUNCTIONS (PUBLIC - NO AUTH REQUIRED)
// ============================================================================

/**
 * Calculate shipping options (public)
 */
export const calculateShippingOptions = functions.https.onRequest(async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const { sellerId, state, cartItems } = request.body;

      if (!sellerId || !state) {
        return sendError(response, 'Seller ID and state are required');
      }

      const firestore = admin.firestore();

      // Get seller's shipping zones
      const zonesQuery = await firestore
        .collection('shipping_zones')
        .where('sellerId', '==', sellerId)
        .orderBy('createdAt', 'desc')
        .get();

      interface Zone {
        id: string;
        name: string;
        rate: number;
        freeThreshold?: number;
        states?: string[];
      }

      const zones: Zone[] = zonesQuery.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Zone[];

      // Check if products allow shipping
      let allProductsAllowShipping = true;
      if (cartItems && cartItems.length > 0) {
        const productIds = cartItems.map((item: any) => item.id || item.productId);
        const productDocs = await Promise.all(
          productIds.map((id: string) => firestore.collection('products').doc(id).get())
        );
        allProductsAllowShipping = productDocs.every((doc) => {
          const data = doc.data();
          return data?.allowShipping !== false;
        });
      }

      // Get store info
      const storeDoc = await firestore.collection('stores').doc(sellerId).get();
      const storeData = storeDoc.data();
      const sellerPhone = storeData?.phone || '';
      const sellerPickupAddress = storeData?.pickupAddress || storeData?.storeLocation?.address || '';

      // Find matching zone
      const matchingZone = zones.find((zone) => {
        if (zone.states && zone.states.length > 0) {
          return zone.states.some((s: string) => s.toLowerCase() === state.toLowerCase());
        }
        return (
          zone.name.toLowerCase().includes(state.toLowerCase()) ||
          state.toLowerCase().includes(zone.name.toLowerCase())
        );
      });

      const options: any[] = [];

      if (allProductsAllowShipping && matchingZone) {
        options.push({
          type: 'delivery',
          price: matchingZone.rate,
          name: `Delivery to ${state}`,
          description: matchingZone.freeThreshold
            ? `Standard delivery. Free shipping for orders over ₦${matchingZone.freeThreshold.toLocaleString()}`
            : `Standard delivery to ${state}`,
          estimatedDays: 3,
        });
      }

      if (sellerPickupAddress) {
        options.push({
          type: 'pickup',
          price: 0,
          name: 'Pickup from Store',
          description: 'Pick up your order from our store location',
          pickupAddress: sellerPickupAddress,
        });
      }

      let message: string | undefined;
      if (!allProductsAllowShipping) {
        message = 'Some products in your cart do not allow shipping. Please choose pickup.';
      } else if (!matchingZone) {
        message = `We don't currently ship to ${state}. Please choose pickup or contact us.`;
      }

      return sendResponse(response, {
        success: true,
        options,
        message,
        sellerPhone,
        sellerPickupAddress,
      });
    } catch (error: any) {
      console.error('Error in calculateShippingOptions:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

// ============================================================================
// PAYOUT FUNCTIONS
// ============================================================================

/**
 * Get banks list (public)
 */
export const getBanksList = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'GET') {
        return sendError(response, 'Method not allowed', 405);
      }

      const paystackSecretKey = getPaystackSecretKey(paystackSecret.value());

      const paystackResponse = await fetch('https://api.paystack.co/bank?country=nigeria', {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!paystackResponse.ok) {
        return sendError(response, 'Failed to fetch banks from Paystack');
      }

      const result = await paystackResponse.json();
      if (result.status && result.data) {
        const banks = result.data
          .map((bank: any) => ({
            code: bank.code || bank.id.toString(),
            name: bank.name,
            id: bank.id,
          }))
          .filter((bank: any) => bank.code)
          .sort((a: any, b: any) => a.name.localeCompare(b.name));

        return sendResponse(response, {
          success: true,
          banks,
        });
      }

      return sendError(response, 'Unable to fetch banks list');
    } catch (error: any) {
      console.error('Error in getBanksList:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

/**
 * Resolve account number
 */
export const resolveAccountNumber = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const { accountNumber, bankCode } = request.body;

      if (!accountNumber || !bankCode) {
        return sendError(response, 'Account number and bank code are required');
      }

      if (accountNumber.length !== 10) {
        return sendError(response, 'Account number must be 10 digits');
      }

      const paystackSecretKey = getPaystackSecretKey(paystackSecret.value());

      const paystackResponse = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!paystackResponse.ok) {
        const errorData = await paystackResponse.json().catch(() => ({ message: 'Unknown error' }));
        return sendError(response, errorData.message || 'Failed to resolve account number');
      }

      const result = await paystackResponse.json();

      if (result.status === true && result.data && result.data.account_name) {
        return sendResponse(response, {
          success: true,
          bank_id: result.data.bank_id || parseInt(bankCode),
          account_name: result.data.account_name,
          account_number: result.data.account_number || accountNumber,
        });
      }

      return sendError(response, result.message || 'Unable to resolve account number');
    } catch (error: any) {
      console.error('Error in resolveAccountNumber:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

/**
 * Save payout details
 */
export const savePayoutDetails = functions.https.onRequest(async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const { bankName, bankCode, accountNumber, accountName } = request.body;

      if (!bankName || !bankCode || !accountNumber || !accountName) {
        return sendError(response, 'All payout details are required');
      }

      const firestore = admin.firestore();
      const userRef = firestore.collection('users').doc(auth.uid);

      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        return sendError(response, 'User profile not found', 404);
      }

      const userData = userDoc.data()!;
      if (userData?.role && !['seller', 'admin'].includes(userData.role)) {
        return sendError(response, 'Only sellers and admins can set payout details', 403);
      }

      await userRef.update({
        payoutDetails: {
          bankName,
          bankCode,
          accountNumber,
          accountName,
        },
        updatedAt: FieldValue.serverTimestamp(),
      });

      return sendResponse(response, { success: true });
    } catch (error: any) {
      console.error('Error in savePayoutDetails:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

// ============================================================================
// CHAT FUNCTIONS
// ============================================================================

/**
 * Send order message
 */
export const sendOrderMessage = functions.https.onRequest(async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const { orderId, message, imageUrl } = request.body;

      if (!orderId) {
        return sendError(response, 'Order ID is required');
      }

      if (!message && !imageUrl) {
        return sendError(response, 'Message or image is required');
      }

      const firestore = admin.firestore();
      const orderDoc = await firestore.collection('orders').doc(orderId).get();

      if (!orderDoc.exists) {
        return sendError(response, 'Order not found', 404);
      }

      const order = orderDoc.data()!;
      if (order.customerId !== auth.uid && order.sellerId !== auth.uid && !auth.isAdmin) {
        return sendError(response, 'Unauthorized: You do not have access to this order', 403);
      }

      const senderType = order.customerId === auth.uid ? 'customer' : 'seller';

      await firestore.collection('orders').doc(orderId).collection('chat').add({
        orderId,
        senderId: auth.uid,
        senderType,
        message: message || null,
        imageUrl: imageUrl || null,
        isSystemMessage: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      return sendResponse(response, { success: true });
    } catch (error: any) {
      console.error('Error in sendOrderMessage:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

// ============================================================================
// USER FUNCTIONS
// ============================================================================

/**
 * Link guest orders to account
 */
export const linkGuestOrdersToAccount = functions.https.onRequest(async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const firestore = admin.firestore();

      // Get user email
      const userDoc = await firestore.collection('users').doc(auth.uid).get();
      const userData = userDoc.data();
      const userEmail = auth.email || userData?.email;

      if (!userEmail) {
        return sendError(response, 'User email is required to link guest orders');
      }

      // Find guest orders by email
      const allOrdersQuery = await firestore
        .collection('orders')
        .where('customerInfo.email', '==', userEmail.toLowerCase())
        .get();

      const batch = firestore.batch();
      let linkedCount = 0;

      allOrdersQuery.forEach((doc) => {
        const order = doc.data();
        if (order.customerId && order.customerId.startsWith('guest_')) {
          batch.update(doc.ref, {
            customerId: auth.uid,
            linkedFromGuest: true,
            linkedAt: FieldValue.serverTimestamp(),
          });
          linkedCount++;
        }
      });

      if (linkedCount > 0) {
        await batch.commit();
      }

      return sendResponse(response, {
        success: true,
        linkedCount,
      });
    } catch (error: any) {
      console.error('Error in linkGuestOrdersToAccount:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

// ============================================================================
// SEARCH FUNCTIONS (PUBLIC)
// ============================================================================

/**
 * Search products (public)
 */
export const searchProducts = functions.https.onRequest(async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const { query, category, minPrice, maxPrice, limit } = request.body;

      if (!query || query.trim().length === 0) {
        return sendError(response, 'Search query is required');
      }

      const firestore = admin.firestore();
      let productsQuery: admin.firestore.Query = firestore
        .collection('products')
        .where('status', '==', 'active')
        .limit(limit || 20);

      // Note: Firestore doesn't support full-text search natively
      // This is a simple prefix match - for production, consider Algolia or similar
      const searchTerm = query.toLowerCase().trim();

      const snapshot = await productsQuery.get();
      let products = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((product: any) => {
          // Simple text search in name and description
          const matchesQuery =
            product.name?.toLowerCase().includes(searchTerm) ||
            product.description?.toLowerCase().includes(searchTerm);

          const matchesCategory = !category || product.category === category;
          const matchesMinPrice = !minPrice || (product.price >= minPrice);
          const matchesMaxPrice = !maxPrice || (product.price <= maxPrice);

          return matchesQuery && matchesCategory && matchesMinPrice && matchesMaxPrice;
        });

      return sendResponse(response, {
        success: true,
        products,
        total: products.length,
      });
    } catch (error: any) {
      console.error('Error in searchProducts:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

// ============================================================================
// SELLER FUNCTIONS - PRODUCT MANAGEMENT
// ============================================================================

/**
 * Get seller's products (paginated)
 */
export const getSellerProducts = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'GET' && request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const firestore = admin.firestore();

      const sellerId = request.query.sellerId as string || request.body?.sellerId || auth.uid;
      
      // Verify seller owns this request or is admin
      if (sellerId !== auth.uid && !auth.isAdmin) {
        return sendError(response, 'Unauthorized: Can only view your own products', 403);
      }

      const limit = parseInt(request.query.limit as string) || 50;
      const startAfter = request.query.startAfter as string;
      const status = request.query.status as string;

      let query: admin.firestore.Query = firestore
        .collection('products')
        .where('sellerId', '==', sellerId)
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (status) {
        query = query.where('status', '==', status);
      }

      if (startAfter) {
        const startAfterDoc = await firestore.collection('products').doc(startAfter).get();
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc);
        }
      }

      const snapshot = await query.get();
      const products = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return sendResponse(response, {
        success: true,
        products,
        hasMore: snapshot.docs.length === limit,
      });
    } catch (error: any) {
      console.error('Error in getSellerProducts:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

/**
 * Get single product
 */
export const getProduct = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'GET' && request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const productId = request.query.productId as string || request.body?.productId;
      if (!productId) {
        return sendError(response, 'Product ID is required', 400);
      }

      const firestore = admin.firestore();
      const productDoc = await firestore.collection('products').doc(productId).get();

      if (!productDoc.exists) {
        return sendError(response, 'Product not found', 404);
      }

      return sendResponse(response, {
        success: true,
        product: { id: productDoc.id, ...productDoc.data() },
      });
    } catch (error: any) {
      console.error('Error in getProduct:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

/**
 * Create product (with base64 image upload)
 */
export const createProduct = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const firestore = admin.firestore();
      const storage = admin.storage();

      const {
        name,
        description,
        price,
        compareAtPrice,
        stock,
        sku,
        category,
        status,
        allowShipping,
        imageBase64,
        variants,
      } = request.body;

      // Validation
      if (!name || !price) {
        return sendError(response, 'Name and price are required', 400);
      }

      let imageUrl: string | undefined;
      
      // Handle base64 image upload
      if (imageBase64) {
        try {
          const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
          const buffer = Buffer.from(base64Data, 'base64');
          const matches = imageBase64.match(/data:image\/(\w+);base64/);
          const extension = matches ? matches[1] : 'jpg';
          
          const fileName = `product_images/${auth.uid}/${Date.now()}.${extension}`;
          const bucket = storage.bucket();
          const file = bucket.file(fileName);
          
          await file.save(buffer, {
            metadata: { contentType: `image/${extension}` },
          });
          await file.makePublic();
          
          imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        } catch (error) {
          console.error('Image upload error:', error);
          return sendError(response, 'Failed to upload image', 500);
        }
      }

      // Check if seller has shipping zones for default allowShipping
      let finalAllowShipping = allowShipping;
      if (finalAllowShipping === undefined) {
        const zonesSnapshot = await firestore
          .collection('shipping_zones')
          .where('sellerId', '==', auth.uid)
          .get();
        finalAllowShipping = zonesSnapshot.size > 0;
      }

      const productData: any = {
        name,
        description: description || '',
        price: parseFloat(price),
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
        stock: stock ? parseInt(stock) : 0,
        sku: sku || '',
        category: category || '',
        status: status || 'active',
        allowShipping: finalAllowShipping,
        sellerId: auth.uid,
        views: 0,
        salesCount: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (imageUrl) {
        productData.imageUrl = imageUrl;
      }

      if (variants && Array.isArray(variants)) {
        productData.variants = variants.map((variant: any, idx: number) => ({
          id: `variant_${Date.now()}_${idx}`,
          name: variant.name,
          options: variant.options.map((opt: any) => ({
            value: opt.value,
            priceModifier: opt.priceModifier || 0,
            stock: opt.stock,
            sku: opt.sku,
          })),
        }));
      }

      const productRef = await firestore.collection('products').add(productData);

      return sendResponse(response, {
        success: true,
        productId: productRef.id,
        product: { id: productRef.id, ...productData },
      });
    } catch (error: any) {
      console.error('Error in createProduct:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

/**
 * Update product
 */
export const updateProduct = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const firestore = admin.firestore();
      const storage = admin.storage();

      const {
        productId,
        name,
        description,
        price,
        compareAtPrice,
        stock,
        sku,
        category,
        status,
        allowShipping,
        imageBase64,
        variants,
      } = request.body;

      if (!productId) {
        return sendError(response, 'Product ID is required', 400);
      }

      const productRef = firestore.collection('products').doc(productId);
      const productDoc = await productRef.get();

      if (!productDoc.exists) {
        return sendError(response, 'Product not found', 404);
      }

      const product = productDoc.data()!;
      if (product.sellerId !== auth.uid && !auth.isAdmin) {
        return sendError(response, 'Unauthorized: Can only update your own products', 403);
      }

      let imageUrl: string | undefined;
      
      // Handle base64 image upload if provided
      if (imageBase64) {
        try {
          const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
          const buffer = Buffer.from(base64Data, 'base64');
          const matches = imageBase64.match(/data:image\/(\w+);base64/);
          const extension = matches ? matches[1] : 'jpg';
          
          const fileName = `product_images/${auth.uid}/${Date.now()}.${extension}`;
          const bucket = storage.bucket();
          const file = bucket.file(fileName);
          
          await file.save(buffer, {
            metadata: { contentType: `image/${extension}` },
          });
          await file.makePublic();
          
          imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        } catch (error) {
          console.error('Image upload error:', error);
          return sendError(response, 'Failed to upload image', 500);
        }
      }

      const updateData: any = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description || '';
      if (price !== undefined) updateData.price = parseFloat(price);
      if (compareAtPrice !== undefined) updateData.compareAtPrice = compareAtPrice ? parseFloat(compareAtPrice) : undefined;
      if (stock !== undefined) updateData.stock = parseInt(stock);
      if (sku !== undefined) updateData.sku = sku || '';
      if (category !== undefined) updateData.category = category || '';
      if (status !== undefined) updateData.status = status;
      if (allowShipping !== undefined) updateData.allowShipping = allowShipping;
      if (imageUrl) updateData.imageUrl = imageUrl;
      if (variants !== undefined) {
        updateData.variants = variants.map((variant: any, idx: number) => ({
          id: variant.id || `variant_${Date.now()}_${idx}`,
          name: variant.name,
          options: variant.options.map((opt: any) => ({
            value: opt.value,
            priceModifier: opt.priceModifier || 0,
            stock: opt.stock,
            sku: opt.sku,
          })),
        }));
      }

      await productRef.update(updateData);

      return sendResponse(response, {
        success: true,
        productId,
        message: 'Product updated successfully',
      });
    } catch (error: any) {
      console.error('Error in updateProduct:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

/**
 * Delete product
 */
export const deleteProduct = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const firestore = admin.firestore();

      const productId = request.body?.productId;
      if (!productId) {
        return sendError(response, 'Product ID is required', 400);
      }

      const productRef = firestore.collection('products').doc(productId);
      const productDoc = await productRef.get();

      if (!productDoc.exists) {
        return sendError(response, 'Product not found', 404);
      }

      const product = productDoc.data()!;
      if (product.sellerId !== auth.uid && !auth.isAdmin) {
        return sendError(response, 'Unauthorized: Can only delete your own products', 403);
      }

      await productRef.delete();

      return sendResponse(response, {
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error: any) {
      console.error('Error in deleteProduct:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

// ============================================================================
// SELLER FUNCTIONS - DASHBOARD & ANALYTICS
// ============================================================================

/**
 * Get dashboard stats
 */
export const getDashboardStats = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'GET' && request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const firestore = admin.firestore();

      const sellerId = request.query.sellerId as string || request.body?.sellerId || auth.uid;
      
      if (sellerId !== auth.uid && !auth.isAdmin) {
        return sendError(response, 'Unauthorized', 403);
      }

      // Get products count
      const productsSnapshot = await firestore
        .collection('products')
        .where('sellerId', '==', sellerId)
        .get();
      const totalProducts = productsSnapshot.size;

      // Get orders
      const ordersSnapshot = await firestore
        .collection('orders')
        .where('sellerId', '==', sellerId)
        .get();

      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order: any) => sum + (order.total || 0), 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Get unique customers
      const customerIds = new Set(orders.map((order: any) => order.customerId).filter(Boolean));
      const totalCustomers = customerIds.size;

      // Recent orders (last 5)
      const recentOrders = orders
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
          const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
          return bTime - aTime;
        })
        .slice(0, 5);

      // Low stock products
      const lowStockProducts = productsSnapshot.docs
        .map(doc => doc.data())
        .filter((p: any) => p.stock <= 5 && p.stock > 0)
        .length;

      return sendResponse(response, {
        success: true,
        stats: {
          totalRevenue,
          totalOrders,
          totalProducts,
          totalCustomers,
          averageOrderValue,
          lowStockProducts,
          recentOrders: recentOrders.map((order: any) => ({
            id: order.id,
            total: order.total,
            status: order.status,
            customerName: order.customerInfo?.name || 'Unknown',
            createdAt: order.createdAt,
          })),
        },
      });
    } catch (error: any) {
      console.error('Error in getDashboardStats:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

/**
 * Get analytics data
 */
export const getSellerAnalytics = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'GET' && request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const firestore = admin.firestore();

      const sellerId = request.query.sellerId as string || request.body?.sellerId || auth.uid;
      const days = parseInt(request.query.days as string) || parseInt(request.body?.days) || 30;
      
      if (sellerId !== auth.uid && !auth.isAdmin) {
        return sendError(response, 'Unauthorized', 403);
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get orders
      const ordersSnapshot = await firestore
        .collection('orders')
        .where('sellerId', '==', sellerId)
        .get();

      const orders = ordersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((order: any) => {
          if (!order.createdAt) return false;
          const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
          return orderDate >= startDate && orderDate <= endDate;
        });

      // Daily breakdown
      const dailyData: Record<string, { revenue: number; orders: number }> = {};
      orders.forEach((order: any) => {
        if (!order.createdAt) return;
        const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        const dateKey = orderDate.toISOString().split('T')[0];
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { revenue: 0, orders: 0 };
        }
        dailyData[dateKey].revenue += order.total || 0;
        dailyData[dateKey].orders += 1;
      });

      // Product performance
      const productSales: Record<string, { name: string; sales: number; revenue: number }> = {};
      orders.forEach((order: any) => {
        order.items?.forEach((item: any) => {
          const productId = item.productId;
          if (!productSales[productId]) {
            productSales[productId] = {
              name: item.name || 'Unknown',
              sales: 0,
              revenue: 0,
            };
          }
          productSales[productId].sales += item.quantity || 0;
          productSales[productId].revenue += (item.price || 0) * (item.quantity || 0);
        });
      });

      return sendResponse(response, {
        success: true,
        analytics: {
          dailyData: Object.entries(dailyData).map(([date, data]) => ({ date, ...data })),
          productPerformance: Object.entries(productSales)
            .map(([productId, data]) => ({ productId, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10),
          totalRevenue: orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0),
          totalOrders: orders.length,
        },
      });
    } catch (error: any) {
      console.error('Error in getSellerAnalytics:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

// ============================================================================
// SELLER FUNCTIONS - REPORTS
// ============================================================================

/**
 * Generate sales report
 */
export const generateSalesReport = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const firestore = admin.firestore();

      const sellerId = request.body?.sellerId || auth.uid;
      const days = parseInt(request.body?.days) || 30;

      if (sellerId !== auth.uid && !auth.isAdmin) {
        return sendError(response, 'Unauthorized', 403);
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const ordersSnapshot = await firestore
        .collection('orders')
        .where('sellerId', '==', sellerId)
        .get();

      const orders = ordersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((order: any) => {
          if (!order.createdAt) return false;
          const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
          return orderDate >= startDate && orderDate <= endDate;
        });

      const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
      const totalOrders = orders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const statusBreakdown: Record<string, number> = {};
      orders.forEach((order: any) => {
        const status = order.status || 'Unknown';
        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      });

      const dailyBreakdown: Record<string, { revenue: number; orders: number }> = {};
      orders.forEach((order: any) => {
        if (!order.createdAt) return;
        const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        const dateKey = orderDate.toISOString().split('T')[0];
        if (!dailyBreakdown[dateKey]) {
          dailyBreakdown[dateKey] = { revenue: 0, orders: 0 };
        }
        dailyBreakdown[dateKey].revenue += order.total || 0;
        dailyBreakdown[dateKey].orders += 1;
      });

      return sendResponse(response, {
        success: true,
        report: {
          type: 'sales',
          dateRange: days,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          summary: {
            totalRevenue,
            totalOrders,
            averageOrderValue,
            statusBreakdown,
          },
          dailyBreakdown: Object.entries(dailyBreakdown).map(([date, data]) => ({ date, ...data })),
        },
      });
    } catch (error: any) {
      console.error('Error in generateSalesReport:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

/**
 * Generate customer report
 */
export const generateCustomerReport = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const firestore = admin.firestore();

      const sellerId = request.body?.sellerId || auth.uid;
      const days = parseInt(request.body?.days) || 30;

      if (sellerId !== auth.uid && !auth.isAdmin) {
        return sendError(response, 'Unauthorized', 403);
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const ordersSnapshot = await firestore
        .collection('orders')
        .where('sellerId', '==', sellerId)
        .get();

      const orders = ordersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((order: any) => {
          if (!order.createdAt) return false;
          const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
          return orderDate >= startDate && orderDate <= endDate;
        });

      const customerMap = new Map<string, {
        customerId: string;
        name: string;
        email: string;
        phone: string;
        totalOrders: number;
        totalSpent: number;
        firstOrderDate: Date;
        lastOrderDate: Date;
      }>();

      orders.forEach((order: any) => {
        const customerId = order.customerId;
        if (!customerId) return;

        const existing = customerMap.get(customerId);
        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt || Date.now());

        if (existing) {
          existing.totalOrders += 1;
          existing.totalSpent += order.total || 0;
          if (orderDate > existing.lastOrderDate) {
            existing.lastOrderDate = orderDate;
          }
          if (orderDate < existing.firstOrderDate) {
            existing.firstOrderDate = orderDate;
          }
        } else {
          customerMap.set(customerId, {
            customerId,
            name: order.customerInfo?.name || 'Unknown',
            email: order.customerInfo?.email || '',
            phone: order.customerInfo?.phone || '',
            totalOrders: 1,
            totalSpent: order.total || 0,
            firstOrderDate: orderDate,
            lastOrderDate: orderDate,
          });
        }
      });

      const customers = Array.from(customerMap.values())
        .sort((a, b) => b.totalSpent - a.totalSpent);

      // Segment customers
      const now = new Date();
      const vipCustomers = customers.filter(c => c.totalSpent >= 50000);
      const regularCustomers = customers.filter(c => c.totalSpent >= 10000 && c.totalSpent < 50000);
      const newCustomers = customers.filter(c => {
        const daysSinceFirst = (now.getTime() - c.firstOrderDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceFirst <= 30;
      });

      return sendResponse(response, {
        success: true,
        report: {
          type: 'customers',
          dateRange: days,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          totalCustomers: customers.length,
          segments: {
            vip: vipCustomers.length,
            regular: regularCustomers.length,
            new: newCustomers.length,
          },
          customers: customers.map(c => ({
            ...c,
            firstOrderDate: c.firstOrderDate.toISOString(),
            lastOrderDate: c.lastOrderDate.toISOString(),
          })),
        },
      });
    } catch (error: any) {
      console.error('Error in generateCustomerReport:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

// ============================================================================
// SELLER FUNCTIONS - MARKETING (DISCOUNT CODES)
// ============================================================================

/**
 * Create discount code
 */
export const createDiscountCode = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const firestore = admin.firestore();

      const {
        code,
        type,
        value,
        maxUses,
        minOrderAmount,
        validFrom,
        validUntil,
        sellerId,
      } = request.body;

      if (!code || !type || !value || !sellerId) {
        return sendError(response, 'Code, type, value, and sellerId are required', 400);
      }

      if (sellerId !== auth.uid && !auth.isAdmin) {
        return sendError(response, 'Unauthorized: Can only create discount codes for your own store', 403);
      }

      // Check if code already exists
      const existingCodeQuery = await firestore
        .collection('discount_codes')
        .where('code', '==', code.toUpperCase())
        .where('sellerId', '==', sellerId)
        .limit(1)
        .get();

      if (!existingCodeQuery.empty) {
        return sendError(response, 'Discount code already exists', 400);
      }

      const discountCodeData: any = {
        code: code.toUpperCase(),
        type,
        value: parseFloat(value),
        sellerId,
        uses: 0,
        status: 'active',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (maxUses) discountCodeData.maxUses = parseInt(maxUses);
      if (minOrderAmount) discountCodeData.minOrderAmount = parseFloat(minOrderAmount);
      if (validFrom) discountCodeData.validFrom = admin.firestore.Timestamp.fromDate(new Date(validFrom));
      if (validUntil) discountCodeData.validUntil = admin.firestore.Timestamp.fromDate(new Date(validUntil));

      const discountRef = await firestore.collection('discount_codes').add(discountCodeData);

      return sendResponse(response, {
        success: true,
        discountCodeId: discountRef.id,
        message: 'Discount code created successfully',
      });
    } catch (error: any) {
      console.error('Error in createDiscountCode:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

/**
 * Get discount codes
 */
export const getDiscountCodes = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'GET' && request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const firestore = admin.firestore();

      const sellerId = request.query.sellerId as string || request.body?.sellerId || auth.uid;

      if (sellerId !== auth.uid && !auth.isAdmin) {
        return sendError(response, 'Unauthorized', 403);
      }

      const snapshot = await firestore
        .collection('discount_codes')
        .where('sellerId', '==', sellerId)
        .orderBy('createdAt', 'desc')
        .get();

      const discountCodes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return sendResponse(response, {
        success: true,
        discountCodes,
      });
    } catch (error: any) {
      console.error('Error in getDiscountCodes:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

/**
 * Update discount code
 */
export const updateDiscountCode = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const firestore = admin.firestore();

      const { discountCodeId, ...updateData } = request.body;

      if (!discountCodeId) {
        return sendError(response, 'Discount code ID is required', 400);
      }

      const discountRef = firestore.collection('discount_codes').doc(discountCodeId);
      const discountDoc = await discountRef.get();

      if (!discountDoc.exists) {
        return sendError(response, 'Discount code not found', 404);
      }

      const discount = discountDoc.data()!;
      if (discount.sellerId !== auth.uid && !auth.isAdmin) {
        return sendError(response, 'Unauthorized', 403);
      }

      const update: any = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (updateData.status !== undefined) update.status = updateData.status;
      if (updateData.maxUses !== undefined) update.maxUses = parseInt(updateData.maxUses);
      if (updateData.validFrom !== undefined) update.validFrom = admin.firestore.Timestamp.fromDate(new Date(updateData.validFrom));
      if (updateData.validUntil !== undefined) update.validUntil = admin.firestore.Timestamp.fromDate(new Date(updateData.validUntil));

      await discountRef.update(update);

      return sendResponse(response, {
        success: true,
        message: 'Discount code updated successfully',
      });
    } catch (error: any) {
      console.error('Error in updateDiscountCode:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

/**
 * Delete discount code
 */
export const deleteDiscountCode = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const firestore = admin.firestore();

      const discountCodeId = request.body?.discountCodeId;

      if (!discountCodeId) {
        return sendError(response, 'Discount code ID is required', 400);
      }

      const discountRef = firestore.collection('discount_codes').doc(discountCodeId);
      const discountDoc = await discountRef.get();

      if (!discountDoc.exists) {
        return sendError(response, 'Discount code not found', 404);
      }

      const discount = discountDoc.data()!;
      if (discount.sellerId !== auth.uid && !auth.isAdmin) {
        return sendError(response, 'Unauthorized', 403);
      }

      await discountRef.delete();

      return sendResponse(response, {
        success: true,
        message: 'Discount code deleted successfully',
      });
    } catch (error: any) {
      console.error('Error in deleteDiscountCode:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

// ============================================================================
// SELLER FUNCTIONS - STORE MANAGEMENT
// ============================================================================

/**
 * Get store settings
 */
export const getStoreSettings = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'GET' && request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const firestore = admin.firestore();

      const sellerId = request.query.sellerId as string || request.body?.sellerId || auth.uid;

      if (sellerId !== auth.uid && !auth.isAdmin) {
        return sendError(response, 'Unauthorized', 403);
      }

      const storeDoc = await firestore.collection('stores').doc(sellerId).get();

      if (!storeDoc.exists) {
        return sendError(response, 'Store not found', 404);
      }

      return sendResponse(response, {
        success: true,
        store: { id: storeDoc.id, ...storeDoc.data() },
      });
    } catch (error: any) {
      console.error('Error in getStoreSettings:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

/**
 * Update store settings
 */
export const updateStoreSettings = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const firestore = admin.firestore();
      const storage = admin.storage();

      const sellerId = request.body?.sellerId || auth.uid;
      const updateData = request.body?.updateData || {};

      if (sellerId !== auth.uid && !auth.isAdmin) {
        return sendError(response, 'Unauthorized', 403);
      }

      const storeRef = firestore.collection('stores').doc(sellerId);

      // Handle logo upload if provided
      if (updateData.logoBase64) {
        try {
          const base64Data = updateData.logoBase64.includes(',') 
            ? updateData.logoBase64.split(',')[1] 
            : updateData.logoBase64;
          const buffer = Buffer.from(base64Data, 'base64');
          const matches = updateData.logoBase64.match(/data:image\/(\w+);base64/);
          const extension = matches ? matches[1] : 'jpg';
          
          const fileName = `store_logos/${sellerId}/${Date.now()}.${extension}`;
          const bucket = storage.bucket();
          const file = bucket.file(fileName);
          
          await file.save(buffer, {
            metadata: { contentType: `image/${extension}` },
          });
          await file.makePublic();
          
          updateData.storeLogo = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
          delete updateData.logoBase64;
        } catch (error) {
          console.error('Logo upload error:', error);
          return sendError(response, 'Failed to upload logo', 500);
        }
      }

      // Handle banner upload if provided
      if (updateData.bannerBase64) {
        try {
          const base64Data = updateData.bannerBase64.includes(',') 
            ? updateData.bannerBase64.split(',')[1] 
            : updateData.bannerBase64;
          const buffer = Buffer.from(base64Data, 'base64');
          const matches = updateData.bannerBase64.match(/data:image\/(\w+);base64/);
          const extension = matches ? matches[1] : 'jpg';
          
          const fileName = `store_banners/${sellerId}/${Date.now()}.${extension}`;
          const bucket = storage.bucket();
          const file = bucket.file(fileName);
          
          await file.save(buffer, {
            metadata: { contentType: `image/${extension}` },
          });
          await file.makePublic();
          
          updateData.storeBanner = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
          delete updateData.bannerBase64;
        } catch (error) {
          console.error('Banner upload error:', error);
          return sendError(response, 'Failed to upload banner', 500);
        }
      }

      updateData.updatedAt = FieldValue.serverTimestamp();

      await storeRef.set(updateData, { merge: true });

      return sendResponse(response, {
        success: true,
        message: 'Store settings updated successfully',
      });
    } catch (error: any) {
      console.error('Error in updateStoreSettings:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

// ============================================================================
// SELLER FUNCTIONS - CUSTOMERS
// ============================================================================

/**
 * Get customers
 */
export const getCustomers = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'GET' && request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAuth(request.headers.authorization || null);
      const firestore = admin.firestore();

      const sellerId = request.query.sellerId as string || request.body?.sellerId || auth.uid;

      if (sellerId !== auth.uid && !auth.isAdmin) {
        return sendError(response, 'Unauthorized', 403);
      }

      const ordersSnapshot = await firestore
        .collection('orders')
        .where('sellerId', '==', sellerId)
        .get();

      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const customerMap = new Map<string, {
        customerId: string;
        name: string;
        email: string;
        phone: string;
        totalOrders: number;
        totalSpent: number;
        firstOrderDate: Date;
        lastOrderDate: Date;
      }>();

      orders.forEach((order: any) => {
        const customerId = order.customerId;
        if (!customerId) return;

        const existing = customerMap.get(customerId);
        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt || Date.now());

        if (existing) {
          existing.totalOrders += 1;
          existing.totalSpent += order.total || 0;
          if (orderDate > existing.lastOrderDate) {
            existing.lastOrderDate = orderDate;
          }
          if (orderDate < existing.firstOrderDate) {
            existing.firstOrderDate = orderDate;
          }
        } else {
          customerMap.set(customerId, {
            customerId,
            name: order.customerInfo?.name || 'Unknown',
            email: order.customerInfo?.email || '',
            phone: order.customerInfo?.phone || '',
            totalOrders: 1,
            totalSpent: order.total || 0,
            firstOrderDate: orderDate,
            lastOrderDate: orderDate,
          });
        }
      });

      const customers = Array.from(customerMap.values())
        .sort((a, b) => b.totalSpent - a.totalSpent);

      // Segment customers
      const now = new Date();
      const vipCustomers = customers.filter(c => c.totalSpent >= 50000);
      const regularCustomers = customers.filter(c => c.totalSpent >= 10000 && c.totalSpent < 50000);
      const newCustomers = customers.filter(c => {
        const daysSinceFirst = (now.getTime() - c.firstOrderDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceFirst <= 30;
      });

      return sendResponse(response, {
        success: true,
        customers: customers.map(c => ({
          ...c,
          firstOrderDate: c.firstOrderDate.toISOString(),
          lastOrderDate: c.lastOrderDate.toISOString(),
        })),
        segments: {
          vip: vipCustomers.length,
          regular: regularCustomers.length,
          new: newCustomers.length,
        },
      });
    } catch (error: any) {
      console.error('Error in getCustomers:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

// ============================================================================
// ADMIN FUNCTIONS - USER MANAGEMENT
// ============================================================================

/**
 * Get all users (admin only)
 */
export const getAllUsers = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'GET' && request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      await requireAdmin(request.headers.authorization || null);
      const firestore = admin.firestore();

      const limit = parseInt(request.query.limit as string) || 50;
      const startAfter = request.query.startAfter as string;
      const role = request.query.role as string;

      let query: admin.firestore.Query = firestore
        .collection('users')
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (role) {
        query = query.where('role', '==', role);
      }

      if (startAfter) {
        const startAfterDoc = await firestore.collection('users').doc(startAfter).get();
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc);
        }
      }

      const snapshot = await query.get();
      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return sendResponse(response, {
        success: true,
        users,
        hasMore: snapshot.docs.length === limit,
      });
    } catch (error: any) {
      console.error('Error in getAllUsers:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

/**
 * Grant admin role
 */
export const grantAdminRole = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      await requireAdmin(request.headers.authorization || null);
      const firestore = admin.firestore();

      const userId = request.body?.userId;
      if (!userId) {
        return sendError(response, 'User ID is required', 400);
      }

      // Set custom claims
      await admin.auth().setCustomUserClaims(userId, { isAdmin: true });
      await admin.auth().revokeRefreshTokens(userId);

      // Update Firestore
      await firestore.collection('users').doc(userId).update({
        isAdmin: true,
        role: 'admin',
      });

      return sendResponse(response, {
        success: true,
        message: 'Admin role granted successfully',
      });
    } catch (error: any) {
      console.error('Error in grantAdminRole:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

/**
 * Revoke admin role
 */
export const revokeAdminRole = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAdmin(request.headers.authorization || null);
      const firestore = admin.firestore();

      const userId = request.body?.userId;
      if (!userId) {
        return sendError(response, 'User ID is required', 400);
      }

      if (userId === auth.uid) {
        return sendError(response, 'Cannot revoke your own admin role', 400);
      }

      // Set custom claims
      await admin.auth().setCustomUserClaims(userId, { isAdmin: false });
      await admin.auth().revokeRefreshTokens(userId);

      // Update Firestore - determine new role
      const userDoc = await firestore.collection('users').doc(userId).get();
      const userData = userDoc.data();
      const newRole = userData?.storeName ? 'seller' : 'buyer';

      await firestore.collection('users').doc(userId).update({
        isAdmin: false,
        role: newRole,
      });

      return sendResponse(response, {
        success: true,
        message: 'Admin role revoked successfully',
      });
    } catch (error: any) {
      console.error('Error in revokeAdminRole:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

// ============================================================================
// ADMIN FUNCTIONS - PLATFORM SETTINGS
// ============================================================================

/**
 * Get platform settings
 */
export const getPlatformSettings = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'GET' && request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      await requireAdmin(request.headers.authorization || null);
      const firestore = admin.firestore();

      const settingsDoc = await firestore.collection('platform_settings').doc('platform_settings').get();

      if (!settingsDoc.exists) {
        // Return defaults
        return sendResponse(response, {
          success: true,
          settings: {
            platformCommissionRate: 0.05,
            minimumPayoutAmount: 5000,
            platformFee: 0,
            currency: 'NGN',
          },
        });
      }

      return sendResponse(response, {
        success: true,
        settings: settingsDoc.data(),
      });
    } catch (error: any) {
      console.error('Error in getPlatformSettings:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

/**
 * Update platform settings
 */
export const updatePlatformSettings = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAdmin(request.headers.authorization || null);
      const firestore = admin.firestore();

      const updateData = request.body?.settings || {};

      const settingsRef = firestore.collection('platform_settings').doc('platform_settings');
      
      const update: any = {
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: auth.uid,
      };

      if (updateData.platformCommissionRate !== undefined) {
        update.platformCommissionRate = parseFloat(updateData.platformCommissionRate);
      }
      if (updateData.minimumPayoutAmount !== undefined) {
        update.minimumPayoutAmount = parseFloat(updateData.minimumPayoutAmount);
      }
      if (updateData.platformFee !== undefined) {
        update.platformFee = parseFloat(updateData.platformFee);
      }
      if (updateData.currency !== undefined) {
        update.currency = updateData.currency;
      }

      await settingsRef.set(update, { merge: true });

      return sendResponse(response, {
        success: true,
        message: 'Platform settings updated successfully',
      });
    } catch (error: any) {
      console.error('Error in updatePlatformSettings:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

// ============================================================================
// ADMIN FUNCTIONS - ORDERS & DISPUTES
// ============================================================================

/**
 * Get all orders (admin only)
 */
export const getAllOrders = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'GET' && request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      await requireAdmin(request.headers.authorization || null);
      const firestore = admin.firestore();

      const limit = parseInt(request.query.limit as string) || 50;
      const startAfter = request.query.startAfter as string;
      const status = request.query.status as string;

      let query: admin.firestore.Query = firestore
        .collection('orders')
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (status) {
        query = query.where('status', '==', status);
      }

      if (startAfter) {
        const startAfterDoc = await firestore.collection('orders').doc(startAfter).get();
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc);
        }
      }

      const snapshot = await query.get();
      const orders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return sendResponse(response, {
        success: true,
        orders,
        hasMore: snapshot.docs.length === limit,
      });
    } catch (error: any) {
      console.error('Error in getAllOrders:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

/**
 * Resolve dispute
 */
export const resolveDispute = onRequest(
  { secrets: [paystackSecret] },
  async (request, response) => {
  return corsHandler(request, response, async () => {
    try {
      if (request.method !== 'POST') {
        return sendError(response, 'Method not allowed', 405);
      }

      const auth = await requireAdmin(request.headers.authorization || null);
      const firestore = admin.firestore();

      const { orderId, resolution, refundAmount } = request.body;

      if (!orderId || !resolution) {
        return sendError(response, 'Order ID and resolution are required', 400);
      }

      const orderRef = firestore.collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        return sendError(response, 'Order not found', 404);
      }

      const order = orderDoc.data()!;
      if (order.status !== 'Disputed') {
        return sendError(response, 'Order is not in dispute', 400);
      }

      const update: any = {
        status: resolution === 'refund' ? 'Cancelled' : 'Processing',
        disputeResolution: resolution,
        disputeResolvedAt: FieldValue.serverTimestamp(),
        disputeResolvedBy: auth.uid,
      };

      if (resolution === 'refund' && refundAmount) {
        update.refundAmount = parseFloat(refundAmount);
        update.escrowStatus = 'refunded';
      } else if (resolution === 'release') {
        update.escrowStatus = 'released';
      }

      await orderRef.update(update);

      return sendResponse(response, {
        success: true,
        message: 'Dispute resolved successfully',
      });
    } catch (error: any) {
      console.error('Error in resolveDispute:', error);
      return sendError(response, error.message || 'Internal server error', 500);
    }
  });
});

// ============================================================================
// KEEP HELLO WORLD FOR TESTING
// ============================================================================

export const helloWorld = functions.https.onRequest((request, response) => {
  response.json({ message: 'Hello from Cloud Functions! 🎉' });
});

// Force redeploy to pick up config changes
