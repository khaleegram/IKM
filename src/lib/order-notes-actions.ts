'use server';

import { z } from "zod";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireOwnerOrAdmin } from "@/lib/auth-utils";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

const noteSchema = z.object({
    note: z.string().min(1, "Note cannot be empty"),
    isInternal: z.boolean().default(true),
});

/**
 * Add note to order
 */
export async function addOrderNote(orderId: string, userId: string, data: { note: string; isInternal?: boolean }) {
    const validation = noteSchema.safeParse(data);
    
    if (!validation.success) {
        throw new Error(validation.error.errors.map(e => e.message).join(', '));
    }
    
    const firestore = getAdminFirestore();
    const orderRef = firestore.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
        throw new Error('Order not found');
    }
    
    const order = orderDoc.data() as { sellerId: string };
    
    // Verify authorization
    await requireOwnerOrAdmin(order.sellerId);
    
    const note = {
        id: `note_${Date.now()}`,
        note: validation.data.note,
        isInternal: validation.data.isInternal ?? true,
        createdBy: userId,
        createdAt: FieldValue.serverTimestamp(),
    };
    
    const existingNotes = order.notes || [];
    
    await orderRef.update({
        notes: [...existingNotes, note],
        updatedAt: FieldValue.serverTimestamp(),
    });
    
    revalidatePath(`/seller/orders/${orderId}`);
    revalidatePath('/seller/orders');
    
    return { success: true };
}

/**
 * Delete order note
 */
export async function deleteOrderNote(orderId: string, noteId: string, userId: string) {
    const firestore = getAdminFirestore();
    const orderRef = firestore.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
        throw new Error('Order not found');
    }
    
    const order = orderDoc.data() as { sellerId: string; notes?: any[] };
    
    // Verify authorization
    await requireOwnerOrAdmin(order.sellerId);
    
    const notes = order.notes || [];
    const updatedNotes = notes.filter((n: any) => n.id !== noteId);
    
    await orderRef.update({
        notes: updatedNotes,
        updatedAt: FieldValue.serverTimestamp(),
    });
    
    revalidatePath(`/seller/orders/${orderId}`);
    revalidatePath('/seller/orders');
    
    return { success: true };
}

