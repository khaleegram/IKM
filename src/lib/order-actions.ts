'use server';

import { getAdminFirestore } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';
import { requireOwnerOrAdmin, requireAuth } from '@/lib/auth-utils';
import type { Order } from '@/lib/firebase/firestore/orders';

/**
 * Order Status State Machine
 * Defines allowed transitions between order states
 */
type OrderStatus = Order['status'];

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  'Processing': ['Sent', 'Cancelled'],
  'Sent': ['Received', 'Cancelled', 'Disputed'],
  'Received': ['Completed'], // Customer confirms receipt
  'Completed': [], // Final state
  'Cancelled': [], // Final state
  'Disputed': ['Completed', 'Cancelled'], // Admin resolves
};

/**
 * Update order status with state machine validation
 * Follows Write Contract pattern:
 * 1. Input Validation
 * 2. Authorization Check
 * 3. Domain Logic (State Machine)
 * 4. Firestore Write
 */
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  // 1. Input Validation
  if (!orderId || !newStatus) {
    throw new Error('Order ID and status are required');
  }

  const validStatuses: OrderStatus[] = ['Processing', 'Sent', 'Received', 'Completed', 'Cancelled', 'Disputed'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  // 2. Authorization Check
  const auth = await requireAuth();
  const firestore = getAdminFirestore();
  const orderRef = firestore.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    throw new Error('Order not found');
  }

  const order = orderDoc.data() as Order;
  const isSeller = order.sellerId === auth.uid;
  const isCustomer = order.customerId === auth.uid;

  // Verify authorization: seller or admin can update, customer can only cancel Processing orders
  if (newStatus === 'Cancelled' && isCustomer && order.status === 'Processing') {
    // Customer can cancel Processing orders
  } else if (!isSeller && !auth.isAdmin) {
    throw new Error('Forbidden: Only seller or admin can update order status');
  }

  // 3. Domain Logic - State Machine Validation
  const currentStatus = order.status as OrderStatus;
  const allowedTransitions = ALLOWED_TRANSITIONS[currentStatus];

  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(
      `Invalid transition: Cannot change order status from "${currentStatus}" to "${newStatus}". ` +
      `Allowed transitions: ${allowedTransitions.join(', ') || 'none (final state)'}`
    );
  }

  // Additional business rules
  if (newStatus === 'Sent' && !isSeller && !auth.isAdmin) {
    throw new Error('Only seller can mark order as sent');
  }

  if (newStatus === 'Received' && !isCustomer && !auth.isAdmin) {
    throw new Error('Only customer can mark order as received');
  }

  if (newStatus === 'Cancelled' && currentStatus === 'Completed') {
    throw new Error('Cannot cancel a completed order');
  }

  // 4. Firestore Write
  await orderRef.update({
    status: newStatus,
    updatedAt: new Date(),
  });

  // 5. Update earnings if order is completed (earnings are now handled in markOrderAsReceived)
  // This is kept for backward compatibility but new flow uses markOrderAsReceived
  if (newStatus === 'Completed' && currentStatus !== 'Completed') {
    try {
      const { updateEarningsOnOrderDelivery } = await import('@/lib/earnings-actions');
      await updateEarningsOnOrderDelivery(orderId);
    } catch (error) {
      console.error('Error updating earnings:', error);
      // Don't fail the order update if earnings update fails
    }
  }

  // 6. Send email notifications
  try {
    const { sendOrderStatusUpdateEmail } = await import('@/lib/email-actions');
    const userDoc = await firestore.collection('users').doc(order.customerId).get();
    const userData = userDoc.data();
    
    if (userData?.email) {
      await sendOrderStatusUpdateEmail(orderId, userData.email, newStatus, order);
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
    // Don't fail the order update if email fails
  }

  // 6. Cache Invalidation
  revalidatePath('/seller/orders');
  revalidatePath(`/seller/orders/${orderId}`);
  revalidatePath('/profile'); // Customer orders page
  revalidatePath('/seller/payouts'); // Update earnings display

  return { success: true, orderId, newStatus };
}

