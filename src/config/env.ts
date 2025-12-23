/**
 * Centralized environment variable validation and configuration
 * Uses Zod for runtime validation to ensure all required env vars are present
 * 
 * This module validates environment variables at build/startup time and provides
 * type-safe access to them throughout the application.
 */

import { z } from 'zod';

/**
 * Schema for client-side (public) Firebase configuration
 * These variables are exposed to the browser and must be prefixed with NEXT_PUBLIC_
 */
const firebaseClientEnvSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, 'Firebase API key is required'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'Firebase auth domain is required'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase project ID is required'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'Firebase storage bucket is required'),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'Firebase messaging sender ID is required'),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, 'Firebase app ID is required'),
});

/**
 * Schema for server-side Firebase Admin SDK configuration
 * Supports both JSON string format and individual field format
 */
const firebaseAdminEnvSchema = z.object({
  // Either provide the full JSON string, or individual fields
  FIREBASE_SERVICE_ACCOUNT_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY_ID: z.string().optional(),
  FIREBASE_CLIENT_ID: z.string().optional(),
  FIREBASE_AUTH_URI: z.string().optional(),
  FIREBASE_TOKEN_URI: z.string().optional(),
  FIREBASE_AUTH_PROVIDER_CERT_URL: z.string().optional(),
  FIREBASE_CLIENT_CERT_URL: z.string().optional(),
  FIREBASE_ADMIN_PRIVATE_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'Firebase storage bucket is required'),
}).refine(
  (data) => {
    // Either FIREBASE_SERVICE_ACCOUNT_KEY must be provided (and not empty), or all individual fields must be provided (and not empty)
    if (data.FIREBASE_SERVICE_ACCOUNT_KEY && data.FIREBASE_SERVICE_ACCOUNT_KEY.trim().length > 0) {
      return true;
    }
    // Check that all individual fields are provided and not empty
    return !!(
      data.FIREBASE_CLIENT_EMAIL?.trim() &&
      data.FIREBASE_PRIVATE_KEY_ID?.trim() &&
      data.FIREBASE_CLIENT_ID?.trim() &&
      data.FIREBASE_AUTH_URI?.trim() &&
      data.FIREBASE_TOKEN_URI?.trim() &&
      data.FIREBASE_AUTH_PROVIDER_CERT_URL?.trim() &&
      data.FIREBASE_CLIENT_CERT_URL?.trim() &&
      data.FIREBASE_ADMIN_PRIVATE_KEY?.trim()
    );
  },
  {
    message: 'Either FIREBASE_SERVICE_ACCOUNT_KEY (JSON string) or all individual FIREBASE_* fields must be provided and non-empty',
  }
);

/**
 * Validates and parses client-side Firebase environment variables
 * Throws a descriptive error if any required variables are missing
 */
function validateClientEnv() {
  try {
    return firebaseClientEnvSchema.parse({
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => e.path.join('.')).join(', ');
      throw new Error(
        `Missing or invalid Firebase client environment variables: ${missingVars}. ` +
        `Please check your .env.local file and ensure all NEXT_PUBLIC_FIREBASE_* variables are set.`
      );
    }
    throw error;
  }
}

/**
 * Validates and parses server-side Firebase Admin environment variables
 * Throws a descriptive error if any required variables are missing
 */
function validateAdminEnv() {
  const envData = {
    FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID,
    FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID,
    FIREBASE_AUTH_URI: process.env.FIREBASE_AUTH_URI,
    FIREBASE_TOKEN_URI: process.env.FIREBASE_TOKEN_URI,
    FIREBASE_AUTH_PROVIDER_CERT_URL: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    FIREBASE_CLIENT_CERT_URL: process.env.FIREBASE_CLIENT_CERT_URL,
    FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  };

  try {
    return firebaseAdminEnvSchema.parse(envData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Check for field-level errors
      const fieldErrors = error.errors
        .filter(e => e.path.length > 0)
        .map(e => e.path.join('.'))
        .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

      // Check for refine errors (custom validation)
      const refineErrors = error.errors
        .filter(e => e.code === 'custom' || e.path.length === 0)
        .map(e => e.message);

      // Build detailed error message
      let errorMessage = 'Missing or invalid Firebase Admin environment variables.';
      
      if (fieldErrors.length > 0) {
        errorMessage += ` Missing fields: ${fieldErrors.join(', ')}.`;
      }

      if (refineErrors.length > 0) {
        errorMessage += ` ${refineErrors.join(' ')}`;
      } else if (!envData.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // Check which individual fields are missing
        const missingFields: string[] = [];
        if (!envData.FIREBASE_CLIENT_EMAIL) missingFields.push('FIREBASE_CLIENT_EMAIL');
        if (!envData.FIREBASE_PRIVATE_KEY_ID) missingFields.push('FIREBASE_PRIVATE_KEY_ID');
        if (!envData.FIREBASE_CLIENT_ID) missingFields.push('FIREBASE_CLIENT_ID');
        if (!envData.FIREBASE_AUTH_URI) missingFields.push('FIREBASE_AUTH_URI');
        if (!envData.FIREBASE_TOKEN_URI) missingFields.push('FIREBASE_TOKEN_URI');
        if (!envData.FIREBASE_AUTH_PROVIDER_CERT_URL) missingFields.push('FIREBASE_AUTH_PROVIDER_CERT_URL');
        if (!envData.FIREBASE_CLIENT_CERT_URL) missingFields.push('FIREBASE_CLIENT_CERT_URL');
        if (!envData.FIREBASE_ADMIN_PRIVATE_KEY) missingFields.push('FIREBASE_ADMIN_PRIVATE_KEY');
        
        if (missingFields.length > 0) {
          errorMessage += ` Missing individual fields: ${missingFields.join(', ')}.`;
        }
      }

      errorMessage += ' Please check your .env.local file and ensure either FIREBASE_SERVICE_ACCOUNT_KEY (JSON string) or all individual FIREBASE_* fields are set.';
      
      throw new Error(errorMessage);
    }
    throw error;
  }
}

/**
 * Validated client-side Firebase environment variables
 * This is safe to use in client components as these are public variables
 * 
 * @throws {Error} If required environment variables are missing or invalid
 */
export const firebaseClientEnv = validateClientEnv();

/**
 * Cached validated server-side Firebase Admin environment variables
 * This is lazy-loaded to avoid validation errors in client-side code
 */
let _firebaseAdminEnv: ReturnType<typeof validateAdminEnv> | null = null;

/**
 * Validated server-side Firebase Admin environment variables
 * This should only be used in server-side code (API routes, server actions, etc.)
 * 
 * Lazy validation: Only validates when first accessed (on server side)
 * This prevents errors when this module is imported in client-side code
 * 
 * @throws {Error} If required environment variables are missing or invalid
 */
export function getFirebaseAdminEnv() {
  if (!_firebaseAdminEnv) {
    // Only validate on server side (where process.env is available)
    if (typeof window === 'undefined') {
      _firebaseAdminEnv = validateAdminEnv();
    } else {
      throw new Error(
        'Firebase Admin environment variables are only available on the server side. ' +
        'Do not call getFirebaseAdminEnv() in client-side code.'
      );
    }
  }
  return _firebaseAdminEnv;
}

/**
 * @deprecated Use getFirebaseAdminEnv() instead for lazy loading
 * This is kept for backward compatibility but should not be used in new code
 * It will only work on the server side and will throw if accessed in client code
 */
export const firebaseAdminEnv = new Proxy({} as ReturnType<typeof validateAdminEnv>, {
  get(_target, prop) {
    // Only validate when actually accessed, and only on server
    if (typeof window !== 'undefined') {
      throw new Error(
        'firebaseAdminEnv is not available in client-side code. ' +
        'Use getFirebaseAdminEnv() in server-side code only.'
      );
    }
    // Lazy load on first access
    const env = getFirebaseAdminEnv();
    return (env as any)[prop];
  }
});

/**
 * Type-safe access to Firebase storage bucket
 * Can be used in both client and server contexts
 */
export const FIREBASE_STORAGE_BUCKET = firebaseClientEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

