'use server';

import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAuth, requireOwnerOrAdmin } from "@/lib/auth-utils";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

import { getPlatformCommissionRate } from "@/lib/platform-settings-actions";

export interface SellerEarnings {
  totalEarnings: number;
  availableBalance: number;
  pendingPayouts: number;
  totalPayouts: number;
  commissionPaid: number;
  totalOrders: number;
}

export interface Transaction {
  id: string;
  type: 'sale' | 'payout' | 'commission' | 'refund';
  amount: number;
  orderId?: string;
  payoutId?: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: any;
}

/**
 * Calculate seller earnings from orders
 */
export async function calculateSellerEarnings(sellerId: string): Promise<SellerEarnings> {
  const firestore = getAdminFirestore();
  const commissionRate = await getPlatformCommissionRate();
  
  // Get all orders for this seller
  const ordersSnapshot = await firestore.collection('orders')
    .where('sellerId', '==', sellerId)
    .get();
  
  let totalEarnings = 0;
  let totalOrders = 0;
  let commissionPaid = 0;
  
  ordersSnapshot.forEach(doc => {
    const order = doc.data();
    // Only count delivered orders
    if (order.status === 'Delivered') {
      const orderTotal = order.total || 0;
      // Use commission rate from order if available (for historical accuracy), otherwise use current rate
      const orderCommissionRate = order.commissionRate || commissionRate;
      const commission = orderTotal * orderCommissionRate;
      const sellerEarning = orderTotal - commission;
      
      totalEarnings += sellerEarning;
      commissionPaid += commission;
      totalOrders++;
    }
  });
  
  // Get pending payouts
  const pendingPayoutsSnapshot = await firestore.collection('payouts')
    .where('sellerId', '==', sellerId)
    .where('status', '==', 'pending')
    .get();
  
  let pendingPayouts = 0;
  pendingPayoutsSnapshot.forEach(doc => {
    const payout = doc.data();
    pendingPayouts += payout.amount || 0;
  });
  
  // Get completed payouts
  const completedPayoutsSnapshot = await firestore.collection('payouts')
    .where('sellerId', '==', sellerId)
    .where('status', '==', 'completed')
    .get();
  
  let totalPayouts = 0;
  completedPayoutsSnapshot.forEach(doc => {
    const payout = doc.data();
    totalPayouts += payout.amount || 0;
  });
  
  const availableBalance = totalEarnings - totalPayouts - pendingPayouts;
  
  return {
    totalEarnings,
    availableBalance: Math.max(0, availableBalance), // Ensure non-negative
    pendingPayouts,
    totalPayouts,
    commissionPaid,
    totalOrders,
  };
}

/**
 * Get seller transaction history
 */
export async function getSellerTransactions(sellerId: string, limit: number = 50): Promise<Transaction[]> {
  const auth = await requireAuth();
  
  // Verify authorization
  await requireOwnerOrAdmin(sellerId);
  
  const firestore = getAdminFirestore();
  const transactions: Transaction[] = [];
  
  // Get sales transactions from orders
  const ordersSnapshot = await firestore.collection('orders')
    .where('sellerId', '==', sellerId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  
  const commissionRate = await getPlatformCommissionRate();
  
  ordersSnapshot.forEach(doc => {
    const order = doc.data();
    const orderTotal = order.total || 0;
    // Use commission rate from order if available (for historical accuracy), otherwise use current rate
    const orderCommissionRate = order.commissionRate || commissionRate;
    const commission = orderTotal * orderCommissionRate;
    const sellerEarning = orderTotal - commission;
    
    if (order.status === 'Delivered') {
      transactions.push({
        id: `sale_${doc.id}`,
        type: 'sale',
        amount: sellerEarning,
        orderId: doc.id,
        description: `Sale from order #${doc.id.slice(0, 7)}`,
        status: 'completed',
        createdAt: order.createdAt,
      });
      
      // Add commission transaction
      transactions.push({
        id: `commission_${doc.id}`,
        type: 'commission',
        amount: -commission,
        orderId: doc.id,
        description: `Platform commission (${(orderCommissionRate * 100).toFixed(1)}%)`,
        status: 'completed',
        createdAt: order.createdAt,
      });
    }
  });
  
  // Get payout transactions
  const payoutsSnapshot = await firestore.collection('payouts')
    .where('sellerId', '==', sellerId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  
  payoutsSnapshot.forEach(doc => {
    const payout = doc.data();
    transactions.push({
      id: `payout_${doc.id}`,
      type: 'payout',
      amount: -(payout.amount || 0),
      payoutId: doc.id,
      description: `Payout to ${payout.bankName || 'bank account'}`,
      status: payout.status === 'completed' ? 'completed' : payout.status === 'failed' ? 'failed' : 'pending',
      createdAt: payout.createdAt,
    });
  });
  
  // Sort by date (most recent first)
  transactions.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
  
  return transactions.slice(0, limit);
}

/**
 * Update earnings when order is delivered
 */
export async function updateEarningsOnOrderDelivery(orderId: string) {
  const firestore = getAdminFirestore();
  const orderDoc = await firestore.collection('orders').doc(orderId).get();
  
  if (!orderDoc.exists) {
    throw new Error('Order not found');
  }
  
  const order = orderDoc.data() as { sellerId: string; total: number; status: string };
  
  if (order.status !== 'Delivered') {
    return; // Only process delivered orders
  }
  
  // Calculate earnings
  const commissionRate = await getPlatformCommissionRate();
  const orderTotal = order.total || 0;
  // Use commission rate from order if available (for historical accuracy), otherwise use current rate
  const orderCommissionRate = order.commissionRate || commissionRate;
  const commission = orderTotal * orderCommissionRate;
  const sellerEarning = orderTotal - commission;
  
  // Create transaction record
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
  
  revalidatePath('/seller/payouts');
  
  return { success: true };
}

