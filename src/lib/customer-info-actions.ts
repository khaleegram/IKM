'use server';

import { getAdminFirestore } from './firebase/admin';
import { requireAuth } from './auth-utils';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const customerInfoSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  address: z.string().optional(),
  state: z.string().optional(),
});

/**
 * Save customer checkout information for future use
 */
export async function saveCustomerCheckoutInfo(data: unknown) {
  const auth = await requireAuth();
  const firestore = getAdminFirestore();
  
  const validation = customerInfoSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(`Invalid customer info: ${validation.error.errors.map(e => e.message).join(', ')}`);
  }
  
  // Save to user document
  await firestore.collection('users').doc(auth.uid).set({
    checkoutInfo: {
      firstName: validation.data.firstName,
      lastName: validation.data.lastName,
      email: validation.data.email,
      phone: validation.data.phone,
      address: validation.data.address,
      state: validation.data.state,
      updatedAt: FieldValue.serverTimestamp(),
    },
  }, { merge: true });
  
  revalidatePath('/profile');
  
  return { success: true };
}

/**
 * Get saved customer checkout information
 * Returns null if user is not authenticated (for guest users)
 */
export async function getCustomerCheckoutInfo() {
  try {
    const auth = await requireAuth();
    const firestore = getAdminFirestore();
    
    const userDoc = await firestore.collection('users').doc(auth.uid).get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    const userData = userDoc.data();
    return userData?.checkoutInfo || null;
  } catch (error) {
    // User not authenticated (guest) - return null
    return null;
  }
}

