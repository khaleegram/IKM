
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import 'dotenv/config';

let adminApp: App;
let adminFirestore: Firestore;
let adminStorage: Storage;

function initializeAdminApp() {
    if (getApps().length > 0) {
        adminApp = getApps()[0];
    } else {
        try {
            const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
            if (!serviceAccountString) {
                throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
            }
            const serviceAccount = JSON.parse(serviceAccountString);
            adminApp = initializeApp({
                credential: cert(serviceAccount),
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            });
        } catch (e: any) {
            console.error('Firebase Admin initialization error:', e.message);
            throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set or is invalid JSON.');
        }
    }

    adminFirestore = getFirestore(adminApp);
    adminFirestore.settings({
        ignoreUndefinedProperties: true,
    });
    adminStorage = getStorage(adminApp);
}

// Initialize on module load
initializeAdminApp();

export function getAdminFirestore(): Firestore {
    if (!adminFirestore) {
        throw new Error("Admin Firestore is not initialized. Check your Firebase Admin setup.");
    }
    return adminFirestore;
}

export function getAdminStorage(): Storage {
     if (!adminStorage) {
        throw new Error("Admin Storage is not initialized. Check your Firebase Admin setup.");
    }
    return adminStorage;
}
