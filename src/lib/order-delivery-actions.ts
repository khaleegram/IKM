'use server';

import { requireAuth } from '@/lib/auth-utils';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { getPlatformCommissionRate } from '@/lib/platform-settings-actions';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Auto-release days (configurable)
const AUTO_RELEASE_DAYS = 7; // 7 days after "Sent" if no dispute

const markAsSentSchema = z.object({
  orderId: z.string(),
  photoUrl: z.union([z.string().url(), z.literal(''), z.undefined()]).optional(),
});

/**
 * Seller marks order as sent
 * - Updates order status to "Sent"
 * - Optionally saves photo
 * - Creates system message in chat
 * - Sets auto-release date
 */
export async function markOrderAsSent(data: unknown) {
  const validation = markAsSentSchema.safeParse(data);
  if (!validation.success) {
    throw new Error('Invalid data');
  }

  const { orderId, photoUrl } = validation.data;
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
    throw new Error('Unauthorized: Only the seller can mark order as sent');
  }

  // Verify order is in correct status
  if (order.status !== 'Processing') {
    throw new Error(`Cannot mark order as sent. Current status: ${order.status}`);
  }

  // Calculate auto-release date (X days from now)
  const autoReleaseDate = new Date();
  autoReleaseDate.setDate(autoReleaseDate.getDate() + AUTO_RELEASE_DAYS);

  // Update order
  await orderRef.update({
    status: 'Sent',
    sentAt: FieldValue.serverTimestamp(),
    sentPhotoUrl: photoUrl || null,
    escrowStatus: 'held',
    autoReleaseDate: FieldValue.serverTimestamp(), // Will be calculated on read
  });

  // Create system message in chat
  const chatMessage = photoUrl
    ? 'Seller has sent the item'
    : 'Seller has sent the item';
  
  await firestore
    .collection('orders')
    .doc(orderId)
    .collection('chat')
    .add({
      orderId,
      senderId: 'system',
      senderType: 'system',
      message: chatMessage,
      imageUrl: photoUrl || null,
      isSystemMessage: true,
      createdAt: FieldValue.serverTimestamp(),
    });

  revalidatePath(`/seller/orders/${orderId}`);
  revalidatePath('/seller/orders');
  revalidatePath('/profile');

  return { success: true, autoReleaseDate: autoReleaseDate.toISOString() };
}

const markAsReceivedSchema = z.object({
  orderId: z.string(),
  photoUrl: z.union([z.string().url(), z.literal(''), z.undefined()]).optional(),
});

/**
 * Customer marks order as received
 * - Updates order status to "Received" then "Completed"
 * - Optionally saves photo
 * - Creates system message in chat
 * - Releases escrow funds to seller
 */
export async function markOrderAsReceived(data: unknown) {
  const validation = markAsReceivedSchema.safeParse(data);
  if (!validation.success) {
    throw new Error('Invalid data');
  }

  const { orderId, photoUrl } = validation.data;
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
    throw new Error('Unauthorized: Only the customer can mark order as received');
  }

  // Verify order is in correct status
  if (order.status !== 'Sent') {
    throw new Error(`Cannot mark order as received. Current status: ${order.status}`);
  }

  // Check if dispute is open
  if (order.dispute?.status === 'open') {
    throw new Error('Cannot mark as received while dispute is open');
  }

  // Update order to Completed and release escrow
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

  // Create transaction record for seller earnings
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

  // Create system message in chat
  const chatMessage = photoUrl
    ? 'Customer has received the item'
    : 'Customer has received the item';
  
  await firestore
    .collection('orders')
    .doc(orderId)
    .collection('chat')
    .add({
      orderId,
      senderId: 'system',
      senderType: 'system',
      message: chatMessage,
      imageUrl: photoUrl || null,
      isSystemMessage: true,
      createdAt: FieldValue.serverTimestamp(),
    });

  revalidatePath(`/seller/orders/${orderId}`);
  revalidatePath('/seller/orders');
  revalidatePath('/profile');
  revalidatePath('/seller/payouts');

  return { success: true };
}

/**
 * Auto-release escrow funds after X days if no dispute
 * This should be called by a scheduled job/cron
 */
export async function autoReleaseEscrow() {
  const firestore = getAdminFirestore();
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - AUTO_RELEASE_DAYS * 24 * 60 * 60 * 1000);

  // Find orders that are "Sent" and past auto-release date with no dispute
  const ordersQuery = firestore
    .collection('orders')
    .where('status', '==', 'Sent')
    .where('escrowStatus', '==', 'held');

  const ordersSnapshot = await ordersQuery.get();
  const ordersToRelease: string[] = [];

  for (const doc of ordersSnapshot.docs) {
    const order = doc.data();
    const sentAt = order.sentAt?.toDate?.() || order.sentAt;
    
    if (!sentAt) continue;

    const sentDate = sentAt instanceof Date ? sentAt : new Date(sentAt);
    const daysSinceSent = (now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24);

    // Check if dispute is open
    if (order.dispute?.status === 'open') {
      continue; // Skip if dispute is open
    }

    if (daysSinceSent >= AUTO_RELEASE_DAYS) {
      ordersToRelease.push(doc.id);
    }
  }

  // Release funds for eligible orders
  for (const orderId of ordersToRelease) {
    const orderRef = firestore.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) continue;
    
    const order = orderDoc.data();
    if (!order) continue;
    
    const commissionRate = await getPlatformCommissionRate();
    const orderTotal = order.total || 0;
    // Use commission rate from order if available (for historical accuracy), otherwise use current rate
    const orderCommissionRate = order.commissionRate || commissionRate;
    const commission = orderTotal * orderCommissionRate;
    const sellerEarning = orderTotal - commission;

    // Update order
    await orderRef.update({
      status: 'Completed',
      escrowStatus: 'released',
      fundsReleasedAt: FieldValue.serverTimestamp(),
      commissionRate: orderCommissionRate, // Ensure commission rate is stored
    });

    // Create transaction record
    await firestore.collection('transactions').add({
      sellerId: order.sellerId,
      orderId: orderId,
      type: 'sale',
      amount: sellerEarning,
      commission: commission,
      description: `Sale from order #${orderId.slice(0, 7)} (auto-released)`,
      status: 'completed',
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
        message: `Funds have been automatically released after ${AUTO_RELEASE_DAYS} days.`,
        isSystemMessage: true,
        createdAt: FieldValue.serverTimestamp(),
      });
  }

  return { success: true, released: ordersToRelease.length };
}

