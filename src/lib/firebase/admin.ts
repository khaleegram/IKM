
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import 'dotenv/config';

let adminApp: App;
let adminFirestore: Firestore;
let adminStorage: Storage;

// This function is self-invoking and runs only once when the module is first loaded on the server.
// This ensures that the admin app is always initialized before it can be used by any API route or server action.
(function initializeAdminApp() {
    if (getApps().length > 0) {
        adminApp = getApps()[0];
    } else {
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
            console.log("Firebase Admin SDK initialized successfully.");
        } catch (e: any) {
            console.error('Firebase Admin initialization error:', e.message);
            // Don't throw here, as it can crash server startup. Functions that use it will fail.
            return;
        }
    }
    
    adminFirestore = getFirestore(adminApp);
    adminFirestore.settings({
        ignoreUndefinedProperties: true,
    });
    adminStorage = getStorage(adminApp);
})();


export function getAdminFirestore(): Firestore {
    if (!adminFirestore) {
      console.error("Firestore Admin SDK is not available. Check for initialization errors on server startup.");
      throw new Error("Firestore Admin SDK not initialized.");
    }
    return adminFirestore;
}

export function getAdminStorage(): Storage {
     if (!adminStorage) {
      console.error("Storage Admin SDK is not available. Check for initialization errors on server startup.");
       throw new Error("Storage Admin SDK not initialized.");
    }
    return adminStorage;
}

export function getAdminApp(): App {
    if (!adminApp) {
        console.error("Firebase Admin App is not available. Check for initialization errors on server startup.");
        throw new Error("Firebase Admin App not initialized.");
    }
    return adminApp;
}
