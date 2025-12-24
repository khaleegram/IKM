
'use server';

import 'dotenv/config';
import { getAuth } from 'firebase-admin/auth';
import { getAdminFirestore, getAdminApp } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-utils';

export async function createAdminUser(userId: string, email: string, displayName: string): Promise<void> {
    const adminApp = getAdminApp();
    if (!adminApp) {
        throw new Error("Admin SDK not initialized. Check server logs for details.");
    }
    const auth = getAuth(adminApp);
    const firestore = getAdminFirestore();

    // Set custom claim first
    await auth.setCustomUserClaims(userId, { isAdmin: true });

    // Then create user profile document
    await firestore.collection('users').doc(userId).set({
        displayName: displayName,
        email: email,
        role: 'admin', // Admin role
        isAdmin: true, // Also store it in the document for easy querying/UI (backward compatibility)
        createdAt: new Date(),
    });
}


/**
 * Grant admin role to user
 * Write Contract: 1. Input Validation, 2. Authorization, 3. Domain Logic, 4. Firestore Write
 */
export async function grantAdminRole(userId: string): Promise<void> {
  // 2. Authorization Check - only admins can grant admin role
  await requireAdmin();

  // 1. Input Validation
  if (!userId) {
    throw new Error('User ID is required');
  }

  // 3. Domain Logic
  const adminApp = getAdminApp();
  const auth = getAuth(adminApp);
  
  // 4. Firestore Write
  await auth.setCustomUserClaims(userId, { isAdmin: true });
  
  // Revoke all existing sessions to force token refresh with new claims
  // This ensures the user gets the updated admin status immediately
  try {
    await auth.revokeRefreshTokens(userId);
  } catch (error) {
    console.warn('Could not revoke refresh tokens (user might not exist):', error);
  }
  
  // Also update the user's document in Firestore to reflect the change immediately in the UI
  const firestore = getAdminFirestore();
  await firestore.collection('users').doc(userId).update({ 
    isAdmin: true,
    role: 'admin' // Update role field
  });
  
  revalidatePath('/admin/users');
  revalidatePath('/admin/dashboard'); // Revalidate admin pages
}

/**
 * Revoke admin role from user
 * Write Contract: 1. Input Validation, 2. Authorization, 3. Domain Logic, 4. Firestore Write
 */
export async function revokeAdminRole(userId: string): Promise<void> {
  // 2. Authorization Check - only admins can revoke admin role
  await requireAdmin();

  // 1. Input Validation
  if (!userId) {
    throw new Error('User ID is required');
  }

  // 3. Domain Logic - prevent self-revocation
  const auth = await requireAdmin();
  if (auth.uid === userId) {
    throw new Error('Cannot revoke your own admin role');
  }

  // 4. Firestore Write
  const adminApp = getAdminApp();
  const adminAuth = getAuth(adminApp);
  await adminAuth.setCustomUserClaims(userId, { isAdmin: false });
  
  // Revoke all existing sessions to force token refresh with new claims
  // This ensures the user loses admin access immediately
  try {
    await adminAuth.revokeRefreshTokens(userId);
  } catch (error) {
    console.warn('Could not revoke refresh tokens (user might not exist):', error);
  }
  
  // Also update the user's document in Firestore
  const firestore = getAdminFirestore();
  
  // Determine new role: if user has a store, they're a seller, otherwise buyer
  const hasStore = await firestore.collection('stores').doc(userId).get();
  const newRole = hasStore.exists ? 'seller' : 'buyer';
  
  await firestore.collection('users').doc(userId).update({ 
    isAdmin: false,
    role: newRole // Update role based on whether they have a store
  });
  
  revalidatePath('/admin/users');
}

export async function grantAdminRoleToFirstUser(userId: string): Promise<boolean> {
    try {
        const firestore = getAdminFirestore();
        const usersSnapshot = await firestore.collection('users').limit(2).get();
        const adminUsersSnapshot = await firestore.collection('users').where('isAdmin', '==', true).limit(1).get();

        // If there is only one user in the database AND no admins exist, make them an admin.
        if (usersSnapshot.size === 1 && adminUsersSnapshot.empty) {
            console.log(`This is the first user (${userId}) and no admins exist. Granting admin role.`);
            await grantAdminRole(userId);
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error in grantAdminRoleToFirstUser:", error);
        // Don't throw, as this is a non-critical setup step.
        return false;
    }
}
