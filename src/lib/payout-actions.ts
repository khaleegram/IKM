
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
    { code: "221", name: "Stanbic IBTC Bank" },
    { code: "033", name: "United Bank For Africa" },
    { code: "035", name: "Wema Bank" },
    { code: "057", name: "Zenith Bank" },
    { code: "125", name: "OPay" },
    { code: "126", name: "Kuda Bank" },
    { code: "127", name: "Palmpay" }
];

const accountNumberSchema = z.string().length(10, "Account number must be 10 digits.");

// Helper function to fetch banks from Paystack (for verification)
async function fetchPaystackBanks(secretKey: string) {
    try {
        const response = await fetch('https://api.paystack.co/bank?country=nigeria', {
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.status && result.data) {
                return result.data;
            }
        }
        return null;
    } catch {
        return null;
    }
}

export async function getBanksForAccountNumber(accountNumber: string) {
    const validation = accountNumberSchema.safeParse(accountNumber);
    if (!validation.success) {
        throw new Error(validation.error.errors.map(e => e.message).join(', '));
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
        throw new Error('Paystack secret key is not configured. Please contact support.');
    }

    // In development, verify we can connect to Paystack
    if (process.env.NODE_ENV === 'development') {
        const testBanks = await fetchPaystackBanks(paystackSecretKey);
        if (!testBanks) {
            console.warn('Warning: Could not fetch banks from Paystack. Check your API key.');
        }
    }

    // Try resolving with major banks in parallel
    // Use Promise.allSettled to handle individual failures gracefully
    const bankPromises = MAJOR_NIGERIAN_BANKS.map(async (bank) => {
        try {
            const response = await fetch(
                `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bank.code}`,
                {
                    headers: {
                        Authorization: `Bearer ${paystackSecretKey}`,
                        'Content-Type': 'application/json',
                    },
                    cache: 'no-store',
                }
            );

            if (!response.ok) {
                // Try to get error message from response
                try {
                    const errorResult = await response.json();
                    // Log for debugging
                    if (process.env.NODE_ENV === 'development') {
                        console.log(`Paystack error for ${bank.name} (${response.status}):`, errorResult.message || 'Unknown error');
                    }
                } catch {
                    // Couldn't parse error response
                }
                
                // If response is not ok, check if it's a 400 (invalid account) or other error
                if (response.status === 400 || response.status === 404) {
                    return null; // Account doesn't exist for this bank
                }
                
                // For rate limiting (429) or server errors (500+), we might want to retry
                // For now, just return null
                return null;
            }

            const result = await response.json();
            
            // Paystack returns { status: true, message: "Account resolved", data: { account_name, account_number, bank_id } }
            // OR { status: false, message: "..." } on error
            if (result.status === true && result.data && result.data.account_name) {
                return {
                    bank_id: result.data.bank_id || parseInt(bank.code),
                    bank_name: bank.name,
                    account_name: result.data.account_name,
                    account_number: result.data.account_number || accountNumber,
                };
            }
            
            // Log for debugging (only in development)
            if (process.env.NODE_ENV === 'development') {
                if (result.message) {
                    console.log(`Paystack response for ${bank.name}:`, result.message);
                }
                if (result.status === false) {
                    console.log(`Paystack failed for ${bank.name}:`, result);
                }
            }
            
            return null;
        } catch (error) {
            // Network or other errors - silently fail for individual banks
            return null;
        }
    });

    const results = await Promise.allSettled(bankPromises);
    
    // Collect successful resolutions
    const resolvedAccounts: any[] = [];
    results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
            resolvedAccounts.push(result.value);
        }
    });

    // Return results (empty array if no banks found)
    if (resolvedAccounts.length === 0 && process.env.NODE_ENV === 'development') {
        console.log('No banks found for account number:', accountNumber);
        console.log('Checked', MAJOR_NIGERIAN_BANKS.length, 'banks');
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

    const userId = (await headers()).get('X-User-UID');
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
