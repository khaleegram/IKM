
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import 'dotenv/config';

let adminApp: App;
let adminFirestore: Firestore;
let adminStorage: Storage;

function initializeAdminApp() {
    // Check if the app is already initialized to avoid re-initializing
    if (getApps().find(app => app.name === '[DEFAULT]')) {
        adminApp = getApps()[0];
        adminFirestore = getFirestore(adminApp);
        adminStorage = getStorage(adminApp);
        return;
    }

    try {
        const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountString) {
            console.error('FIREBASE_SERVICE_ACCOUNT_KEY is not set. Admin SDK cannot be initialized.');
            return;
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
        console.log("Firebase Admin SDK initialized successfully.");

    } catch (e: any) {
        console.error('Firebase Admin initialization error:', e.message);
        // Don't throw here, as it can crash server startup. Instead, functions that use it will fail.
    }
}

// Initialize on module load
initializeAdminApp();

export function getAdminFirestore(): Firestore {
    if (!adminFirestore) {
      console.error("Firestore Admin SDK is not available. Was there an initialization error?");
      // This will cause downstream errors, but prevents a hard crash on import.
      throw new Error("Firestore Admin SDK not initialized.");
    }
    return adminFirestore;
}

export function getAdminStorage(): Storage {
     if (!adminStorage) {
      console.error("Storage Admin SDK is not available. Was there an initialization error?");
       throw new Error("Storage Admin SDK not initialized.");
    }
    return adminStorage;
}

export function getAdminApp(): App {
    if (!adminApp) {
        console.error("Firebase Admin App is not available. Was there an initialization error?");
        throw new Error("Firebase Admin App not initialized.");
    }
    return adminApp;
}
