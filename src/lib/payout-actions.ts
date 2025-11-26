
'use server';

import 'dotenv/config';
import { z } from "zod";
import { updateUserProfile } from "./firebase/firestore/users";
import { getAdminFirestore } from "./firebase/admin";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

const verifyAccountSchema = z.object({
  accountNumber: z.string().length(10, "Account number must be 10 digits."),
  bankCode: z.string().min(1, "Bank code is required."),
});

export async function verifyBankAccount(data: unknown) {
  const validation = verifyAccountSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(validation.error.errors.map(e => e.message).join(', '));
  }
  const { accountNumber, bankCode } = validation.data;

  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
      headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
      },
      cache: 'no-store',
  });

  const result = await response.json();

  if (!response.ok || !result.status || !result.data) {
    throw new Error(result.message || 'Could not verify bank account details.');
  }

  return { accountName: result.data.account_name };
}


const savePayoutDetailsSchema = z.object({
    bankName: z.string(),
    bankCode: z.string(),
    accountNumber: z.string(),
    accountName: z.string(),
});

export async function savePayoutDetails(data: unknown) {
    const validation = savePayoutDetailsSchema.safeParse(data);
    if (!validation.success) {
        throw new Error('Invalid payout details provided.');
    }

    const userId = headers().get('X-User-UID');
    if (!userId) {
        throw new Error('User is not authenticated.');
    }

    const firestore = getAdminFirestore();
    const userRef = firestore.collection('users').doc(userId);

    await userRef.update({
        payoutDetails: validation.data
    });
    
    revalidatePath('/seller/payouts');

    return { success: true };
}
