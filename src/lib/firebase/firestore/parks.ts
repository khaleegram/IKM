'use client';

import { useFirebase } from '@/firebase/provider';
import {
  DocumentData,
  Firestore,
  FirestoreError,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

export interface Park extends DocumentData {
  id?: string;
  name: string;
  city: string;
  state: string;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

// Hook to get all parks
export const useAllParks = () => {
  const { firestore } = useFirebase();
  const [parks, setParks] = useState<Park[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const parksQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'parks'),
      orderBy('state', 'asc'),
      orderBy('city', 'asc'),
      orderBy('name', 'asc')
    );
  }, [firestore]);

  useEffect(() => {
    if (!parksQuery) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = onSnapshot(
      parksQuery,
      (snapshot) => {
        const parksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Park));
        setParks(parksData);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setParks([]);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [parksQuery]);

  return { data: parks, isLoading, error };
};

// Hook to get parks by state
export const useParksByState = (state: string) => {
  const { firestore } = useFirebase();
  const [parks, setParks] = useState<Park[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const parksQuery = useMemo(() => {
    if (!firestore || !state) return null;
    return query(
      collection(firestore, 'parks'),
      where('state', '==', state),
      where('isActive', '==', true),
      orderBy('city', 'asc'),
      orderBy('name', 'asc')
    );
  }, [firestore, state]);

  useEffect(() => {
    if (!parksQuery) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = onSnapshot(
      parksQuery,
      (snapshot) => {
        const parksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Park));
        setParks(parksData);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setParks([]);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [parksQuery]);

  return { data: parks, isLoading, error };
};

