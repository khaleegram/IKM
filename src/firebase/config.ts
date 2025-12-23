/**
 * Centralized Firebase client configuration
 * This file exports the validated Firebase configuration for client-side use
 */

import { firebaseClientEnv } from '@/config/env';
import type { FirebaseOptions } from 'firebase/app';

/**
 * Firebase client configuration object
 * All values are validated at build time through env.ts
 */
export const firebaseConfig: FirebaseOptions = {
  apiKey: firebaseClientEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: firebaseClientEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseClientEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: firebaseClientEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseClientEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseClientEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
};

