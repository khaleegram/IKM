
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
  getDocs,
} from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface DeliveryLocation extends DocumentData {
    id: string;
    name: string;
}

export interface UserProfile extends DocumentData {
  id?: string;
  displayName: string;
  email: string;
  role?: 'buyer' | 'seller' | 'admin'; // User role: buyer, seller, or admin
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
  isAdmin?: boolean; // Added for UI reactivity (deprecated, use role instead)
  
  // Store setup fields (from onboarding)
  storeLogoUrl?: string;
  storeBannerUrl?: string;
  storeLocation?: {
    state: string;
    lga: string;
    city: string;
    address?: string;
  };
  businessType?: string; // Business category
  storePolicies?: {
    shipping?: string;
    returns?: string;
    refunds?: string;
    privacy?: string;
  };
  onboardingCompleted?: boolean;
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
    }

    setIsLoading(true);
    
    let isMounted = true;
    
    const unsubscribeUser = onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const profile = { id: doc.id, ...data } as UserProfile;
          console.log('📥 User profile updated:', {
            id: profile.id,
            storeName: profile.storeName,
            storeDescription: profile.storeDescription,
            storeDescriptionLength: profile.storeDescription?.length || 0,
            hasDescription: !!profile.storeDescription,
            storeLocation: profile.storeLocation,
            hasLocation: !!profile.storeLocation,
            locationState: profile.storeLocation?.state,
            locationLGA: profile.storeLocation?.lga,
            locationCity: profile.storeLocation?.city,
            businessType: profile.businessType,
            hasBusinessType: !!profile.businessType,
            storeLogoUrl: profile.storeLogoUrl,
            storeBannerUrl: profile.storeBannerUrl,
            storePolicies: profile.storePolicies,
            onboardingCompleted: profile.onboardingCompleted,
          });
          setUserProfile(prev => {
            // Always update with fresh data from Firestore
            const newProfile = { ...profile } as UserProfile;
            // Preserve deliveryLocations if they exist in prev
            if (prev?.deliveryLocations) {
              newProfile.deliveryLocations = prev.deliveryLocations;
            }
            return newProfile;
          });
        } else {
          setUserProfile(null);
        }
        setError(null);
        // Don't set loading to false here, wait for locations
      },
      (err) => {
        // Ignore "already-exists" errors during hot reload
        if (err.code === 'already-exists') {
          return;
        }
        if (isMounted) {
          setError(err);
          setIsLoading(false);
        }
      }
    );
    
    let unsubscribeLocations = () => {};
    if (locationsRef) {
        unsubscribeLocations = onSnapshot(
            locationsRef,
            (snapshot) => {
                const locationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeliveryLocation));
                setUserProfile(prev => {
                  // Preserve all existing profile data and only update deliveryLocations
                  if (!prev) {
                    setIsLoading(false);
                    return null;
                  }
                  // Create a new object to ensure React detects the change
                  return { ...prev, deliveryLocations: locationsData } as UserProfile;
                });
                setIsLoading(false); // Set loading to false after locations are fetched
            },
            (err) => {
                // Ignore "already-exists" errors during hot reload
                if (err.code === 'already-exists') {
                  console.warn('⚠️ Delivery locations listener already exists (likely hot reload), ignoring...');
                  return;
                }
                console.error("Error fetching delivery locations: ", err);
                if (isMounted) {
                  setIsLoading(false); // Also set loading to false on error
                }
            }
        )
    } else {
      setIsLoading(false);
    }


    return () => {
        console.log('🔍 User Profile Query: Cleaning up listeners');
        isMounted = false;
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
    return query(collection(firestore, 'users'));
  }, [firestore]);


  useEffect(() => {
    if (!usersQuery) {
        console.log('🔍 Users Query: No query available, firestore might not be initialized');
        setIsLoading(false);
        return;
    };
    setIsLoading(true);
    console.log('🔍 Users Query: Setting up listener...');

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        console.log('👥 Users Snapshot:', {
          size: snapshot.size,
          empty: snapshot.empty,
          docs: snapshot.docs.length,
        });
        
        const usersData = snapshot.docs.map(doc => {
          const data = doc.data();
          // Handle Timestamp serialization
          let createdAt = data.createdAt;
          if (createdAt && typeof createdAt.toMillis === 'function') {
            // It's a Firestore Timestamp - keep it
            createdAt = createdAt;
          } else if (createdAt && typeof createdAt === 'object' && createdAt._seconds) {
            // It's a serialized Timestamp - convert back
            const seconds = createdAt._seconds;
            const nanoseconds = createdAt._nanoseconds || 0;
            createdAt = { 
              toMillis: () => seconds * 1000 + Math.floor(nanoseconds / 1000000) 
            };
          }
          
          return { 
            id: doc.id, 
            ...data,
            createdAt 
          } as unknown as UserProfile;
        });
        
        usersData.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
        
        // Debug: Log stores data
        const storesWithName = usersData.filter(u => u.storeName && u.storeName.trim().length > 0);
        console.log('🏪 All User Profiles Fetched:', {
          totalUsers: usersData.length,
          storesWithName: storesWithName.length,
          storeNames: storesWithName.map(s => ({
            id: s.id,
            storeName: s.storeName,
            hasDescription: !!s.storeDescription,
            hasLocation: !!s.storeLocation,
            location: s.storeLocation,
            businessType: s.businessType,
          })),
          allUsers: usersData.map(u => ({
            id: u.id,
            email: u.email,
            storeName: u.storeName,
          })),
        });
        
        setUsers(usersData);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        console.error("❌ Error fetching all user profiles: ", err);
        console.error("Error code:", err.code);
        console.error("Error message:", err.message);
        setError(err);
        setUsers([]); // Return empty array on error
        setIsLoading(false);
        // Emit a detailed error for the UI
        const permissionError = new FirestorePermissionError({ path: 'users', operation: 'list' });
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    return () => {
      console.log('🔍 Users Query: Cleaning up listener');
      unsubscribe();
    };
  }, [usersQuery]);

  return { data: users, isLoading, error };
};


/**
 * @deprecated Use server actions instead: updateUserProfileAction from @/lib/user-actions
 * Client-side writes are deprecated in favor of server actions for better security and validation.
 * This function is kept for backward compatibility but should not be used in new code.
 */
export const updateUserProfile = async (firestore: Firestore, userId: string, data: Partial<UserProfile>) => {
    console.warn('⚠️ updateUserProfile is deprecated. Use updateUserProfileAction server action instead.');
    if (!firestore) throw new Error("Firestore is not initialized");

    const userRef = doc(firestore, 'users', userId);
    return await updateDoc(userRef, data);
};

/**
 * @deprecated Use server actions instead: addDeliveryLocationAction from @/lib/user-actions
 * Client-side writes are deprecated in favor of server actions for better security and validation.
 */
export const addDeliveryLocation = async (firestore: Firestore, userId: string, location: { name: string }) => {
    console.warn('⚠️ addDeliveryLocation is deprecated. Use addDeliveryLocationAction server action instead.');
    if (!firestore) throw new Error("Firestore is not initialized");

    const locationsCollection = collection(firestore, 'users', userId, 'deliveryLocations');
    return await addDoc(locationsCollection, location);
}

/**
 * @deprecated Use server actions instead: deleteDeliveryLocationAction from @/lib/user-actions
 * Client-side writes are deprecated in favor of server actions for better security and validation.
 */
export const deleteDeliveryLocation = async (firestore: Firestore, userId: string, locationId: string) => {
    console.warn('⚠️ deleteDeliveryLocation is deprecated. Use deleteDeliveryLocationAction server action instead.');
    if (!firestore) throw new Error("Firestore is not initialized");
    
    const locationRef = doc(firestore, 'users', userId, 'deliveryLocations', locationId);
    return await deleteDoc(locationRef);
}
