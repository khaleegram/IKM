
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { CartItem } from '@/lib/cart-context';
import type { Order } from '@/lib/firebase/firestore/orders';
import { headers } from 'next/headers';


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

        const { status, amount } = paystackResult.data;

        // 2. Check if transaction was successful and amount is correct
        if (status !== 'success' || amount / 100 !== total) {
            throw new Error('Transaction verification failed. Status or amount mismatch.');
        }

        // 3. Create the order in Firestore using Firebase Admin SDK
        const sellerId = cartItems[0].sellerId;
        const customerId = (await headers()).get('X-User-UID'); 

        if (!customerId) {
            console.warn("X-User-UID header not found. Order will be created without a customerId.");
            return NextResponse.json({ error: 'User is not authenticated' }, { status: 401 });
        }
        
        const orderData: Omit<Order, 'id' | 'createdAt'> = {
            customerId: customerId, 
            sellerId: sellerId,
            items: cartItems.map(({ id, name, price, quantity }: CartItem) => ({ productId: id, name, price, quantity })),
            total: total,
            status: 'Processing',
            deliveryAddress: deliveryAddress,
            customerInfo: customerInfo,
        };

        const db = getAdminFirestore();
        const ordersCollection = db.collection('orders');
        const orderRef = await ordersCollection.add({
            ...orderData,
            createdAt: FieldValue.serverTimestamp(),
            paymentReference: reference,
            paymentMethod: 'Paystack',
            paymentStatus: 'completed',
        });

        // Create payment record
        await db.collection('payments').add({
            orderId: orderRef.id,
            customerId: customerId,
            sellerId: sellerId,
            amount: total,
            reference: reference,
            status: 'completed',
            method: 'Paystack',
            createdAt: FieldValue.serverTimestamp(),
        });

        // Send email notifications
        try {
            const { sendOrderConfirmationEmail, sendPaymentReceiptEmail, sendNewOrderNotificationEmail } = await import('@/lib/email-actions');
            
            // Get customer email
            const customerDoc = await db.collection('users').doc(customerId).get();
            const customerData = customerDoc.data();
            
            // Get seller email
            const sellerDoc = await db.collection('users').doc(sellerId).get();
            const sellerData = sellerDoc.data();
            
            // Send to customer
            if (customerData?.email) {
                await sendOrderConfirmationEmail(orderRef.id, customerData.email, orderData);
                await sendPaymentReceiptEmail(orderRef.id, customerData.email, {
                    reference,
                    amount: total,
                    method: 'Paystack',
                });
            }
            
            // Send to seller
            if (sellerData?.email) {
                await sendNewOrderNotificationEmail(sellerData.email, orderRef.id, orderData);
            }
        } catch (error) {
            console.error('Error sending email notifications:', error);
            // Don't fail the payment verification if email fails
        }

        return NextResponse.json({ success: true, orderId: orderRef.id }, { status: 200 });

    } catch (error) {
        console.error('Payment verification error:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
