'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { requireAuth } from './auth-utils';
import { getAdminFirestore } from './firebase/admin';

/**
 * Link guest orders to a user account when they sign up
 * Finds all orders with guest_ prefix matching the user's email and links them
 */
export async function linkGuestOrdersToAccount() {
  const auth = await requireAuth();
  const firestore = getAdminFirestore();
  
  // Get user email from Firestore if not in auth token
  let userEmail: string | null = auth.email || null;
  
  if (!userEmail) {
    // Try to get email from user document
    const userDoc = await firestore.collection('users').doc(auth.uid).get();
    if (userDoc.exists) {
      userEmail = userDoc.data()?.email || null;
    }
  }
  
  if (!userEmail) {
    throw new Error('User email is required to link guest orders');
  }
  
  // CRITICAL: Find all guest orders with matching email
  // Method 1: Search by customerId pattern (guest_email)
  const emailKey = userEmail.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const guestIdPattern = `guest_${emailKey}`;
  
  const guestOrdersQuery = await firestore
    .collection('orders')
    .where('customerId', '==', guestIdPattern)
    .get();

  // Method 2: Also search by customerInfo.email for more accurate matching
  // This catches any guest orders that might have been created with different ID format
  const ordersByEmail: any[] = [];
  const allOrders = await firestore
    .collection('orders')
    .where('customerInfo.email', '==', userEmail.toLowerCase())
    .get();

  allOrders.forEach(doc => {
    const data = doc.data();
    // Only include orders that are still guest orders (not already linked)
    if (data.customerId && data.customerId.startsWith('guest_') && data.customerId !== auth.uid) {
      ordersByEmail.push({ id: doc.id, ...data });
    }
  });
  
  // Combine and deduplicate
  const ordersToLink = new Map();
  guestOrdersQuery.forEach(doc => {
    ordersToLink.set(doc.id, { id: doc.id, ...doc.data() });
  });
  ordersByEmail.forEach(order => {
    ordersToLink.set(order.id, order);
  });
  
  // Update all matching orders
  const batch = firestore.batch();
  let linkedCount = 0;
  
  ordersToLink.forEach((order, orderId) => {
    // Verify the email matches
    const orderEmail = order.customerInfo?.email || '';
    if (orderEmail.toLowerCase() === userEmail!.toLowerCase()) {
      const orderRef = firestore.collection('orders').doc(orderId);
      batch.update(orderRef, {
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
  
  return { success: true, linkedCount };
}

