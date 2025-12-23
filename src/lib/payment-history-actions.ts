'use server';

import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

/**
 * Get payment history for a user
 */
export async function getPaymentHistory(userId: string) {
    const auth = await requireAuth();
    
    if (auth.uid !== userId && !auth.isAdmin) {
        throw new Error('Unauthorized');
    }
    
    const firestore = getAdminFirestore();
    
    // Get orders for this user
    const ordersSnapshot = await firestore.collection('orders')
        .where('customerId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
    
    const payments = ordersSnapshot.docs.map(doc => {
        const order = doc.data();
        return {
            id: doc.id,
            orderId: doc.id,
            amount: order.total,
            status: order.status,
            paymentMethod: order.paymentMethod || 'Paystack',
            paymentReference: order.paymentReference,
            createdAt: order.createdAt,
            items: order.items,
        };
    });
    
    return payments;
}

/**
 * Generate receipt for an order
 */
export async function generateReceipt(orderId: string, userId: string) {
    const auth = await requireAuth();
    const firestore = getAdminFirestore();
    
    const orderDoc = await firestore.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
        throw new Error('Order not found');
    }
    
    const order = orderDoc.data() as { customerId: string; sellerId: string };
    
    // Verify authorization - customer or seller can view receipt
    if (order.customerId !== userId && order.sellerId !== userId && !auth.isAdmin) {
        throw new Error('Unauthorized');
    }
    
    const orderData = orderDoc.data()!;
    
    return {
        orderId: orderDoc.id,
        customerInfo: orderData.customerInfo,
        items: orderData.items,
        total: orderData.total,
        status: orderData.status,
        paymentReference: orderData.paymentReference,
        paymentMethod: orderData.paymentMethod || 'Paystack',
        createdAt: orderData.createdAt,
        deliveryAddress: orderData.deliveryAddress,
    };
}

