'use server';

import { z } from "zod";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/auth-utils";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { calculateSellerEarnings } from "./earnings-actions";
import { getMinimumPayoutAmount } from "@/lib/platform-settings-actions";

// Dynamic schema - we'll validate with the actual minimum amount from settings
const payoutRequestSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
});

/**
 * Request a payout
 */
export async function requestPayout(userId: string, data: { amount: number }) {
  const validation = payoutRequestSchema.safeParse(data);
  
  if (!validation.success) {
    throw new Error(validation.error.errors.map(e => e.message).join(', '));
  }
  
  const auth = await requireAuth();
  
  if (auth.uid !== userId) {
    throw new Error('Unauthorized');
  }
  
  // Get minimum payout amount from settings
  const minimumPayout = await getMinimumPayoutAmount();
  
  if (validation.data.amount < minimumPayout) {
    throw new Error(`Minimum payout is ₦${minimumPayout.toLocaleString()}`);
  }
  
  // Check available balance
  const earnings = await calculateSellerEarnings(userId);
  
  if (validation.data.amount > earnings.availableBalance) {
    throw new Error(`Insufficient balance. Available: ₦${earnings.availableBalance.toLocaleString()}`);
  }
  
  // Check if user has payout details
  const firestore = getAdminFirestore();
  const userDoc = await firestore.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new Error('User profile not found');
  }
  
  const userData = userDoc.data() as { payoutDetails?: any };
  
  if (!userData.payoutDetails) {
    throw new Error('Please set up your bank account details first');
  }
  
  // Check for existing pending payout
  const existingPayoutSnapshot = await firestore.collection('payouts')
    .where('sellerId', '==', userId)
    .where('status', '==', 'pending')
    .get();
  
  if (!existingPayoutSnapshot.empty) {
    throw new Error('You already have a pending payout request. Please wait for it to be processed.');
  }
  
  // Create payout request
  const payoutRef = await firestore.collection('payouts').add({
    sellerId: userId,
    amount: validation.data.amount,
    bankName: userData.payoutDetails.bankName,
    bankCode: userData.payoutDetails.bankCode,
    accountNumber: userData.payoutDetails.accountNumber,
    accountName: userData.payoutDetails.accountName,
    status: 'pending',
    requestedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  });
  
  revalidatePath('/seller/payouts');
  
  return { success: true, payoutId: payoutRef.id };
}

/**
 * Process payout (Admin only)
 */
export async function processPayout(payoutId: string, adminUserId: string) {
  const auth = await requireAuth();
  
  if (!auth.isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }
  
  const firestore = getAdminFirestore();
  const payoutDoc = await firestore.collection('payouts').doc(payoutId).get();
  
  if (!payoutDoc.exists) {
    throw new Error('Payout not found');
  }
  
  const payout = payoutDoc.data() as { sellerId: string; amount: number; status: string; accountNumber: string; bankCode: string; accountName: string };
  
  if (payout.status !== 'pending') {
    throw new Error('Payout is not pending');
  }
  
  // Verify balance
  const earnings = await calculateSellerEarnings(payout.sellerId);
  
  if (payout.amount > earnings.availableBalance) {
    throw new Error(`Insufficient seller balance. Available: ₦${earnings.availableBalance.toLocaleString()}`);
  }
  
  // Initiate Paystack transfer
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  
  if (!paystackSecretKey) {
    throw new Error('Paystack secret key is not configured');
  }
  
  try {
    // Create transfer recipient first (if not exists)
    const recipientResponse = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'nuban',
        name: payout.accountName,
        account_number: payout.accountNumber,
        bank_code: payout.bankCode,
        currency: 'NGN',
      }),
    });
    
    const recipientResult = await recipientResponse.json();
    
    if (!recipientResponse.ok || !recipientResult.status) {
      throw new Error(recipientResult.message || 'Failed to create transfer recipient');
    }
    
    const recipientCode = recipientResult.data.recipient_code;
    
    // Initiate transfer
    const transferResponse = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        amount: Math.round(payout.amount * 100), // Convert to kobo
        recipient: recipientCode,
        reason: `Payout for seller ${payout.sellerId}`,
      }),
    });
    
    const transferResult = await transferResponse.json();
    
    if (!transferResponse.ok || !transferResult.status) {
      // Update payout status to failed
      await firestore.collection('payouts').doc(payoutId).update({
        status: 'failed',
        failureReason: transferResult.message || 'Transfer failed',
        processedAt: FieldValue.serverTimestamp(),
        processedBy: adminUserId,
      });
      
      throw new Error(transferResult.message || 'Transfer failed');
    }
    
    // Update payout status to completed
    await firestore.collection('payouts').doc(payoutId).update({
      status: 'completed',
      transferReference: transferResult.data.reference,
      transferCode: transferResult.data.transfer_code,
      processedAt: FieldValue.serverTimestamp(),
      processedBy: adminUserId,
    });
    
    // Send email notification
    try {
      const { sendPayoutNotificationEmail } = await import('@/lib/email-actions');
      const sellerDoc = await firestore.collection('users').doc(payout.sellerId).get();
      const sellerData = sellerDoc.data();
      
      if (sellerData?.email) {
        await sendPayoutNotificationEmail(sellerData.email, {
          ...payout,
          status: 'completed',
          transferReference: transferResult.data.reference,
        });
      }
    } catch (error) {
      console.error('Error sending payout email:', error);
      // Don't fail payout processing if email fails
    }
    
    // Create transaction record
    await firestore.collection('transactions').add({
      sellerId: payout.sellerId,
      payoutId: payoutId,
      type: 'payout',
      amount: -payout.amount,
      description: `Payout to ${payout.accountName} - ${payout.bankName}`,
      status: 'completed',
      createdAt: FieldValue.serverTimestamp(),
    });
    
    revalidatePath('/seller/payouts');
    revalidatePath('/admin/payouts');
    
    return { success: true, transferReference: transferResult.data.reference };
    
  } catch (error) {
    // Update payout status to failed
    await firestore.collection('payouts').doc(payoutId).update({
      status: 'failed',
      failureReason: (error as Error).message,
      processedAt: FieldValue.serverTimestamp(),
      processedBy: adminUserId,
    });
    
    throw error;
  }
}

/**
 * Cancel payout request (Seller only)
 */
export async function cancelPayoutRequest(payoutId: string, userId: string) {
  const auth = await requireAuth();
  
  if (auth.uid !== userId) {
    throw new Error('Unauthorized');
  }
  
  const firestore = getAdminFirestore();
  const payoutDoc = await firestore.collection('payouts').doc(payoutId).get();
  
  if (!payoutDoc.exists) {
    throw new Error('Payout not found');
  }
  
  const payout = payoutDoc.data() as { sellerId: string; status: string };
  
  if (payout.sellerId !== userId) {
    throw new Error('Unauthorized');
  }
  
  if (payout.status !== 'pending') {
    throw new Error('Only pending payouts can be cancelled');
  }
  
  await firestore.collection('payouts').doc(payoutId).update({
    status: 'cancelled',
    cancelledAt: FieldValue.serverTimestamp(),
  });
  
  revalidatePath('/seller/payouts');
  
  return { success: true };
}

/**
 * Get all payouts (Admin)
 */
export async function getAllPayouts(status?: 'pending' | 'completed' | 'failed' | 'cancelled') {
  const auth = await requireAuth();
  
  if (!auth.isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }
  
  const firestore = getAdminFirestore();
  let query = firestore.collection('payouts').orderBy('createdAt', 'desc');
  
  if (status) {
    query = query.where('status', '==', status) as any;
  }
  
  const snapshot = await query.get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

