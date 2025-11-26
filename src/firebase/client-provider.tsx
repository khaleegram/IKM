'use client';

import React from 'react';
import { FirebaseProvider } from './provider';
import { FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

interface FirebaseClientProviderProps {
  children: React.ReactNode;
  config: FirebaseOptions;
}

export function FirebaseClientProvider({ children, config }: FirebaseClientProviderProps) {
  const app = getApps().length === 0 ? initializeApp(config) : getApp();
  const auth = getAuth(app);
  const firestore = getFirestore(app, {
    ignoreUndefinedProperties: true,
  });
  const storage = getStorage(app);

  return (
    <FirebaseProvider auth={auth} firestore={firestore} storage={storage}>
      {children}
    </FirebaseProvider>
  );
}
