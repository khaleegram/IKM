'use server';

import { z } from "zod";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/auth-utils";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

const addressSchema = z.object({
  label: z.string().min(1, "Label is required").max(50, "Label must not exceed 50 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  lga: z.string().min(1, "LGA is required"),
  isDefault: z.boolean().optional(),
});

/**
 * Add a new delivery address
 */
export async function addAddress(userId: string, formData: FormData) {
  const auth = await requireAuth();
  
  if (auth.uid !== userId && !auth.isAdmin) {
    throw new Error('Unauthorized');
  }

  const rawData = Object.fromEntries(formData);
  const validatedData = addressSchema.parse(rawData);

  const firestore = getAdminFirestore();

  // If this is set as default, unset other defaults
  if (validatedData.isDefault) {
    const existingAddressesSnapshot = await firestore.collection('addresses')
      .where('userId', '==', userId)
      .where('isDefault', '==', true)
      .get();

    const batch = firestore.batch();
    existingAddressesSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isDefault: false });
    });
    await batch.commit();
  }

  // Add new address
  await firestore.collection('addresses').add({
    userId,
    ...validatedData,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath('/profile/addresses');
  revalidatePath('/checkout');

  return { success: true };
}

/**
 * Update an address
 */
export async function updateAddress(addressId: string, userId: string, formData: FormData) {
  const auth = await requireAuth();
  
  if (auth.uid !== userId && !auth.isAdmin) {
    throw new Error('Unauthorized');
  }

  const rawData = Object.fromEntries(formData);
  const validatedData = addressSchema.parse(rawData);

  const firestore = getAdminFirestore();
  const addressDoc = await firestore.collection('addresses').doc(addressId).get();

  if (!addressDoc.exists) {
    throw new Error('Address not found');
  }

  const addressData = addressDoc.data();
  if (addressData?.userId !== userId && !auth.isAdmin) {
    throw new Error('Unauthorized');
  }

  // If this is set as default, unset other defaults
  if (validatedData.isDefault) {
    const existingAddressesSnapshot = await firestore.collection('addresses')
      .where('userId', '==', userId)
      .where('isDefault', '==', true)
      .get();

    const batch = firestore.batch();
    existingAddressesSnapshot.docs.forEach(doc => {
      if (doc.id !== addressId) {
        batch.update(doc.ref, { isDefault: false });
      }
    });
    await batch.commit();
  }

  // Update address
  await addressDoc.ref.update({
    ...validatedData,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath('/profile/addresses');
  revalidatePath('/checkout');

  return { success: true };
}

/**
 * Delete an address
 */
export async function deleteAddress(addressId: string, userId: string) {
  const auth = await requireAuth();
  
  if (auth.uid !== userId && !auth.isAdmin) {
    throw new Error('Unauthorized');
  }

  const firestore = getAdminFirestore();
  const addressDoc = await firestore.collection('addresses').doc(addressId).get();

  if (!addressDoc.exists) {
    throw new Error('Address not found');
  }

  const addressData = addressDoc.data();
  if (addressData?.userId !== userId && !auth.isAdmin) {
    throw new Error('Unauthorized');
  }

  await addressDoc.ref.delete();

  revalidatePath('/profile/addresses');
  revalidatePath('/checkout');

  return { success: true };
}

/**
 * Set address as default
 */
export async function setDefaultAddress(addressId: string, userId: string) {
  const auth = await requireAuth();
  
  if (auth.uid !== userId && !auth.isAdmin) {
    throw new Error('Unauthorized');
  }

  const firestore = getAdminFirestore();
  const addressDoc = await firestore.collection('addresses').doc(addressId).get();

  if (!addressDoc.exists) {
    throw new Error('Address not found');
  }

  const addressData = addressDoc.data();
  if (addressData?.userId !== userId && !auth.isAdmin) {
    throw new Error('Unauthorized');
  }

  // Unset other defaults
  const existingAddressesSnapshot = await firestore.collection('addresses')
    .where('userId', '==', userId)
    .where('isDefault', '==', true)
    .get();

  const batch = firestore.batch();
  existingAddressesSnapshot.docs.forEach(doc => {
    batch.update(doc.ref, { isDefault: false });
  });
  batch.update(addressDoc.ref, { isDefault: true, updatedAt: FieldValue.serverTimestamp() });
  await batch.commit();

  revalidatePath('/profile/addresses');
  revalidatePath('/checkout');

  return { success: true };
}

