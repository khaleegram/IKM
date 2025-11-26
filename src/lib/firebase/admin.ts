
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminFirestore: Firestore;

try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
    if (!getApps().length) {
        adminApp = initializeApp({
            credential: cert(serviceAccount)
        });
    } else {
        adminApp = getApps()[0];
    }
} catch (e) {
    console.error('Firebase Admin initialization error:', e);
    // Add a check to ensure this doesn't run on the client-side during build
    if (typeof window === 'undefined') {
        console.error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable not set or invalid. Skipping admin initialization.");
    }
}

adminFirestore = getFirestore(adminApp);

export const getAdminApp = () => adminApp;
export const getAdminFirestore = () => adminFirestore;
