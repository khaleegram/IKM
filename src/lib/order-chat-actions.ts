'use server';

import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const sendMessageSchema = z.object({
  orderId: z.string(),
  message: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export async function sendOrderMessage(data: unknown) {
  const validation = sendMessageSchema.safeParse(data);
  if (!validation.success) {
    throw new Error('Invalid message data');
  }

  const { orderId, message, imageUrl } = validation.data;
  
  if (!message && !imageUrl) {
    throw new Error('Message or image is required');
  }

  const userId = (await headers()).get('X-User-UID');
  if (!userId) {
    throw new Error('User is not authenticated');
  }

  const firestore = getAdminFirestore();
  
  // Verify user has access to this order
  const orderDoc = await firestore.collection('orders').doc(orderId).get();
  if (!orderDoc.exists) {
    throw new Error('Order not found');
  }

  const order = orderDoc.data();
  if (order?.customerId !== userId && order?.sellerId !== userId) {
    throw new Error('Unauthorized: You do not have access to this order');
  }

  // Determine sender type
  const senderType = order.customerId === userId ? 'customer' : 'seller';

  // Add message to chat
  await firestore
    .collection('orders')
    .doc(orderId)
    .collection('chat')
    .add({
      orderId,
      senderId: userId,
      senderType,
      message: message || null,
      imageUrl: imageUrl || null,
      isSystemMessage: false,
      createdAt: FieldValue.serverTimestamp(),
    });

  revalidatePath(`/seller/orders/${orderId}`);
  revalidatePath(`/profile`); // Customer orders page

  return { success: true };
}

