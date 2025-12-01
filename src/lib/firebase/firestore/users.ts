
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  doc,
  onSnapshot,
  DocumentData,
  FirestoreError,
  updateDoc,
  collection,
  addDoc,
  deleteDoc,
  query,
  Firestore,
  orderBy,
} from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';

export interface DeliveryLocation extends DocumentData {
    id: string;
    name: string;
}

export interface UserProfile extends DocumentData {
  id?: string;
  displayName: string;
  email: string;
  storeName?: string;
  storeDescription?: string;
  whatsappNumber?: string;
  deliveryLocations?: DeliveryLocation[];
  payoutDetails?: {
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };
  isAdmin?: boolean; // Added for UI reactivity
}

// Hook to get a single user profile
export const useUserProfile = (userId: string | undefined) => {
  const { firestore } = useFirebase();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const userRef = useMemo(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'users', userId);
  }, [firestore, userId]);
  
  const locationsRef = useMemo(() => {
    if (!firestore || !userId) return null;
    return collection(firestore, 'users', userId, 'deliveryLocations');
  }, [firestore, userId]);

  useEffect(() => {
    if (!userRef) {
      setIsLoading(false);
      setUserProfile(null);
      return;
    };

    setIsLoading(true);
    const unsubscribeUser = onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          setUserProfile(prev => ({ ...(prev || {}), id: doc.id, ...doc.data() } as UserProfile));
        } else {
          setUserProfile(null);
        }
        setError(null);
        // Don't set loading to false here, wait for locations
      },
      (err) => {
        console.error("Error fetching user profile:", err);
        setError(err);
        setIsLoading(false);
      }
    );
    
    let unsubscribeLocations = () => {};
    if (locationsRef) {
        unsubscribeLocations = onSnapshot(
            locationsRef,
            (snapshot) => {
                const locationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeliveryLocation));
                setUserProfile(prev => ({ ...(prev || {}), deliveryLocations: locationsData } as UserProfile));
                setIsLoading(false); // Set loading to false after locations are fetched
            },
            (err) => {
                console.error("Error fetching delivery locations: ", err);
                setIsLoading(false); // Also set loading to false on error
            }
        )
    } else {
      setIsLoading(false);
    }


    return () => {
        unsubscribeUser();
        unsubscribeLocations();
    }
  }, [userRef, locationsRef, userId]);

  return { data: userProfile, isLoading, error };
};

// Hook to get all user profiles (for storefront name/desc)
export const useAllUserProfiles = () => {
  const { firestore } = useFirebase();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const usersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('displayName'));
  }, [firestore]);


  useEffect(() => {
    if (!usersQuery) {
        setIsLoading(false);
        return;
    };
    setIsLoading(true);

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
        setUsers(usersData);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching users: ", err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [usersQuery]);

  return { data: users, isLoading, error };
};


// Function to update user profile
export const updateUserProfile = async (firestore: Firestore, userId: string, data: Partial<UserProfile>) => {
    if (!firestore) throw new Error("Firestore is not initialized");

    const userRef = doc(firestore, 'users', userId);
    return await updateDoc(userRef, data);
};

// Function to add a delivery location
export const addDeliveryLocation = async (firestore: Firestore, userId: string, location: { name: string }) => {
    if (!firestore) throw new Error("Firestore is not initialized");

    const locationsCollection = collection(firestore, 'users', userId, 'deliveryLocations');
    return await addDoc(locationsCollection, location);
}

// Function to delete a delivery location
export const deleteDeliveryLocation = async (firestore: Firestore, userId: string, locationId: string) => {
    if (!firestore) throw new Error("Firestore is not initialized");
    
    const locationRef = doc(firestore, 'users', userId, 'deliveryLocations', locationId);
    return await deleteDoc(locationRef);
}
