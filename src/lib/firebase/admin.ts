
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';


let adminApp: App;
let adminFirestore: Firestore;
let adminStorage: Storage;

try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
    if (!getApps().length) {
        adminApp = initializeApp({
            credential: cert(serviceAccount),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
        });
    } else {
        adminApp = getApps()[0];
    }
} catch (e) {
    console.error('Firebase Admin initialization error:', e);
    if (typeof window === 'undefined') {
        console.error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set or invalid. Skipping admin initialization.");
    }
}

adminFirestore = getFirestore(adminApp);
adminStorage = getStorage(adminApp);


export const getAdminApp = () => adminApp;
export const getAdminFirestore = () => adminFirestore;
export const getAdminStorage = () => adminStorage;
