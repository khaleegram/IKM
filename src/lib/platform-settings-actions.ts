'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAuth } from './auth-utils';
import { getAdminFirestore } from './firebase/admin';
import type { PlatformSettings } from './firebase/firestore/platform-settings';

const SETTINGS_DOC_ID = 'platform_settings';

const updateSettingsSchema = z.object({
  platformCommissionRate: z.number().min(0).max(1).optional(), // 0 to 100% (0 to 1)
  minimumPayoutAmount: z.number().min(0).optional(),
  platformFee: z.number().min(0).optional(),
  currency: z.string().optional(),
  payoutProcessingDays: z.number().min(1).max(30).optional(), // 1 to 30 business days
});

/**
 * Get current platform settings
 * Falls back to defaults if settings don't exist
 */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  const firestore = getAdminFirestore();
  const settingsDoc = await firestore.collection('platform_settings').doc(SETTINGS_DOC_ID).get();
  
  if (settingsDoc.exists) {
    return {
      id: settingsDoc.id,
      ...settingsDoc.data(),
    } as PlatformSettings;
  }
  
  // Return default settings
  return {
    id: SETTINGS_DOC_ID,
    platformCommissionRate: 0.05, // 5%
    minimumPayoutAmount: 1000, // ₦1000
    totalRevenue: 0,
    totalTransactions: 0,
    platformFee: 0,
    currency: 'NGN',
    payoutProcessingDays: 3, // Default: 3 business days
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: 'system',
    createdAt: FieldValue.serverTimestamp(),
  };
}

/**
 * Update platform settings (Admin only)
 */
export async function updatePlatformSettings(data: unknown) {
  const auth = await requireAuth();
  
  // Check if user is admin
  if (!auth.isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }
  
  const validation = updateSettingsSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(`Invalid settings data: ${validation.error.errors.map(e => e.message).join(', ')}`);
  }
  
  const firestore = getAdminFirestore();
  const settingsRef = firestore.collection('platform_settings').doc(SETTINGS_DOC_ID);
  
  // Get current settings to preserve values not being updated
  const currentSettings = await getPlatformSettings();
  
  // Prepare update data
  const updateData: any = {
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: auth.uid,
  };
  
  // Only update provided fields
  if (validation.data.platformCommissionRate !== undefined) {
    updateData.platformCommissionRate = validation.data.platformCommissionRate;
  }
  if (validation.data.minimumPayoutAmount !== undefined) {
    updateData.minimumPayoutAmount = validation.data.minimumPayoutAmount;
  }
  if (validation.data.platformFee !== undefined) {
    updateData.platformFee = validation.data.platformFee;
  }
  if (validation.data.currency !== undefined) {
    updateData.currency = validation.data.currency;
  }
  if (validation.data.payoutProcessingDays !== undefined) {
    updateData.payoutProcessingDays = validation.data.payoutProcessingDays;
  }
  
  // If document doesn't exist, create it with defaults
  if (!(await settingsRef.get()).exists) {
    await settingsRef.set({
      ...currentSettings,
      ...updateData,
      createdAt: FieldValue.serverTimestamp(),
    });
  } else {
    await settingsRef.update(updateData);
  }
  
  revalidatePath('/admin/settings');
  
  return { success: true };
}

/**
 * Get platform commission rate (with caching)
 */
let cachedCommissionRate: number | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getPlatformCommissionRate(): Promise<number> {
  // Return cached value if still valid
  if (cachedCommissionRate !== null && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedCommissionRate;
  }
  
  const settings = await getPlatformSettings();
  cachedCommissionRate = settings.platformCommissionRate;
  cacheTimestamp = Date.now();
  
  return cachedCommissionRate;
}

/**
 * Get minimum payout amount (with caching)
 */
let cachedMinimumPayout: number | null = null;
let cachePayoutTimestamp: number = 0;

export async function getMinimumPayoutAmount(): Promise<number> {
  // Return cached value if still valid
  if (cachedMinimumPayout !== null && Date.now() - cachePayoutTimestamp < CACHE_DURATION) {
    return cachedMinimumPayout;
  }
  
  const settings = await getPlatformSettings();
  cachedMinimumPayout = settings.minimumPayoutAmount;
  cachePayoutTimestamp = Date.now();
  
  return cachedMinimumPayout;
}

/**
 * Get payout processing days (with caching)
 */
let cachedPayoutProcessingDays: number | null = null;
let cachePayoutProcessingDaysTimestamp: number = 0;

export async function getPayoutProcessingDays(): Promise<number> {
  // Return cached value if still valid
  if (cachedPayoutProcessingDays !== null && Date.now() - cachePayoutProcessingDaysTimestamp < CACHE_DURATION) {
    return cachedPayoutProcessingDays;
  }
  
  const settings = await getPlatformSettings();
  cachedPayoutProcessingDays = settings.payoutProcessingDays || 3; // Default: 3 days
  cachePayoutProcessingDaysTimestamp = Date.now();
  
  return cachedPayoutProcessingDays;
}

/**
 * Clear settings cache (call after updates)
 */
export async function clearSettingsCache() {
  cachedCommissionRate = null;
  cachedMinimumPayout = null;
  cacheTimestamp = 0;
  cachePayoutTimestamp = 0;
}

