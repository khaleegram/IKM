
'use client';

import React, { createContext, useContext } from 'react';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';

const FirebaseContext = createContext<{
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
} | null>(null);

export function FirebaseProvider({ 
    children, 
    auth, 
    firestore,
    storage 
}: { 
    children: React.ReactNode, 
    auth: Auth, 
    firestore: Firestore,
    storage: FirebaseStorage 
}) {
  
  return (
    <FirebaseContext.Provider value={{ auth, firestore, storage }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === null) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
