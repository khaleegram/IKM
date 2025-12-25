
'use server';

import { z } from "zod";
import { getAdminFirestore } from "./firebase/admin";
import { revalidatePath } from "next/cache";
import { requireAuth } from "./auth-utils";

const accountNumberSchema = z.string().length(10, "Account number must be 10 digits.");
const bankCodeSchema = z.string().min(1, "Bank code is required");

// Cache bank list in memory (refresh once per day or on server restart)
let cachedBankList: Array<{ code: string; name: string; id: number }> | null = null;
let bankListCacheTime: number = 0;
const BANK_LIST_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch and cache bank list from Paystack
 * This should be called once per day, not on every request
 */
async function fetchPaystackBanks(secretKey: string): Promise<Array<{ code: string; name: string; id: number }> | null> {
    // Return cached list if still valid
    if (cachedBankList && Date.now() - bankListCacheTime < BANK_LIST_CACHE_DURATION) {
        return cachedBankList;
    }

    try {
        const response = await fetch('https://api.paystack.co/bank?country=nigeria', {
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });
        
        if (!response.ok) {
            // If we have cached data, return it even if expired
            if (cachedBankList) {
                console.warn('Failed to refresh bank list, using stale cache');
                return cachedBankList;
            }
            
            const errorText = await response.text();
            console.error(`Paystack bank list API error (${response.status}):`, errorText);
            
            if (response.status === 401 || response.status === 403) {
                console.error('Paystack API authentication failed. Please check your PAYSTACK_SECRET_KEY in .env.local');
            }
            return null;
        }
        
        const result = await response.json();
        if (result.status && result.data) {
            const banksMap = new Map<string, { code: string; name: string; id: number }>();
            
            // Deduplicate by bank code (use first occurrence)
            result.data.forEach((bank: any) => {
                const code = bank.code || bank.id.toString();
                if (code && !banksMap.has(code)) {
                    banksMap.set(code, {
                        code: code,
                        name: bank.name,
                        id: bank.id,
                    });
                }
            });
            
            const banks = Array.from(banksMap.values());
            
            // Update cache
            cachedBankList = banks;
            bankListCacheTime = Date.now();
            
            return banks;
        }
        
        // If we have cached data, return it
        if (cachedBankList) {
            return cachedBankList;
        }
        
        return null;
    } catch (error) {
        console.error('Error fetching banks from Paystack:', error);
        // Return cached data if available
        if (cachedBankList) {
            return cachedBankList;
        }
        return null;
    }
}

/**
 * Get list of all Nigerian banks
 * Cached for 24 hours
 */
export async function getBanksList() {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
        throw new Error('Paystack secret key is not configured. Please ensure PAYSTACK_SECRET_KEY is set in your .env.local file.');
    }

    const banks = await fetchPaystackBanks(paystackSecretKey);
    if (!banks || banks.length === 0) {
        throw new Error('Unable to fetch banks list. Please try again later.');
    }

    // Sort by name for easier selection
    return banks.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Resolve account number with a specific bank code
 * This is the correct way to use Paystack's bank resolution API
 */
export async function resolveAccountNumber(accountNumber: string, bankCode: string) {
    const validation = accountNumberSchema.safeParse(accountNumber);
    if (!validation.success) {
        throw new Error(validation.error.errors.map(e => e.message).join(', '));
    }

    const bankCodeValidation = bankCodeSchema.safeParse(bankCode);
    if (!bankCodeValidation.success) {
        throw new Error('Invalid bank code');
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
        throw new Error('Paystack secret key is not configured. Please ensure PAYSTACK_SECRET_KEY is set in your .env.local file.');
    }

    try {
        const response = await fetch(
            `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
            {
                headers: {
                    Authorization: `Bearer ${paystackSecretKey}`,
                    'Content-Type': 'application/json',
                },
                cache: 'no-store',
                signal: AbortSignal.timeout(10000), // 10 second timeout
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            
            if (response.status === 400) {
                throw new Error(errorData.message || 'Invalid account number or bank code');
            }
            
            if (response.status === 401 || response.status === 403) {
                throw new Error('Paystack API authentication failed. Please check your configuration.');
            }
            
            throw new Error(errorData.message || `Paystack API error: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.status === true && result.data && result.data.account_name) {
            return {
                bank_id: result.data.bank_id || parseInt(bankCode),
                account_name: result.data.account_name,
                account_number: result.data.account_number || accountNumber,
            };
        }
        
        throw new Error(result.message || 'Unable to resolve account number');
    } catch (error: any) {
        if (error.name === 'AbortError') {
            throw new Error('Request timeout. Please try again.');
        }
        throw error;
    }
}

const savePayoutDetailsSchema = z.object({
    bankName: z.string(),
    bankCode: z.string(),
    accountNumber: z.string(),
    accountName: z.string(),
});

/**
 * Save payout details for authenticated user
 * Properly verifies authentication using Firebase session cookie
 */
export async function savePayoutDetails(data: unknown) {
    const validation = savePayoutDetailsSchema.safeParse(data);
    if (!validation.success) {
        throw new Error('Invalid payout details provided.');
    }

    // Properly verify authentication using Firebase session cookie
    const auth = await requireAuth();

    const firestore = getAdminFirestore();
    const userRef = firestore.collection('users').doc(auth.uid);
    
    // Verify user exists and can receive payouts
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        throw new Error('User profile not found');
    }
    
    const userData = userDoc.data();
    // Optionally verify user role (sellers/admins can receive payouts)
    if (userData?.role && !['seller', 'admin'].includes(userData.role)) {
        throw new Error('Only sellers and admins can set payout details');
    }

    await userRef.update({
        payoutDetails: validation.data,
        updatedAt: new Date(),
    });
    
    revalidatePath('/seller/payouts');

    return { success: true };
}