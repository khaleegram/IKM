'use server';

import { z } from 'zod';
import { getAdminFirestore } from './firebase/admin';
import { requireOwnerOrAdmin } from './auth-utils';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { serializeFirestoreData } from './firestore-serializer';

export interface ShippingZone {
  id?: string;
  sellerId: string;
  name: string;
  rate: number;
  freeThreshold?: number;
  states?: string[]; // Which states this zone applies to
  createdAt?: any;
  updatedAt?: any;
}

export interface ShippingSettings {
  defaultPackagingType?: string;
  packagingCost?: number;
}

const shippingZoneSchema = z.object({
  name: z.string().min(1, 'Zone name is required'),
  rate: z.number().min(0, 'Rate must be 0 or greater'),
  freeThreshold: z.number().min(0).optional(),
  states: z.array(z.string()).optional(), // Array of states this zone applies to (e.g., ['Lagos', 'Abuja'])
});

/**
 * Get shipping zones for a seller (public - no auth required)
 * Used for checkout and public-facing features
 */
export async function getPublicShippingZones(sellerId: string): Promise<ShippingZone[]> {
  const firestore = getAdminFirestore();
  const zonesQuery = await firestore
    .collection('shipping_zones')
    .where('sellerId', '==', sellerId)
    .orderBy('createdAt', 'desc')
    .get();

  const zones = zonesQuery.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as ShippingZone));
  
  return serializeFirestoreData(zones) as ShippingZone[];
}

/**
 * Get shipping zones for a seller (requires authentication)
 * Used for seller dashboard and admin features
 */
export async function getShippingZones(sellerId: string): Promise<ShippingZone[]> {
  const auth = await requireOwnerOrAdmin(sellerId);
  
  if (auth.uid !== sellerId && !auth.isAdmin) {
    throw new Error('Unauthorized');
  }

  // Use the public function to avoid code duplication
  return getPublicShippingZones(sellerId);
}

/**
 * Create a shipping zone
 */
export async function createShippingZone(sellerId: string, data: unknown): Promise<{ success: true; zoneId: string }> {
  const auth = await requireOwnerOrAdmin(sellerId);
  
  if (auth.uid !== sellerId && !auth.isAdmin) {
    throw new Error('Unauthorized: You can only create shipping zones for your own store');
  }

  const validation = shippingZoneSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`);
  }

  const firestore = getAdminFirestore();
  const zoneRef = firestore.collection('shipping_zones').doc();

  const zoneData = {
    sellerId,
    ...validation.data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await zoneRef.set(zoneData);

  revalidatePath('/seller/shipping');
  return { success: true, zoneId: zoneRef.id };
}

/**
 * Update a shipping zone
 */
export async function updateShippingZone(sellerId: string, zoneId: string, data: unknown): Promise<{ success: true }> {
  const auth = await requireOwnerOrAdmin(sellerId);
  
  if (auth.uid !== sellerId && !auth.isAdmin) {
    throw new Error('Unauthorized');
  }

  const validation = shippingZoneSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`);
  }

  const firestore = getAdminFirestore();
  const zoneRef = firestore.collection('shipping_zones').doc(zoneId);

  // Verify zone belongs to seller
  const zoneDoc = await zoneRef.get();
  if (!zoneDoc.exists) {
    throw new Error('Shipping zone not found');
  }

  const zoneData = zoneDoc.data();
  if (zoneData?.sellerId !== sellerId && !auth.isAdmin) {
    throw new Error('Unauthorized: Zone does not belong to your store');
  }

  await zoneRef.update({
    ...validation.data,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath('/seller/shipping');
  return { success: true };
}

/**
 * Delete a shipping zone
 */
export async function deleteShippingZone(sellerId: string, zoneId: string): Promise<{ success: true }> {
  const auth = await requireOwnerOrAdmin(sellerId);
  
  if (auth.uid !== sellerId && !auth.isAdmin) {
    throw new Error('Unauthorized');
  }

  const firestore = getAdminFirestore();
  const zoneRef = firestore.collection('shipping_zones').doc(zoneId);

  // Verify zone belongs to seller
  const zoneDoc = await zoneRef.get();
  if (!zoneDoc.exists) {
    throw new Error('Shipping zone not found');
  }

  const zoneData = zoneDoc.data();
  if (zoneData?.sellerId !== sellerId && !auth.isAdmin) {
    throw new Error('Unauthorized: Zone does not belong to your store');
  }

  await zoneRef.delete();

  revalidatePath('/seller/shipping');
  return { success: true };
}

/**
 * Get shipping settings for a seller
 */
export async function getShippingSettings(sellerId: string): Promise<ShippingSettings> {
  const auth = await requireOwnerOrAdmin(sellerId);
  
  if (auth.uid !== sellerId && !auth.isAdmin) {
    throw new Error('Unauthorized');
  }

  const firestore = getAdminFirestore();
  const storeRef = firestore.collection('stores').doc(sellerId);
  const storeDoc = await storeRef.get();

  if (!storeDoc.exists) {
    return {};
  }

  const storeData = storeDoc.data();
  const settings = {
    defaultPackagingType: storeData?.shippingSettings?.defaultPackagingType,
    packagingCost: storeData?.shippingSettings?.packagingCost,
  };
  
  return serializeFirestoreData(settings) as ShippingSettings;
}

/**
 * Update shipping settings
 */
export async function updateShippingSettings(sellerId: string, data: unknown): Promise<{ success: true }> {
  const auth = await requireOwnerOrAdmin(sellerId);
  
  if (auth.uid !== sellerId && !auth.isAdmin) {
    throw new Error('Unauthorized');
  }

  const settingsSchema = z.object({
    defaultPackagingType: z.string().optional(),
    packagingCost: z.number().min(0).optional(),
  });

  const validation = settingsSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`);
  }

  const firestore = getAdminFirestore();
  const storeRef = firestore.collection('stores').doc(sellerId);

  // Check if store exists
  const storeDoc = await storeRef.get();
  if (!storeDoc.exists) {
    throw new Error('Store not found');
  }

  await storeRef.update({
    shippingSettings: {
      ...(storeDoc.data()?.shippingSettings || {}),
      ...validation.data,
    },
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath('/seller/shipping');
  return { success: true };
}

