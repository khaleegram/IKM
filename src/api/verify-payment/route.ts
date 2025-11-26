
import 'dotenv/config';
import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { CartItem } from '@/lib/cart-context';
import { Order } from '@/lib/firebase/firestore/orders';
import { headers } from 'next/headers';

// Initialize Firebase Admin SDK
// This is necessary for server-side operations
try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
    if (!getApps().length) {
        initializeApp({
            credential: cert(serviceAccount)
        });
    }
} catch (e) {
    console.error('Firebase Admin initialization error:', e);
    // Add a check to ensure this doesn't run on the client-side during build
    if (typeof window === 'undefined') {
        console.error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set or invalid. Skipping admin initialization.");
    }
}


export async function POST(req: NextRequest) {
    if (req.method !== 'POST') {
        return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    try {
        const { reference, cartItems, total, deliveryAddress, customerInfo } = await req.json();

        // 1. Verify transaction with Paystack
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

        const { status, amount, currency } = paystackResult.data;

        // 2. Check if transaction was successful and amount is correct
        if (status !== 'success' || amount / 100 !== total) {
            throw new Error('Transaction verification failed. Status or amount mismatch.');
        }

        // 3. Create the order in Firestore using Firebase Admin SDK
        // In a real multi-seller marketplace, group items by seller and create separate orders.
        // For this MVP, we assume all items come from the first item's seller.
        const sellerId = cartItems[0].sellerId;
        const customerId = headers().get('X-User-UID'); // We'll need to pass this from the client middleware if needed. For now, it's illustrative.

        if (!customerId) {
            console.warn("X-User-UID header not found. Order will be created without a customerId.");
            // In a production app, you'd likely want to return an error here.
            // return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
        }
        
        const orderData: Omit<Order, 'id' | 'createdAt'> = {
            customerId: customerId || "anonymous", // Fallback for safety
            sellerId: sellerId,
            items: cartItems.map(({ id, name, price, quantity, sellerId }: any) => ({ id, name, price, quantity, sellerId })),
            total: total,
            status: 'Processing',
            deliveryAddress: deliveryAddress,
            customerInfo: customerInfo,
        };

        const db = getAdminFirestore();
        const ordersCollection = collection(db, 'orders');
        const orderRef = await addDoc(ordersCollection, {
            ...orderData,
            createdAt: serverTimestamp(),
            paystackReference: reference,
        });

        return NextResponse.json({ success: true, orderId: orderRef.id }, { status: 200 });

    } catch (error) {
        console.error('Payment verification error:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
