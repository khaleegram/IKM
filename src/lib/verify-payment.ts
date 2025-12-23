
'use server';

import { z } from "zod";
import { headers } from "next/headers";
import type { Order } from "./firebase/firestore/orders";
import type { CartItem } from "./cart-context";
import { getAdminFirestore } from "./firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const verifyPaymentSchema = z.object({
  reference: z.string(),
  cartItems: z.any(),
  total: z.number(),
  deliveryAddress: z.string(),
  customerInfo: z.any(),
});

export async function verifyPaymentAndCreateOrder(data: unknown) {
  const validation = verifyPaymentSchema.safeParse(data);
   if (!validation.success) {
        throw new Error('Invalid payment verification data.');
    }
    const { reference, cartItems, total, deliveryAddress, customerInfo } = validation.data;
    
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
        throw new Error("Paystack secret key is not configured on the server.");
    }
    
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
        },
    });

    const paystackResult = await response.json();

    if (!response.ok || !paystackResult.status || !paystackResult.data) {
         throw new Error(paystackResult.message || 'Paystack verification failed');
    }

    const { status, amount } = paystackResult.data;

    if (status !== 'success' || amount / 100 !== total) {
        throw new Error('Transaction verification failed. Status or amount mismatch.');
    }

    const sellerId = cartItems[0].sellerId;
    const customerId = (await headers()).get('X-User-UID'); 

    if (!customerId) {
        console.warn("X-User-UID header not found. Order will be created without a customerId.");
        // Decide if you want to throw an error or allow anonymous orders
        throw new Error("User authentication not found. Cannot create order.");
    }
    
    const orderData: Omit<Order, 'id' | 'createdAt'> = {
        customerId: customerId,
        sellerId: sellerId,
        items: cartItems.map(({ id, name, price, quantity }: CartItem) => ({ productId: id, name, price, quantity })),
        total: total,
        status: 'Processing',
        deliveryAddress: deliveryAddress,
        customerInfo: customerInfo,
        // Escrow: funds are held until order completion
        escrowStatus: 'held',
    };

    const db = getAdminFirestore();
    const ordersCollectionRef = db.collection('orders');
    const orderRef = await ordersCollectionRef.add({
        ...orderData,
        createdAt: FieldValue.serverTimestamp(),
        paystackReference: reference,
    });

    // Create initial system messages in chat
    const chatCollection = orderRef.collection('chat');
    
    // Order placed message
    await chatCollection.add({
        orderId: orderRef.id,
        senderId: 'system',
        senderType: 'system',
        message: 'Order placed',
        isSystemMessage: true,
        createdAt: FieldValue.serverTimestamp(),
    });

    // Payment confirmed message
    await chatCollection.add({
        orderId: orderRef.id,
        senderId: 'system',
        senderType: 'system',
        message: 'Payment confirmed',
        isSystemMessage: true,
        createdAt: FieldValue.serverTimestamp(),
    });

    return { success: true, orderId: orderRef.id };
}
