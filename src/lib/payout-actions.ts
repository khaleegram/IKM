
'use server';

import { z } from "zod";
import { getAdminFirestore } from "./firebase/admin";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// A curated list of major banks for faster resolution
const MAJOR_NIGERIAN_BANKS = [
    { code: "044", name: "Access Bank" },
    { code: "023", name: "Citibank Nigeria" },
    { code: "063", name: "Access Bank (Diamond)" },
    { code: "050", name: "Ecobank Nigeria" },
    { code: "070", name: "Fidelity Bank" },
    { code: "011", name: "First Bank of Nigeria" },
    { code: "214", name: "First City Monument Bank" },
    { code: "058", name: "Guaranty Trust Bank" },
    { code: "082", name: "Keystone Bank" },
    { code: "076", name: "Polaris Bank" },
    { code: "101", name: "Providus Bank" },
    { code: "221", "name": "Stanbic IBTC Bank" },
    { code: "033", name: "United Bank For Africa" },
    { code: "035", name: "Wema Bank" },
    { code: "057", name: "Zenith Bank" },
    { code: "125", name: "OPay" },
    { code: "126", name: "Kuda Bank" },
    { code: "127", name: "Palmpay" }
];

const accountNumberSchema = z.string().length(10, "Account number must be 10 digits.");

export async function getBanksForAccountNumber(accountNumber: string) {
    const validation = accountNumberSchema.safeParse(accountNumber);
    if (!validation.success) {
        throw new Error(validation.error.errors.map(e => e.message).join(', '));
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    const resolvedAccounts: any[] = [];

    const promises = MAJOR_NIGERIAN_BANKS.map(async (bank) => {
        try {
             const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bank.code}`, {
                headers: {
                    Authorization: `Bearer ${paystackSecretKey}`,
                },
                cache: 'no-store',
            });

            if (response.ok) {
                const result = await response.json();
                if (result.status && result.data) {
                    resolvedAccounts.push(result.data);
                }
            }
        } catch (error) {
            // Ignore individual bank resolution errors
            console.warn(`Could not resolve account with ${bank.name}:`, error);
        }
    });

    await Promise.all(promises);

    if (resolvedAccounts.length === 0) {
        // As a fallback, try to resolve with any bank (without bank_code)
        // This might return multiple results from Paystack
         try {
             const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}`, {
                headers: {
                    Authorization: `Bearer ${paystackSecretKey}`,
                },
                cache: 'no-store',
            });
            if (response.ok) {
                 const result = await response.json();
                 if (result.status && result.data && Array.isArray(result.data)) {
                    return result.data;
                 } else if (result.status && result.data) {
                    return [result.data];
                 }
            }
        } catch (error) {
             console.error('Fallback account resolution failed:', error);
        }
    }
    
    return resolvedAccounts;
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
