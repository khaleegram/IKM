/**
 * Server Action Template
 * 
 * This file serves as a template for creating new server actions.
 * Copy this template and follow the Write Contract pattern:
 * 1. Input Validation (Zod)
 * 2. Authorization Check (requireAuth/requireAdmin/requireOwnerOrAdmin)
 * 3. Domain Logic (Business Rules)
 * 4. Firestore Write (Admin SDK)
 * 5. Cache Invalidation (revalidatePath)
 * 
 * DO NOT use this file directly - copy the pattern to your new action file.
 */

'use server';

import { z } from 'zod';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';
import { requireAuth, requireAdmin, requireOwnerOrAdmin } from '@/lib/auth-utils';

// 1. Define Zod schema for input validation
const exampleSchema = z.object({
  field1: z.string().min(1, 'Field 1 is required'),
  field2: z.number().positive('Field 2 must be positive'),
  optionalField: z.string().optional(),
});

/**
 * Example server action following Write Contract pattern
 * 
 * @param userId - User ID (will be verified against authenticated user)
 * @param data - FormData or object to validate
 * @returns Success result
 */
export async function exampleAction(userId: string, data: FormData) {
  // 2. Authorization Check (ALWAYS FIRST - prevents unauthorized access)
  // Choose the appropriate auth check:
  // - requireAuth() - Any authenticated user
  // - requireAdmin() - Admin only
  // - requireOwnerOrAdmin(userId) - Owner or admin
  const auth = await requireOwnerOrAdmin(userId);

  // 1. Input Validation
  const rawData: Record<string, any> = {};
  data.forEach((value, key) => {
    rawData[key] = value;
  });

  const validation = exampleSchema.safeParse(rawData);
  if (!validation.success) {
    throw new Error(validation.error.errors.map(e => e.message).join(', '));
  }

  // 3. Domain Logic (Business Rules)
  // Apply any business rules, state machine validation, etc.
  if (validation.data.field1.length > 100) {
    throw new Error('Field 1 is too long');
  }

  // 4. Firestore Write
  const firestore = getAdminFirestore();
  const docRef = firestore.collection('collection').doc('id');
  
  await docRef.set({
    ...validation.data,
    userId: auth.uid, // Use verified auth.uid, not parameter
    updatedAt: new Date(),
  });

  // 5. Cache Invalidation
  revalidatePath('/relevant/path');
  revalidatePath(`/relevant/path/${docRef.id}`);

  return { success: true };
}

/**
 * Example: Admin-only action
 */
export async function exampleAdminAction(data: FormData) {
  // 2. Authorization Check - Admin only
  await requireAdmin();

  // 1. Input Validation
  // ... validation code ...

  // 3. Domain Logic
  // ... business rules ...

  // 4. Firestore Write
  // ... write code ...

  // 5. Cache Invalidation
  revalidatePath('/admin/relevant/path');

  return { success: true };
}

/**
 * Example: Action that doesn't need userId parameter
 * (gets it from auth instead)
 */
export async function exampleActionWithoutUserId(data: FormData) {
  // 2. Authorization Check
  const auth = await requireAuth();

  // 1. Input Validation
  // ... validation code ...

  // 3. Domain Logic
  // ... business rules ...

  // 4. Firestore Write
  const firestore = getAdminFirestore();
  // Note: In real implementation, you would have validation from step 1
  // This is just a template showing the pattern
  await firestore.collection('collection').add({
    // ... validated data from step 1 ...
    userId: auth.uid, // Use auth.uid from verified token
    createdAt: new Date(),
  });

  // 5. Cache Invalidation
  revalidatePath('/relevant/path');

  return { success: true };
}

