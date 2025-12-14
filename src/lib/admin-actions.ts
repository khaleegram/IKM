
'use server';

import 'dotenv/config';
import { getAuth } from 'firebase-admin/auth';
import { getAdminFirestore, getAdminApp } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';

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
        isAdmin: true, // Also store it in the document for easy querying/UI
        createdAt: new Date(),
    });
}


export async function grantAdminRole(userId: string): Promise<void> {
  const adminApp = getAdminApp();
  const auth = getAuth(adminApp);
  await auth.setCustomUserClaims(userId, { isAdmin: true });
  // Also update the user's document in Firestore to reflect the change immediately in the UI
  const firestore = getAdminFirestore();
  await firestore.collection('users').doc(userId).update({ isAdmin: true });
  revalidatePath('/admin/users');
  revalidatePath('/admin/dashboard'); // Revalidate admin pages
}

export async function revokeAdminRole(userId: string): Promise<void> {
  const adminApp = getAdminApp();
  const auth = getAuth(adminApp);
  await auth.setCustomUserClaims(userId, { isAdmin: false });
  // Also update the user's document in Firestore
  const firestore = getAdminFirestore();
  await firestore.collection('users').doc(userId).update({ isAdmin: false });
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
