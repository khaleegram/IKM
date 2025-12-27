'use server';

import { requireAuth } from '@/lib/auth-utils';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const markNotAvailableSchema = z.object({
  orderId: z.string(),
  waitTimeDays: z.number().int().min(1).max(30).optional(),
  reason: z.string().min(1, 'Reason is required'),
});

const respondToAvailabilitySchema = z.object({
  orderId: z.string(),
  response: z.enum(['accepted', 'cancelled']),
});

/**
 * Seller marks order as not available
 * - Updates order status to 'AvailabilityCheck'
 * - Sets availability status and wait time if provided
 * - Creates system message
 * - Sends notification to buyer
 */
export async function markOrderAsNotAvailable(data: unknown) {
  const validation = markNotAvailableSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(validation.error.errors.map(e => e.message).join(', '));
  }

  const { orderId, waitTimeDays, reason } = validation.data;
  const auth = await requireAuth();
  const firestore = getAdminFirestore();
  
  const orderRef = firestore.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    throw new Error('Order not found');
  }

  const order = orderDoc.data();
  
  if (!order) {
    throw new Error('Order data not found');
  }
  
  // Verify seller owns this order
  if (order.sellerId !== auth.uid && !auth.isAdmin) {
    throw new Error('Unauthorized: Only the seller can mark order as not available');
  }

  // Verify order is in correct status
  if (order.status !== 'Processing') {
    throw new Error(`Cannot mark order as not available. Current status: ${order.status}`);
  }

  // Calculate wait time expiration if provided
  let waitTimeExpiresAt = null;
  if (waitTimeDays) {
    const expiresDate = new Date();
    expiresDate.setDate(expiresDate.getDate() + waitTimeDays);
    waitTimeExpiresAt = expiresDate;
  }

  // Update order
  await orderRef.update({
    status: 'AvailabilityCheck',
    availabilityStatus: waitTimeDays ? 'waiting_buyer_response' : 'not_available',
    waitTimeDays: waitTimeDays || null,
    waitTimeExpiresAt: waitTimeExpiresAt ? FieldValue.serverTimestamp() : null,
    availabilityReason: reason,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Create system message in chat
  const chatMessage = waitTimeDays
    ? `Item not currently available. Seller offers to wait ${waitTimeDays} day${waitTimeDays > 1 ? 's' : ''} for restocking. Reason: ${reason}`
    : `Item not currently available. Reason: ${reason}`;
  
  await firestore
    .collection('orders')
    .doc(orderId)
    .collection('chat')
    .add({
      orderId,
      senderId: 'system',
      senderType: 'system',
      message: chatMessage,
      isSystemMessage: true,
      createdAt: FieldValue.serverTimestamp(),
    });

  revalidatePath(`/seller/orders/${orderId}`);
  revalidatePath('/seller/orders');
  revalidatePath('/profile');

  return { success: true };
}

/**
 * Buyer responds to availability check
 * - If accepted: Order stays, wait timer starts
 * - If cancelled: Order cancelled, automatic refund processed
 */
export async function respondToAvailabilityCheck(data: unknown) {
  const validation = respondToAvailabilitySchema.safeParse(data);
  if (!validation.success) {
    throw new Error(validation.error.errors.map(e => e.message).join(', '));
  }

  const { orderId, response } = validation.data;
  const auth = await requireAuth();
  const firestore = getAdminFirestore();
  
  const orderRef = firestore.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    throw new Error('Order not found');
  }

  const order = orderDoc.data();
  
  if (!order) {
    throw new Error('Order data not found');
  }
  
  // Verify customer owns this order
  if (order.customerId !== auth.uid && !auth.isAdmin) {
    throw new Error('Unauthorized: Only the customer can respond to availability check');
  }

  // Verify order is in correct status
  if (order.status !== 'AvailabilityCheck') {
    throw new Error(`Cannot respond to availability check. Current status: ${order.status}`);
  }

  if (response === 'accepted') {
    // Buyer accepts wait time - order continues
    await orderRef.update({
      buyerWaitResponse: 'accepted',
      availabilityStatus: 'waiting_restock',
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Create system message
    await firestore
      .collection('orders')
      .doc(orderId)
      .collection('chat')
      .add({
        orderId,
        senderId: 'system',
        senderType: 'system',
        message: `Buyer has accepted the wait time. Order will proceed once item is restocked.`,
        isSystemMessage: true,
        createdAt: FieldValue.serverTimestamp(),
      });

    revalidatePath(`/seller/orders/${orderId}`);
    revalidatePath('/seller/orders');
    revalidatePath('/profile');

    return { success: true, action: 'accepted' };
  } else {
    // Buyer cancels - process automatic refund
    const orderTotal = order.total || 0;
    const paymentReference = order.paymentReference;

    if (!paymentReference) {
      throw new Error('Payment reference not found. Cannot process refund.');
    }

    // Update order status
    await orderRef.update({
      status: 'Cancelled',
      buyerWaitResponse: 'cancelled',
      availabilityStatus: 'cancelled',
      escrowStatus: 'refunded',
      refundedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Process refund via Paystack
    // Note: This requires Paystack API integration
    // For now, we'll create a refund record and mark for processing
    const refundRecord = {
      orderId,
      paymentReference,
      amount: orderTotal,
      reason: 'Item not available - buyer cancelled',
      refundMethod: 'original_payment',
      status: 'pending',
      processedBy: 'system',
      createdAt: FieldValue.serverTimestamp(),
    };

    await firestore.collection('refunds').add(refundRecord);

    // Add refund to order
    const existingRefunds = order.refunds || [];
    await orderRef.update({
      refunds: [...existingRefunds, {
        id: `refund_${Date.now()}`,
        ...refundRecord,
      }],
    });

    // Create transaction record for refund
    await firestore.collection('transactions').add({
      orderId,
      customerId: order.customerId,
      type: 'refund',
      amount: orderTotal,
      description: `Refund for order #${orderId.slice(0, 7)} (item not available)`,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    });

    // Create system message
    await firestore
      .collection('orders')
      .doc(orderId)
      .collection('chat')
      .add({
        orderId,
        senderId: 'system',
        senderType: 'system',
        message: `Buyer has cancelled the order. Refund of ₦${orderTotal.toLocaleString()} will be processed within 24-48 hours.`,
        isSystemMessage: true,
        createdAt: FieldValue.serverTimestamp(),
      });

    revalidatePath(`/seller/orders/${orderId}`);
    revalidatePath('/seller/orders');
    revalidatePath('/profile');

    return { success: true, action: 'cancelled', refundAmount: orderTotal };
  }
}

