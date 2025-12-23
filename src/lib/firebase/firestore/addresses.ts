'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, DocumentData, FirestoreError, orderBy } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';

export interface Address extends DocumentData {
  id?: string;
  userId: string;
  label: string; // e.g., "Home", "Work", "Office"
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  lga: string;
  isDefault?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Hook to get user's addresses
 */
export function useUserAddresses(userId: string | undefined) {
  const { firestore } = useFirebase();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!firestore || !userId) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(firestore, 'addresses'),
      where('userId', '==', userId),
      orderBy('isDefault', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const addressesData: Address[] = [];
        snapshot.forEach((doc) => {
          addressesData.push({
            id: doc.id,
            ...doc.data(),
          } as Address);
        });
        
        setAddresses(addressesData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching addresses:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, userId]);

  return { data: addresses, isLoading, error };
}

