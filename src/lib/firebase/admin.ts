
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);

let adminApp: App;
let adminFirestore: Firestore;
let adminStorage: Storage;

if (!getApps().length) {
    adminApp = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
} else {
    adminApp = getApps()[0];
}

adminFirestore = getFirestore(adminApp);
adminStorage = getStorage(adminApp);

export const getAdminApp = () => adminApp;
export const getAdminFirestore = () => adminFirestore;
export const getAdminStorage = () => adminStorage;
