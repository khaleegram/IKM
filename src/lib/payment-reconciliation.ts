'use server';

import { getAdminFirestore } from './firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Reconcile payments with Paystack
 * Checks for discrepancies between our records and Paystack
 */
export async function reconcilePayments() {
  const firestore = getAdminFirestore();
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  
  if (!paystackSecretKey) {
    throw new Error('Paystack secret key not configured');
  }

  // Get all pending/failed payments from last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const paymentsSnapshot = await firestore
    .collection('payments')
    .where('createdAt', '>=', sevenDaysAgo)
    .where('status', 'in', ['pending', 'failed', 'processing'])
    .get();

  const reconciliations: any[] = [];

  for (const paymentDoc of paymentsSnapshot.docs) {
    const payment = paymentDoc.data();
    const reference = payment.reference;

    if (!reference) continue;

    try {
      // Verify with Paystack
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) continue;

      const result = await response.json();
      
      if (result.status && result.data) {
        const paystackStatus = result.data.status;
        const paystackAmount = result.data.amount / 100;

        // Check for discrepancies
        if (payment.status !== 'completed' && paystackStatus === 'success') {
          // Payment was successful but we didn't mark it as completed
          reconciliations.push({
            paymentId: paymentDoc.id,
            reference,
            issue: 'payment_successful_but_not_completed',
            ourStatus: payment.status,
            paystackStatus,
            action: 'mark_completed',
          });

          // Auto-fix: Mark as completed if order exists
          const orderSnapshot = await firestore
            .collection('orders')
            .where('paystackReference', '==', reference)
            .limit(1)
            .get();

          if (!orderSnapshot.empty) {
            await paymentDoc.ref.update({
              status: 'completed',
              verifiedAt: FieldValue.serverTimestamp(),
              reconciledAt: FieldValue.serverTimestamp(),
            });
          }
        }

        if (payment.amount !== paystackAmount) {
          reconciliations.push({
            paymentId: paymentDoc.id,
            reference,
            issue: 'amount_mismatch',
            ourAmount: payment.amount,
            paystackAmount,
          });
        }
      }
    } catch (error) {
      console.error(`Error reconciling payment ${reference}:`, error);
    }
  }

  // Log reconciliation results
  if (reconciliations.length > 0) {
    await firestore.collection('reconciliation_logs').add({
      reconciliations,
      reconciledAt: FieldValue.serverTimestamp(),
      totalChecked: paymentsSnapshot.size,
      issuesFound: reconciliations.length,
    });
  }

  return {
    success: true,
    checked: paymentsSnapshot.size,
    issuesFound: reconciliations.length,
    reconciliations,
  };
}

