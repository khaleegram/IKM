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
  shippingType: z.enum(['delivery', 'pickup']).optional(),
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

      // Handle guest checkout
      let finalCustomerId = auth?.uid;
      let isGuestOrder = false;

      if (!finalCustomerId) {
        if (!customerInfo?.email) {
          return sendError(response, 'Email is required for guest checkout');
        }
        isGuestOrder = true;
        const guestId = `guest_${customerInfo.email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
        const guestUserRef = firestore.collection('users').doc(guestId);
        const guestUserDoc = await guestUserRef.get();

        if (!guestUserDoc.exists) {
          await guestUserRef.set({
            email: customerInfo.email,
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

      // Create order
      const sellerId = cartItems[0].sellerId;
      const commissionRate = await getPlatformCommissionRate();

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
      };

      const orderRef = await firestore.collection('orders').add(orderData);

      // Decrement product stock
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
      }

      // Increment discount code usage if applied
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

            await discountDoc.ref.update({
              uses: currentUses + 1,
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        } catch (error) {
          console.error('Failed to increment discount code usage:', error);
        }
      }

      // Create initial chat messages
      await firestore.collection('orders').doc(orderRef.id).collection('chat').add({
        orderId: orderRef.id,
        senderId: 'system',
        senderType: 'system',
        message: 'Order created successfully. Payment verified.',
        isSystemMessage: true,
        createdAt: FieldValue.serverTimestamp(),
      });

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
// KEEP HELLO WORLD FOR TESTING
// ============================================================================

export const helloWorld = functions.https.onRequest((request, response) => {
  response.json({ message: 'Hello from Cloud Functions! 🎉' });
});

// Force redeploy to pick up config changes
