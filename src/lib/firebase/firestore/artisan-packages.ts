'use client';

import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useFirebase } from '@/firebase/provider';
import {
  DocumentData,
  FirestoreError,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import type { ArtisanPackage } from './stores';

/**
 * Hook to get artisan packages for a store
 * Uses subcollection: stores/{storeId}/packages
 */
export function useArtisanPackages(storeId: string | undefined) {
  const { firestore } = useFirebase();
  const [packages, setPackages] = useState<ArtisanPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore || !storeId) {
      setIsLoading(false);
      return;
    }

    const packagesRef = collection(firestore, 'stores', storeId, 'packages');
    const q = query(packagesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const packagesData: ArtisanPackage[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          packagesData.push({
            id: doc.id,
            ...data,
          } as ArtisanPackage);
        });
        setPackages(packagesData);
        setIsLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error('Error fetching artisan packages:', err);
        setError(err);
        setIsLoading(false);
        
        if (err.code === 'permission-denied') {
          errorEmitter.emit('error', new FirestorePermissionError('artisan-packages'));
        }
      }
    );

    return () => unsubscribe();
  }, [firestore, storeId]);

  return useMemo(() => ({
    data: packages,
    isLoading,
    error,
  }), [packages, isLoading, error]);
}

