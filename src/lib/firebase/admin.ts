
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);

function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApps()[0];
    }
    return initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
}

export function getAdminFirestore(): Firestore {
    return getFirestore(getAdminApp());
}

export function getAdminStorage(): Storage {
    return getStorage(getAdminApp());
}
