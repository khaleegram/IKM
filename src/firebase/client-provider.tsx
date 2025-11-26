'use client';

import React from 'react';
import { FirebaseProvider } from './provider';
import { app } from './config';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Initialize Firebase services on the client inside the component
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);

  return (
    <FirebaseProvider auth={auth} firestore={firestore} storage={storage}>
      {children}
    </FirebaseProvider>
  );
}
