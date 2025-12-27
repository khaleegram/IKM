'use server';

import { getAdminFirestore } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth-utils';
import { FieldValue } from 'firebase-admin/firestore';
import { NORTHERN_PARKS } from '@/lib/data/northern-parks';

/**
 * Initialize parks in Firestore from static data
 * This should be run once by an admin to populate the parks collection
 */
export async function initializeParks() {
  await requireAdmin();
  
  const firestore = getAdminFirestore();
  const parksRef = firestore.collection('parks');
  
  // Check if parks already exist
  const existingParks = await parksRef.get();
  if (!existingParks.empty) {
    throw new Error('Parks already initialized. Delete existing parks first if you want to reinitialize.');
  }

  // Add all parks from static data
  const batch = firestore.batch();
  NORTHERN_PARKS.forEach((park) => {
    const parkRef = parksRef.doc();
    batch.set(parkRef, {
      name: park.name,
      city: park.city,
      state: park.state,
      isActive: park.isActive,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();

  return { success: true, count: NORTHERN_PARKS.length };
}

