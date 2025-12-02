
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import 'dotenv/config';

let adminApp: App;

function initializeAdminSdk() {
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

        } catch (e: any) {
            console.error('Firebase Admin SDK initialization error:', e.message);
            // This is a critical error, so we throw it to prevent the app from running without proper auth.
            throw new Error('Firebase Admin SDK failed to initialize. Check server logs.');
        }
    } else {
        adminApp = getApps()[0];
    }
}

// Initialize on module load
initializeAdminSdk();

export function getAdminApp(): App {
    if (!adminApp) {
        // This is a fallback. In a normal server startup, it should already be initialized.
        initializeAdminSdk();
    }
    return adminApp;
}
