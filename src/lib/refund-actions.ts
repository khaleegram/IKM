'use server';

import { z } from "zod";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireOwnerOrAdmin } from "@/lib/auth-utils";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

const refundSchema = z.object({
    orderId: z.string().min(1, "Order ID is required"),
    amount: z.number().positive("Refund amount must be positive"),
    reason: z.string().min(1, "Refund reason is required"),
    refundMethod: z.enum(['original_payment', 'store_credit', 'manual']).default('original_payment'),
});

/**
 * Process refund
 */
export async function processRefund(userId: string, data: z.infer<typeof refundSchema>) {
    const validation = refundSchema.safeParse(data);
    
    if (!validation.success) {
        throw new Error(validation.error.errors.map(e => e.message).join(', '));
    }
    
    const firestore = getAdminFirestore();
    const orderRef = firestore.collection('orders').doc(validation.data.orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
        throw new Error('Order not found');
    }
    
    const order = orderDoc.data() as { sellerId: string; total: number; status: string };
    
    // Verify authorization
    await requireOwnerOrAdmin(order.sellerId);
    
    if (order.status === 'Cancelled') {
        throw new Error('Cannot refund a cancelled order');
    }
    
    if (validation.data.amount > order.total) {
        throw new Error('Refund amount cannot exceed order total');
    }
    
    const refund = {
        id: `refund_${Date.now()}`,
        orderId: validation.data.orderId,
        amount: validation.data.amount,
        reason: validation.data.reason,
        refundMethod: validation.data.refundMethod,
        status: 'pending',
        processedBy: userId,
        createdAt: FieldValue.serverTimestamp(),
    };
    
    // Add refund to order
    const existingRefunds = order.refunds || [];
    await orderRef.update({
        refunds: [...existingRefunds, refund],
        updatedAt: FieldValue.serverTimestamp(),
    });
    
    // Create refund record
    await firestore.collection('refunds').add({
        ...refund,
        sellerId: order.sellerId,
    });
    
    revalidatePath(`/seller/orders/${validation.data.orderId}`);
    revalidatePath('/seller/orders');
    
    return { success: true, refundId: refund.id };
}

/**
 * Update refund status
 */
export async function updateRefundStatus(refundId: string, status: 'pending' | 'processed' | 'failed', userId: string) {
    const firestore = getAdminFirestore();
    const refundRef = firestore.collection('refunds').doc(refundId);
    const refundDoc = await refundRef.get();
    
    if (!refundDoc.exists) {
        throw new Error('Refund not found');
    }
    
    const refund = refundDoc.data() as { sellerId: string };
    
    // Verify authorization
    await requireOwnerOrAdmin(refund.sellerId);
    
    await refundRef.update({
        status,
        processedAt: FieldValue.serverTimestamp(),
        processedBy: userId,
    });
    
    // Update order refund status
    const orderRef = firestore.collection('orders').doc(refund.orderId);
    const orderDoc = await orderRef.get();
    
    if (orderDoc.exists) {
        const order = orderDoc.data() as { refunds?: any[] };
        const refunds = order.refunds || [];
        const updatedRefunds = refunds.map((r: any) => 
            r.id === refundId ? { ...r, status } : r
        );
        
        await orderRef.update({
            refunds: updatedRefunds,
        });
    }
    
    revalidatePath('/seller/orders');
    
    return { success: true };
}

