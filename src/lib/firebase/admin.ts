
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

let adminApp: App;

function initializeAdminApp() {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
    }

    let serviceAccount;
    try {
        serviceAccount = JSON.parse(serviceAccountKey);
    } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Make sure it's a valid JSON string.", e);
        throw new Error('Firebase service account key is malformed.');
    }

    return initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
}

function getAdminApp(): App {
    if (!adminApp) {
        adminApp = initializeAdminApp();
    }
    return adminApp;
}

export function getAdminFirestore(): Firestore {
    return getFirestore(getAdminApp());
}

export function getAdminStorage(): Storage {
    return getStorage(getAdminApp());
}
