
'use server';

import 'dotenv/config';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';

// This is a separate admin app instance for the actions,
// to avoid conflicts with the one in firebase/admin.ts if initialization logic differs.
let adminApp: App;

function initializeAdminApp() {
    if (!getApps().some(app => app.name === 'admin-actions')) {
         try {
            const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
            if (!serviceAccountString) {
                throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
            }
            const serviceAccount = JSON.parse(serviceAccountString);
            
            adminApp = initializeApp({
                credential: cert(serviceAccount),
            }, 'admin-actions');
        } catch (e: any) {
            console.error('Admin Actions: Firebase Admin initialization error:', e.message);
            throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set or is invalid JSON.');
        }
    } else {
        adminApp = getApps().find(app => app.name === 'admin-actions')!;
    }
}

initializeAdminApp();


export async function grantAdminRole(userId: string): Promise<void> {
  const auth = getAuth(adminApp);
  await auth.setCustomUserClaims(userId, { isAdmin: true });
  // Also update the user's document in Firestore to reflect the change immediately in the UI
  const firestore = getAdminFirestore();
  await firestore.collection('users').doc(userId).update({ isAdmin: true });
  revalidatePath('/admin/users');
  revalidatePath('/admin/dashboard'); // Revalidate admin pages
}

export async function revokeAdminRole(userId: string): Promise<void> {
  const auth = getAuth(adminApp);
  await auth.setCustomUserClaims(userId, { isAdmin: false });
  // Also update the user's document in Firestore
  const firestore = getAdminFirestore();
  await firestore.collection('users').doc(userId).update({ isAdmin: false });
  revalidatePath('/admin/users');
}

export async function grantAdminRoleToFirstUser(userId: string): Promise<boolean> {
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
}
