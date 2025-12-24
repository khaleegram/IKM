/**
 * Firebase Admin SDK initialization and access
 * 
 * This module provides lazy initialization of Firebase Admin SDK services.
 * Services are initialized on first access, ensuring proper error handling
 * and avoiding initialization issues during server startup.
 */

import { initializeApp, getApps, App, cert, AppOptions } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirebaseAdminEnv, firebaseClientEnv, FIREBASE_STORAGE_BUCKET } from '@/config/env';

// Lazy-loaded instances
let adminApp: App | null = null;
let adminFirestore: Firestore | null = null;
let adminStorage: Storage | null = null;
let adminAuth: Auth | null = null;
let initializationError: Error | null = null;
let firestoreSettingsApplied: boolean = false;

/**
 * Initializes the Firebase Admin App
 * This function is called lazily on first access to any admin service
 */
function initializeAdminApp(): App {
  // Return existing app if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  // Prevent multiple initialization attempts
  if (initializationError) {
    throw initializationError;
  }

  try {
    // Get validated admin env (lazy-loaded, only validates on server side)
    const firebaseAdminEnv = getFirebaseAdminEnv();
    
    // Construct service account from either JSON string or individual fields
    let serviceAccount: object;

    if (firebaseAdminEnv.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Use JSON string format if provided
      try {
        serviceAccount = JSON.parse(firebaseAdminEnv.FIREBASE_SERVICE_ACCOUNT_KEY);
        
        // Unescape newlines in private key (replace \n with actual newlines)
        // This is necessary because JSON strings store newlines as escaped sequences
        if (serviceAccount && typeof serviceAccount === 'object' && 'private_key' in serviceAccount) {
          (serviceAccount as any).private_key = (serviceAccount as any).private_key.replace(/\\n/g, '\n');
        }
      } catch (parseError) {
        const error = new Error(
          'Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Ensure it is valid JSON.'
        );
        initializationError = error;
        throw error;
      }
    } else {
      // Construct from individual fields
      if (
        !firebaseAdminEnv.FIREBASE_CLIENT_EMAIL ||
        !firebaseAdminEnv.FIREBASE_PRIVATE_KEY_ID ||
        !firebaseAdminEnv.FIREBASE_CLIENT_ID ||
        !firebaseAdminEnv.FIREBASE_AUTH_URI ||
        !firebaseAdminEnv.FIREBASE_TOKEN_URI ||
        !firebaseAdminEnv.FIREBASE_AUTH_PROVIDER_CERT_URL ||
        !firebaseAdminEnv.FIREBASE_CLIENT_CERT_URL ||
        !firebaseAdminEnv.FIREBASE_ADMIN_PRIVATE_KEY
      ) {
        const error = new Error(
          'Missing required Firebase Admin environment variables. ' +
          'Either provide FIREBASE_SERVICE_ACCOUNT_KEY (JSON string) or all individual FIREBASE_* fields.'
        );
        initializationError = error;
        throw error;
      }

      // Unescape newlines in private key (replace \n with actual newlines)
      const privateKey = firebaseAdminEnv.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n');

      serviceAccount = {
        type: 'service_account',
        project_id: firebaseClientEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        private_key_id: firebaseAdminEnv.FIREBASE_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: firebaseAdminEnv.FIREBASE_CLIENT_EMAIL,
        client_id: firebaseAdminEnv.FIREBASE_CLIENT_ID,
        auth_uri: firebaseAdminEnv.FIREBASE_AUTH_URI,
        token_uri: firebaseAdminEnv.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: firebaseAdminEnv.FIREBASE_AUTH_PROVIDER_CERT_URL,
        client_x509_cert_url: firebaseAdminEnv.FIREBASE_CLIENT_CERT_URL,
      };
    }

    // Initialize Firebase Admin App
    const appOptions: AppOptions = {
      credential: cert(serviceAccount as any),
      storageBucket: FIREBASE_STORAGE_BUCKET,
    };

    adminApp = initializeApp(appOptions);
    console.log('✅ Firebase Admin SDK initialized successfully');

    return adminApp;
  } catch (error) {
    const initError = error instanceof Error 
      ? error 
      : new Error('Unknown error during Firebase Admin initialization');
    
    initializationError = initError;
    console.error('❌ Firebase Admin SDK initialization failed:', initError.message);
    throw initError;
  }
}

/**
 * Gets the Firebase Admin App instance
 * Initializes the app if it hasn't been initialized yet
 * 
 * @throws {Error} If initialization fails
 */
export function getAdminApp(): App {
  if (!adminApp) {
    adminApp = initializeAdminApp();
  }
  return adminApp;
}

/**
 * Gets the Firestore Admin instance
 * Initializes the app and Firestore if they haven't been initialized yet
 * 
 * @throws {Error} If initialization fails
 */
export function getAdminFirestore(): Firestore {
  if (!adminFirestore) {
    const app = getAdminApp();
    adminFirestore = getFirestore(app);
  }
  
  // Apply settings only once, and only if not already applied
  if (!firestoreSettingsApplied) {
    try {
      adminFirestore.settings({
        ignoreUndefinedProperties: true,
      });
      firestoreSettingsApplied = true;
    } catch (error) {
      // If settings have already been applied (error about already initialized),
      // just mark it as applied and continue
      if (error instanceof Error && error.message.includes('already been initialized')) {
        firestoreSettingsApplied = true;
      } else {
        throw error;
      }
    }
  }
  
  return adminFirestore;
}

/**
 * Gets the Storage Admin instance
 * Initializes the app and Storage if they haven't been initialized yet
 * 
 * @throws {Error} If initialization fails
 */
export function getAdminStorage(): Storage {
  if (!adminStorage) {
    const app = getAdminApp();
    adminStorage = getStorage(app);
  }
  return adminStorage;
}

/**
 * Gets the Auth Admin instance
 * Initializes the app and Auth if they haven't been initialized yet
 * 
 * @throws {Error} If initialization fails
 */
export function getAdminAuth(): Auth {
  if (!adminAuth) {
    const app = getAdminApp();
    adminAuth = getAuth(app);
  }
  return adminAuth;
}

/**
 * Resets all admin instances (useful for testing)
 * @internal
 */
export function resetAdminInstances(): void {
  adminApp = null;
  adminFirestore = null;
  adminStorage = null;
  adminAuth = null;
  initializationError = null;
  firestoreSettingsApplied = false;
}
