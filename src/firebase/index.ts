'use client';

/**
 * Firebase Client SDK - Public API
 * 
 * This file is the single entrypoint for all client-side Firebase functionality.
 * It exports the necessary providers, hooks, and configuration for other components to use.
 */

export { FirebaseClientProvider } from './client-provider';
export { useFirebase, FirebaseProvider } from './provider';
export { firebaseConfig } from './config';
export * from './errors';
export { errorEmitter } from './error-emitter';