import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

/**
 * Paystack Webhook Handler
 * Handles payment events from Paystack
 */
export async function POST(req: NextRequest) {
  try {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    
    if (!paystackSecretKey) {
      console.error('Paystack secret key not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Get the signature from headers
    const signature = req.headers.get('x-paystack-signature');
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Get the raw body
    const body = await req.text();
    
    // Verify the signature
    const hash = crypto
      .createHmac('sha512', paystackSecretKey)
      .update(body)
      .digest('hex');
    
    if (hash !== signature) {
      console.error('Invalid Paystack signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse the event
    const event = JSON.parse(body);
    
    console.log('Paystack webhook event:', event.event);

    const firestore = getAdminFirestore();

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data, firestore);
        break;
      
      case 'charge.failed':
        await handleChargeFailed(event.data, firestore);
        break;
      
      case 'transfer.success':
        await handleTransferSuccess(event.data, firestore);
        break;
      
      case 'transfer.failed':
        await handleTransferFailed(event.data, firestore);
        break;
      
      case 'transfer.reversed':
        await handleTransferReversed(event.data, firestore);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Handle successful charge (payment)
 */
async function handleChargeSuccess(data: any, firestore: FirebaseFirestore.Firestore) {
  const { reference, amount, customer, metadata } = data;
  
  console.log('Processing successful charge:', reference);

  // Find the order by payment reference
  const ordersSnapshot = await firestore.collection('orders')
    .where('paymentReference', '==', reference)
    .limit(1)
    .get();

  if (ordersSnapshot.empty) {
    console.warn(`Order not found for payment reference: ${reference}`);
    return;
  }

  const orderDoc = ordersSnapshot.docs[0];
  const orderData = orderDoc.data();

  // Check if order is already confirmed
  if (orderData.paymentStatus === 'completed') {
    console.log(`Order ${orderDoc.id} already confirmed`);
    return;
  }

  // Update order payment status
  await orderDoc.ref.update({
    paymentStatus: 'completed',
    paymentVerifiedAt: FieldValue.serverTimestamp(),
    paystackCustomerCode: customer?.customer_code,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Update payment record if exists
  const paymentsSnapshot = await firestore.collection('payments')
    .where('reference', '==', reference)
    .limit(1)
    .get();

  if (!paymentsSnapshot.empty) {
    await paymentsSnapshot.docs[0].ref.update({
      status: 'completed',
      verifiedAt: FieldValue.serverTimestamp(),
    });
  }

  // Create notification for seller
  await firestore.collection('notifications').add({
    userId: orderData.sellerId,
    type: 'new_order',
    title: 'New Order Received',
    message: `You have received a new order (${orderDoc.id.slice(0, 7)}) for ₦${(amount / 100).toLocaleString()}`,
    orderId: orderDoc.id,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Create notification for customer
  await firestore.collection('notifications').add({
    userId: orderData.customerId,
    type: 'order_confirmed',
    title: 'Order Confirmed',
    message: `Your order (${orderDoc.id.slice(0, 7)}) has been confirmed and payment received.`,
    orderId: orderDoc.id,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log(`Order ${orderDoc.id} confirmed via webhook`);
}

/**
 * Handle failed charge (payment)
 * Updates payment status and allows for retry
 */
async function handleChargeFailed(data: any, firestore: any) {
  const { reference, amount, customer, gateway_response } = data;
  
  console.log('Processing failed charge:', reference);

  // Find order by payment reference
  const ordersSnapshot = await firestore.collection('orders')
    .where('paystackReference', '==', reference)
    .limit(1)
    .get();

  if (!ordersSnapshot.empty) {
    const orderDoc = ordersSnapshot.docs[0];
    await orderDoc.ref.update({
      paymentStatus: 'failed',
      paymentFailureReason: gateway_response || 'Payment failed',
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  // Update payment record
  const paymentsSnapshot = await firestore.collection('payments')
    .where('reference', '==', reference)
    .limit(1)
    .get();

  if (!paymentsSnapshot.empty) {
    await paymentsSnapshot.docs[0].ref.update({
      status: 'failed',
      failureReason: gateway_response || 'Payment failed',
      failedAt: FieldValue.serverTimestamp(),
    });
  }

  // Log for reconciliation
  await firestore.collection('failed_payments').add({
    reference,
    amount: amount / 100,
    reason: gateway_response || 'Payment failed',
    customerCode: customer?.customer_code,
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log(`Payment ${reference} marked as failed via webhook`);
}

/**
 * Handle successful transfer (payout)
 */
async function handleTransferSuccess(data: any, firestore: any) {
  const { reference, amount, recipient, reason } = data;
  
  console.log('Processing successful transfer:', reference);

  // Find the payout by transfer reference
  const payoutsSnapshot = await firestore.collection('payouts')
    .where('transferReference', '==', reference)
    .limit(1)
    .get();

  if (payoutsSnapshot.empty) {
    console.warn(`Payout not found for transfer reference: ${reference}`);
    return;
  }

  const payoutDoc = payoutsSnapshot.docs[0];
  const payoutData = payoutDoc.data();

  // Update payout status
  await payoutDoc.ref.update({
    status: 'completed',
    transferCompletedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Create notification for seller
  await firestore.collection('notifications').add({
    userId: payoutData.sellerId,
    type: 'payout_completed',
    title: 'Payout Completed',
    message: `Your payout of ₦${(amount / 100).toLocaleString()} has been successfully transferred to your account.`,
    payoutId: payoutDoc.id,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log(`Payout ${payoutDoc.id} completed via webhook`);
}

/**
 * Handle failed transfer (payout)
 */
async function handleTransferFailed(data: any, firestore: any) {
  const { reference, amount, reason } = data;
  
  console.log('Processing failed transfer:', reference);

  // Find the payout by transfer reference
  const payoutsSnapshot = await firestore.collection('payouts')
    .where('transferReference', '==', reference)
    .limit(1)
    .get();

  if (payoutsSnapshot.empty) {
    console.warn(`Payout not found for transfer reference: ${reference}`);
    return;
  }

  const payoutDoc = payoutsSnapshot.docs[0];
  const payoutData = payoutDoc.data();

  // Update payout status
  await payoutDoc.ref.update({
    status: 'failed',
    failureReason: reason || 'Transfer failed',
    transferFailedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Create notification for seller
  await firestore.collection('notifications').add({
    userId: payoutData.sellerId,
    type: 'payout_failed',
    title: 'Payout Failed',
    message: `Your payout of ₦${(amount / 100).toLocaleString()} failed. Reason: ${reason || 'Unknown error'}`,
    payoutId: payoutDoc.id,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log(`Payout ${payoutDoc.id} failed via webhook`);
}

/**
 * Handle reversed transfer (payout)
 */
async function handleTransferReversed(data: any, firestore: any) {
  const { reference, amount } = data;
  
  console.log('Processing reversed transfer:', reference);

  // Find the payout by transfer reference
  const payoutsSnapshot = await firestore.collection('payouts')
    .where('transferReference', '==', reference)
    .limit(1)
    .get();

  if (payoutsSnapshot.empty) {
    console.warn(`Payout not found for transfer reference: ${reference}`);
    return;
  }

  const payoutDoc = payoutsSnapshot.docs[0];
  const payoutData = payoutDoc.data();

  // Update payout status
  await payoutDoc.ref.update({
    status: 'cancelled',
    transferReversedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Create notification for seller
  await firestore.collection('notifications').add({
    userId: payoutData.sellerId,
    type: 'payout_reversed',
    title: 'Payout Reversed',
    message: `Your payout of ₦${(amount / 100).toLocaleString()} has been reversed. The amount has been returned to your balance.`,
    payoutId: payoutDoc.id,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log(`Payout ${payoutDoc.id} reversed via webhook`);
}

