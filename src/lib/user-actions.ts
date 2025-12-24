'use server';

import { getAdminFirestore } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireOwnerOrAdmin } from '@/lib/auth-utils';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Server Actions for User Profile Operations
 * All user profile writes go through server actions for security and validation
 */

const whatsappNumberSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid WhatsApp number format');

/**
 * Create user profile in Firestore
 * Called after user account creation to ensure the profile is created server-side
 */
export async function createUserProfile(userId: string, email: string) {
  if (!userId || !email) {
    throw new Error('User ID and email are required');
  }

  // Validate email format
  const emailSchema = z.string().email('Invalid email format');
  const emailValidation = emailSchema.safeParse(email);
  if (!emailValidation.success) {
    throw new Error('Invalid email format');
  }

  const firestore = getAdminFirestore();
  const userRef = firestore.collection('users').doc(userId);
  
  // Check if profile already exists
  const existingDoc = await userRef.get();
  if (existingDoc.exists) {
    console.log(`User profile already exists for ${userId}`);
    return { success: true, alreadyExists: true };
  }
  
  // Create the profile with default values
  const defaultStoreName = email.split('@')[0] || 'New Seller';
  
  await userRef.set({
    displayName: defaultStoreName,
    email: email,
    role: 'seller', // Default role for signup is seller (they get a store)
    whatsappNumber: '',
    createdAt: FieldValue.serverTimestamp(),
  });
  
  // Also initialize a store for this user (using userId as document ID)
  const storeRef = firestore.collection('stores').doc(userId);
  const storeDoc = await storeRef.get();
  
  if (!storeDoc.exists) {
    const storeName = `${defaultStoreName}'s Store`;
    // Generate subdomain from store name
    const subdomain = await generateAvailableSubdomain(storeName, userId);
    
    await storeRef.set({
      userId,
      storeName,
      storeDescription: 'Welcome to my new store!',
      subdomain, // Auto-generated subdomain
      onboardingCompleted: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`✨ Store initialized for new user: ${userId} with subdomain: ${subdomain}`);
  }
  
  console.log(`User profile created successfully for ${userId}`);
  return { success: true, alreadyExists: false };
}

/**
 * Update basic user profile (name, description, WhatsApp)
 * Write Contract: 1. Input Validation, 2. Authorization, 3. Domain Logic, 4. Firestore Write
 */
export async function updateUserProfileAction(
  userId: string,
  data: {
    storeName?: string;
    storeDescription?: string;
    whatsappNumber?: string;
  }
) {
  // 2. Authorization Check
  const auth = await requireOwnerOrAdmin(userId);

  // 1. Input Validation
  if (!userId) {
    throw new Error('User ID is required');
  }

  const firestore = getAdminFirestore();
  const userRef = firestore.collection('users').doc(userId);

  // Verify user exists
  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    throw new Error('User profile does not exist');
  }

  const updateData: any = {};

  if (data.storeName !== undefined) {
    if (data.storeName.trim().length === 0) {
      throw new Error('Store name cannot be empty');
    }
    updateData.storeName = data.storeName.trim();
  }

  if (data.storeDescription !== undefined) {
    if (data.storeDescription.trim().length > 0 && data.storeDescription.trim().length < 10) {
      throw new Error('Store description must be at least 10 characters');
    }
    updateData.storeDescription = data.storeDescription.trim();
  }

  if (data.whatsappNumber !== undefined) {
    if (data.whatsappNumber.trim().length > 0) {
      const validation = whatsappNumberSchema.safeParse(data.whatsappNumber.trim());
      if (!validation.success) {
        throw new Error('Invalid WhatsApp number format. Use format: +234...');
      }
      updateData.whatsappNumber = data.whatsappNumber.trim();
    } else {
      updateData.whatsappNumber = '';
    }
  }

  await userRef.update(updateData);

  revalidatePath('/seller/settings');
  revalidatePath('/seller/dashboard');

  return { success: true };
}

/**
 * Add delivery location
 * Write Contract: 1. Input Validation, 2. Authorization, 3. Domain Logic, 4. Firestore Write
 */
export async function addDeliveryLocationAction(userId: string, locationName: string) {
  // 2. Authorization Check
  const auth = await requireOwnerOrAdmin(userId);

  // 1. Input Validation
  if (!userId) {
    throw new Error('User ID is required');
  }

  if (!locationName || locationName.trim().length === 0) {
    throw new Error('Location name is required');
  }

  const firestore = getAdminFirestore();
  const locationsRef = firestore.collection('users').doc(userId).collection('deliveryLocations');

  // Check if location already exists
  const existingLocations = await locationsRef.get();
  const duplicate = existingLocations.docs.find(
    doc => doc.data().name.toLowerCase() === locationName.trim().toLowerCase()
  );

  if (duplicate) {
    throw new Error('This location already exists');
  }

  await locationsRef.add({
    name: locationName.trim(),
    createdAt: new Date(),
  });

  revalidatePath('/seller/settings');

  return { success: true };
}

/**
 * Delete delivery location
 * Write Contract: 1. Input Validation, 2. Authorization, 3. Domain Logic, 4. Firestore Write
 */
export async function deleteDeliveryLocationAction(userId: string, locationId: string) {
  // 2. Authorization Check
  const auth = await requireOwnerOrAdmin(userId);

  // 1. Input Validation
  if (!userId || !locationId) {
    throw new Error('User ID and location ID are required');
  }

  const firestore = getAdminFirestore();
  const locationRef = firestore
    .collection('users')
    .doc(userId)
    .collection('deliveryLocations')
    .doc(locationId);

  // Verify location exists and belongs to user
  const locationDoc = await locationRef.get();
  if (!locationDoc.exists) {
    throw new Error('Location not found');
  }

  await locationRef.delete();

  revalidatePath('/seller/settings');

  return { success: true };
}
