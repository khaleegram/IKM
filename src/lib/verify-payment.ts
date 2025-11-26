
'use server';

import 'dotenv/config';
import { z } from "zod";
import { getAdminFirestore } from '@/lib/firebase/admin';
import { headers } from "next/headers";
import { serverTimestamp } from "firebase-admin/firestore";
import type { Order } from "./firebase/firestore/orders";
import type { CartItem } from "./cart-context";

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
    const customerId = headers().get('X-User-UID'); 

    if (!customerId) {
        console.warn("X-User-UID header not found. Order will be created without a customerId.");
    }
    
    const orderData: Omit<Order, 'id' | 'createdAt'> = {
        customerId: customerId || "anonymous",
        sellerId: sellerId,
        items: cartItems.map(({ id, name, price, quantity }: CartItem) => ({ productId: id, name, price, quantity })),
        total: total,
        status: 'Processing',
        deliveryAddress: deliveryAddress,
        customerInfo: customerInfo,
    };

    const db = getAdminFirestore();
    const ordersCollectionRef = db.collection('orders');
    const orderRef = await ordersCollectionRef.add({
        ...orderData,
        createdAt: serverTimestamp(),
        paystackReference: reference,
    });

    return { success: true, orderId: orderRef.id };
}
