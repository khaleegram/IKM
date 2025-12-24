'use server';

import { getAdminFirestore, getAdminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { generateAvailableSubdomain } from '@/lib/subdomain-actions';

/**
 * Create user account from guest checkout data
 * This allows guests to create an account after placing an order
 */
const createAccountFromCheckoutSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

export async function createAccountFromCheckout(data: unknown) {
  const validation = createAccountFromCheckoutSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(validation.error.errors.map(e => e.message).join(', '));
  }

  const { email, password, firstName, lastName, phone } = validation.data;

  try {
    const adminAuth = getAdminAuth();
    
    // Check if user already exists
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
      throw new Error('An account with this email already exists. Please log in instead.');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist, proceed with creation
      } else {
        throw error;
      }
    }

    // Create user account
    userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    const userId = userRecord.uid;
    const firestore = getAdminFirestore();

    // Create user profile as buyer (no store created)
    await firestore.collection('users').doc(userId).set({
      displayName: `${firstName} ${lastName}`,
      email,
      role: 'buyer', // Buyer role - no store created
      whatsappNumber: phone || '',
      firstName,
      lastName,
      phone: phone || '',
      createdAt: FieldValue.serverTimestamp(),
    });

    // Create default address from checkout info
    if (firstName && lastName) {
      await firestore.collection('users').doc(userId).collection('addresses').add({
        firstName,
        lastName,
        phone: phone || '',
        address: '', // Will be updated when user adds address
        state: '',
        isDefault: true,
        label: 'Home',
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return {
      success: true,
      userId,
      email,
    };
  } catch (error: any) {
    console.error('Failed to create account from checkout:', error);
    throw new Error(error.message || 'Failed to create account');
  }
}

