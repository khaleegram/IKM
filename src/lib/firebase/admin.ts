
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import 'dotenv/config';

let adminApp: App;
let adminFirestore: Firestore;
let adminStorage: Storage;

function initializeAdminApp() {
    // Check if the app is already initialized to avoid re-initializing
    if (!getApps().length) {
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

            adminFirestore = getFirestore(adminApp);
            adminFirestore.settings({
                ignoreUndefinedProperties: true,
            });
            adminStorage = getStorage(adminApp);

        } catch (e: any) {
            console.error('Firebase Admin initialization error:', e.message);
            throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set or is invalid JSON.');
        }
    } else {
        // If already initialized, just get the instances
        adminApp = getApps()[0];
        adminFirestore = getFirestore(adminApp);
        adminStorage = getStorage(adminApp);
    }
}

// Initialize on module load
initializeAdminApp();

export function getAdminFirestore(): Firestore {
    if (!adminFirestore) {
        // This is a fallback in case the initial load failed, though it shouldn't be hit
        // in a normal server startup.
        initializeAdminApp();
    }
    return adminFirestore;
}

export function getAdminStorage(): Storage {
     if (!adminStorage) {
       initializeAdminApp();
    }
    return adminStorage;
}
