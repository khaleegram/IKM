'use client';

import React, { useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

/**
 * FirebaseClientProvider
 * 
 * Initializes and provides Firebase services (Auth, Firestore, Storage) to the application.
 * Uses memoization to ensure services are only initialized once per app instance.
 * 
 * This component should wrap your application at the root level (typically in layout.tsx).
 */
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  // Initialize Firebase app only once
  const app = useMemo(() => {
    if (getApps().length === 0) {
      return initializeApp(firebaseConfig);
    }
    return getApp();
  }, []);

  // Initialize Firebase services with memoization
  const services = useMemo(() => {
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const storage = getStorage(app);

    // Firestore is online by default - no need to explicitly enable network
    // Calling enableNetwork can cause internal state conflicts if called multiple times
    // or if operations are attempted while network state is changing

    return { auth, firestore, storage };
  }, [app]);

  return (
    <FirebaseProvider 
      auth={services.auth} 
      firestore={services.firestore} 
      storage={services.storage}
    >
      {children}
    </FirebaseProvider>
  );
}
