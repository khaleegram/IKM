import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import 'dotenv/config';

let adminApp: App;

function initializeAdminApp(): App {
    // If the app is already initialized, return it
    if (getApps().length > 0) {
        return getApps()[0];
    }
    
    // Check for all required environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // Private keys in .env files often have newline characters escaped as `\n`.
    // We need to replace them back to actual newlines for the SDK to parse it correctly.
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
            'Missing Firebase Admin SDK credentials. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env file.'
        );
    }
    
    const credential = cert({
        projectId,
        clientEmail,
        privateKey,
    });

    // Initialize the app
    return initializeApp({
        credential,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
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
