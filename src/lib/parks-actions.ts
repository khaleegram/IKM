'use server';

import { z } from 'zod';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth-utils';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

const parkSchema = z.object({
  name: z.string().min(1, 'Park name is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  isActive: z.boolean().default(true),
});

/**
 * Get all parks (public - no auth required for checkout/order flow)
 */
export async function getAllParks() {
  const firestore = getAdminFirestore();
  const parksQuery = await firestore
    .collection('parks')
    .orderBy('state', 'asc')
    .orderBy('city', 'asc')
    .orderBy('name', 'asc')
    .get();

  const parks = parksQuery.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  return parks;
}

/**
 * Get parks by state (public - for order marking)
 */
export async function getParksByState(state: string) {
  const firestore = getAdminFirestore();
  const parksQuery = await firestore
    .collection('parks')
    .where('state', '==', state)
    .where('isActive', '==', true)
    .orderBy('city', 'asc')
    .orderBy('name', 'asc')
    .get();

  const parks = parksQuery.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  return parks;
}

/**
 * Create a park (admin only)
 */
export async function createPark(data: unknown) {
  await requireAdmin();
  
  const validation = parkSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(validation.error.errors.map(e => e.message).join(', '));
  }

  const firestore = getAdminFirestore();
  const parkRef = firestore.collection('parks').doc();

  const parkData = {
    ...validation.data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await parkRef.set(parkData);

  revalidatePath('/admin/parks');
  return { success: true, parkId: parkRef.id };
}

/**
 * Update a park (admin only)
 */
export async function updatePark(parkId: string, data: unknown) {
  await requireAdmin();
  
  const validation = parkSchema.partial().safeParse(data);
  if (!validation.success) {
    throw new Error(validation.error.errors.map(e => e.message).join(', '));
  }

  const firestore = getAdminFirestore();
  const parkRef = firestore.collection('parks').doc(parkId);
  const parkDoc = await parkRef.get();

  if (!parkDoc.exists) {
    throw new Error('Park not found');
  }

  await parkRef.update({
    ...validation.data,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath('/admin/parks');
  return { success: true };
}

/**
 * Delete a park (admin only)
 */
export async function deletePark(parkId: string) {
  await requireAdmin();

  const firestore = getAdminFirestore();
  const parkRef = firestore.collection('parks').doc(parkId);
  const parkDoc = await parkRef.get();

  if (!parkDoc.exists) {
    throw new Error('Park not found');
  }

  await parkRef.delete();

  revalidatePath('/admin/parks');
  return { success: true };
}

