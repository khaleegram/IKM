
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import 'dotenv/config';

let adminApp: App;

function initializeAdminApp(): App {
    if (getApps().length > 0) {
        return getApps()[0];
    }
    
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
        return initializeApp({
            credential: cert(serviceAccount),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });

    } catch(e) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', e);
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set or is invalid JSON.');
    }
}

function getAdminApp(): App {
    if (!adminApp) {
        adminApp = initializeAdminApp();
    }
    return adminApp;
}

export function getAdminFirestore(): Firestore {
    const firestore = getFirestore(getAdminApp());
    firestore.settings({
        ignoreUndefinedProperties: true,
    });
    return firestore;
}

export function getAdminStorage(): Storage {
    return getStorage(getAdminApp());
}
