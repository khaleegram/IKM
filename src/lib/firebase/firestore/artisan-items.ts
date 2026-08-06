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
import type { ArtisanItem } from './stores';

/**
 * Hook to get artisan items for a store
 * Uses subcollection: stores/{storeId}/items
 */
export function useArtisanItems(storeId: string | undefined) {
  const { firestore } = useFirebase();
  const [items, setItems] = useState<ArtisanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore || !storeId) {
      setIsLoading(false);
      return;
    }

    const itemsRef = collection(firestore, 'stores', storeId, 'items');
    const q = query(itemsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const itemsData: ArtisanItem[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          itemsData.push({
            id: doc.id,
            ...data,
          } as ArtisanItem);
        });
        setItems(itemsData);
        setIsLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error('Error fetching artisan items:', err);
        setError(err);
        setIsLoading(false);
        
        if (err.code === 'permission-denied') {
          errorEmitter.emit('error', new FirestorePermissionError('artisan-items'));
        }
      }
    );

    return () => unsubscribe();
  }, [firestore, storeId]);

  return useMemo(() => ({
    data: items,
    isLoading,
    error,
  }), [items, isLoading, error]);
}

