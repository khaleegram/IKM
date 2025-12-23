'use server';

import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-utils';
import type { OrderDispute } from '@/lib/firebase/firestore/orders';

const openDisputeSchema = z.object({
  orderId: z.string(),
  type: z.enum(['item_not_received', 'wrong_item', 'damaged_item']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  photos: z.array(z.string().url()).optional(),
});

/**
 * Customer opens a dispute
 * - Freezes escrow funds
 * - Updates order status to "Disputed"
 * - Creates system message in chat
 */
export async function openDispute(data: unknown) {
  const validation = openDisputeSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(validation.error.errors.map(e => e.message).join(', '));
  }

  const { orderId, type, description, photos } = validation.data;
  const auth = await requireAuth();
  const firestore = getAdminFirestore();
  
  const orderRef = firestore.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    throw new Error('Order not found');
  }

  const order = orderDoc.data();
  
  // Verify customer owns this order
  if (order?.customerId !== auth.uid && !auth.isAdmin) {
    throw new Error('Unauthorized: Only the customer can open a dispute');
  }

  // Verify order is in correct status (can dispute before auto-release)
  if (order?.status === 'Completed' || order?.status === 'Cancelled') {
    throw new Error('Cannot dispute a completed or cancelled order');
  }

  // Check if dispute already exists
  if (order?.dispute?.status === 'open') {
    throw new Error('A dispute is already open for this order');
  }

  const dispute: OrderDispute = {
    id: `dispute_${Date.now()}`,
    orderId,
    openedBy: auth.uid,
    type,
    description,
    status: 'open',
    photos: photos || [],
    createdAt: FieldValue.serverTimestamp() as any,
  };

  // Update order with dispute
  await orderRef.update({
    status: 'Disputed',
    dispute,
  });

  // Create system message in chat
  const disputeMessages = {
    item_not_received: 'Customer has opened a dispute: Item not received',
    wrong_item: 'Customer has opened a dispute: Wrong item received',
    damaged_item: 'Customer has opened a dispute: Item damaged',
  };

  await firestore
    .collection('orders')
    .doc(orderId)
    .collection('chat')
    .add({
      orderId,
      senderId: 'system',
      senderType: 'system',
      message: disputeMessages[type],
      isSystemMessage: true,
      createdAt: FieldValue.serverTimestamp(),
    });

  revalidatePath(`/seller/orders/${orderId}`);
  revalidatePath('/seller/orders');
  revalidatePath('/profile');

  return { success: true, disputeId: dispute.id };
}

const resolveDisputeSchema = z.object({
  orderId: z.string(),
  resolution: z.enum(['favor_customer', 'favor_seller', 'partial_refund']),
  refundAmount: z.number().optional(),
  notes: z.string().optional(),
});

/**
 * Admin resolves a dispute
 * - Updates dispute status
 * - Releases or refunds funds based on resolution
 * - Creates system message in chat
 */
export async function resolveDispute(data: unknown) {
  const validation = resolveDisputeSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(validation.error.errors.map(e => e.message).join(', '));
  }

  const { orderId, resolution, refundAmount, notes } = validation.data;
  const auth = await requireAuth();
  
  if (!auth.isAdmin) {
    throw new Error('Unauthorized: Only admins can resolve disputes');
  }

  const firestore = getAdminFirestore();
  const orderRef = firestore.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    throw new Error('Order not found');
  }

  const order = orderDoc.data();
  
  if (order?.dispute?.status !== 'open') {
    throw new Error('No open dispute found for this order');
  }

  const orderTotal = order.total || 0;
  const { getPlatformCommissionRate } = await import('@/lib/platform-settings-actions');
  const commissionRate = await getPlatformCommissionRate();
  // Use commission rate from order if available (for historical accuracy), otherwise use current rate
  const orderCommissionRate = order.commissionRate || commissionRate;

  // Update dispute
  const updatedDispute: OrderDispute = {
    ...order.dispute,
    status: 'resolved',
    resolvedBy: auth.uid,
    resolvedAt: FieldValue.serverTimestamp() as any,
  };

  if (resolution === 'favor_customer') {
    // Full refund to customer
    await orderRef.update({
      status: 'Cancelled',
      escrowStatus: 'refunded',
      dispute: updatedDispute,
    });

    // Create refund transaction
    await firestore.collection('transactions').add({
      orderId,
      customerId: order.customerId,
      type: 'refund',
      amount: orderTotal,
      description: `Refund for order #${orderId.slice(0, 7)} (dispute resolved in favor of customer)`,
      status: 'completed',
      createdAt: FieldValue.serverTimestamp(),
    });
  } else if (resolution === 'favor_seller') {
    // Release funds to seller
    const commission = orderTotal * orderCommissionRate;
    const sellerEarning = orderTotal - commission;
    
    await orderRef.update({
      status: 'Completed',
      escrowStatus: 'released',
      fundsReleasedAt: FieldValue.serverTimestamp(),
      dispute: updatedDispute,
    });

    // Create transaction for seller
    await firestore.collection('transactions').add({
      sellerId: order.sellerId,
      orderId,
      type: 'sale',
      amount: sellerEarning,
      commission: commission,
      description: `Sale from order #${orderId.slice(0, 7)} (dispute resolved in favor of seller)`,
      status: 'completed',
      createdAt: FieldValue.serverTimestamp(),
    });
  } else if (resolution === 'partial_refund') {
    // Partial refund
    const refund = refundAmount || orderTotal * 0.5;
    const commission = orderTotal * orderCommissionRate;
    const sellerAmount = orderTotal - refund - commission;

    await orderRef.update({
      status: 'Completed',
      escrowStatus: 'released',
      fundsReleasedAt: FieldValue.serverTimestamp(),
      dispute: updatedDispute,
    });

    // Refund to customer
    await firestore.collection('transactions').add({
      orderId,
      customerId: order.customerId,
      type: 'refund',
      amount: refund,
      description: `Partial refund for order #${orderId.slice(0, 7)}`,
      status: 'completed',
      createdAt: FieldValue.serverTimestamp(),
    });

    // Payment to seller
    await firestore.collection('transactions').add({
      sellerId: order.sellerId,
      orderId,
      type: 'sale',
      amount: sellerAmount,
      commission: commission,
      description: `Sale from order #${orderId.slice(0, 7)} (partial after dispute)`,
      status: 'completed',
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  // Create system message
  const resolutionMessages = {
    favor_customer: 'Dispute resolved in favor of customer. Full refund issued.',
    favor_seller: 'Dispute resolved in favor of seller. Funds released.',
    partial_refund: `Dispute resolved with partial refund of ₦${refundAmount?.toLocaleString() || '0'}.`,
  };

  await firestore
    .collection('orders')
    .doc(orderId)
    .collection('chat')
    .add({
      orderId,
      senderId: 'system',
      senderType: 'system',
      message: resolutionMessages[resolution] + (notes ? ` Notes: ${notes}` : ''),
      isSystemMessage: true,
      createdAt: FieldValue.serverTimestamp(),
    });

  revalidatePath(`/seller/orders/${orderId}`);
  revalidatePath('/seller/orders');
  revalidatePath('/profile');
  revalidatePath('/admin/orders');

  return { success: true };
}

