
'use client';

import { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, DocumentData, FirestoreError } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';

export interface BrandingSettings extends DocumentData {
  logoUrl?: string;
}

// Hook to get branding settings
export const useBrandingSettings = () => {
  const { firestore } = useFirebase();
  const [settings, setSettings] = useState<BrandingSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const settingsRef = useMemo(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'branding');
  }, [firestore]);
  

  useEffect(() => {
    if (!settingsRef) {
      setIsLoading(false);
      return;
    };

    setIsLoading(true);
    const unsubscribe = onSnapshot(
      settingsRef,
      (doc) => {
        if (doc.exists()) {
          setSettings(doc.data() as BrandingSettings);
        } else {
          setSettings(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching branding settings:", err);
        setError(err);
        setIsLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [settingsRef]);

  return { data: settings, isLoading, error };
};
