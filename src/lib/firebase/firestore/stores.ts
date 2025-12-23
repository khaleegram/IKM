'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  doc,
  onSnapshot,
  getDoc,
  getDocs,
  DocumentData,
  FirestoreError,
  collection,
  query,
  where,
  Firestore,
} from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Store Profile Interface
 * Uses userId as document ID for direct access (no queries needed)
 */
export interface StoreProfile extends DocumentData {
  id?: string;
  userId: string;
  storeName: string;
  storeDescription?: string;
  storeLogoUrl?: string;
  storeBannerUrl?: string;
  storeLocation?: {
    state: string;
    lga: string;
    city: string;
    address?: string;
  };
  businessType?: string;
  storePolicies?: {
    shipping?: string;
    returns?: string;
    refunds?: string;
    privacy?: string;
  };
  // Social media links
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
  // Store hours
  storeHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  // Contact info
  email?: string;
  phone?: string;
  website?: string;
  // Store theme
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  // SEO settings
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  // Domain settings
  subdomain?: string; // managed subdomain (e.g., myshop.yourplatform.com)
  customDomain?: string; // user-provided custom domain
  domainStatus?: 'none' | 'pending' | 'verified' | 'failed';
  dnsRecords?: {
    type: 'A' | 'CNAME' | 'TXT';
    name: string;
    value: string;
    status?: 'pending' | 'verified' | 'failed';
    lastCheckedAt?: any;
  }[];
  onboardingCompleted?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Hook to get a store by userId (seller's store)
 * Uses direct document access with userId as document ID - no queries needed!
 */
export const useStoreByUserId = (userId: string | undefined) => {
  const { firestore, auth } = useFirebase();
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const storeRef = useMemo(() => {
    if (!firestore || !userId) {
      console.log('🔍 Store: Missing firestore or userId', { hasFirestore: !!firestore, userId });
      return null;
    }
    // Use userId as document ID for direct access
    const ref = doc(firestore, 'stores', userId);
    console.log('🔍 Store: Created document reference:', ref.path);
    return ref;
  }, [firestore, userId]);

  useEffect(() => {
    if (!storeRef) {
      console.log('🔍 Store: No ref available for userId:', userId);
      setIsLoading(false);
      setStore(null);
      return;
    }

    // Wait for auth to be ready before reading
    const waitForAuth = async () => {
      // Wait for auth state to be initialized
      let attempts = 0;
      while (!auth.currentUser && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!auth.currentUser && userId) {
        console.warn('⚠️ Store: No authenticated user, but userId provided:', userId);
        console.warn('⚠️ This might cause permission issues. Continuing anyway...');
      }
    };

    // Firestore is online by default - no need to proactively enable network
    // Only enable network in error handlers when we actually get offline errors

    setIsLoading(true);
    console.log('🔍 Store: Setting up direct document listener for userId:', userId);
    console.log('🔍 Store: Document path:', `stores/${userId}`);
    console.log('🔍 Store: Auth state:', {
      currentUser: auth.currentUser?.uid,
      isAuthenticated: !!auth.currentUser,
    });

    // First, try a direct read to test if we can access the document
    // Also test querying by userId as a fallback
    const testRead = async () => {
      try {
        // Wait for auth to be ready
        await waitForAuth();
        
        console.log('🧪 Testing direct read access to:', storeRef.path);
        console.log('🧪 Auth state:', {
          currentUser: auth.currentUser?.uid,
          isAuthenticated: !!auth.currentUser,
          email: auth.currentUser?.email,
        });
        
        // Try direct read first
        try {
          const testDoc = await getDoc(storeRef);
          console.log('🧪 Direct read test result:', {
            exists: testDoc.exists(),
            id: testDoc.id,
            hasData: !!testDoc.data(),
            dataKeys: testDoc.exists() ? Object.keys(testDoc.data() || {}) : [],
            currentUser: auth.currentUser?.uid,
          });
          
          // If direct read works but listener doesn't, there's a sync issue
          if (testDoc.exists()) {
            const data = testDoc.data();
            const storeProfile = { id: testDoc.id, ...data } as StoreProfile;
            console.log('✅ Direct read found store, setting it immediately:', {
              storeName: storeProfile.storeName,
              onboardingCompleted: storeProfile.onboardingCompleted,
            });
            setStore(storeProfile);
            setIsLoading(false);
            return; // Success, exit early
          } else {
            console.log('⚠️ Direct read: Document does not exist at path:', storeRef.path);
          }
        } catch (directReadErr: any) {
          console.error('❌ Direct read failed:', {
            code: directReadErr?.code,
            message: directReadErr?.message,
            name: directReadErr?.name,
          });
          
          // If offline error, log it but don't try to enable network
          // Firestore will automatically reconnect when network is available
          if (directReadErr?.code === 'unavailable' || directReadErr?.message?.includes('offline')) {
            console.log('⚠️ Client appears offline. Firestore will automatically reconnect when network is available.');
            // Don't retry - let the listener handle reconnection
          }
        }
        
        // Fallback: Try querying by userId
        console.log('🧪 Trying query fallback: stores where userId ==', userId);
        const storesCollection = collection(firestore, 'stores');
        const queryByUserId = query(storesCollection, where('userId', '==', userId));
        
        try {
          const querySnapshot = await getDocs(queryByUserId);
          
          console.log('🧪 Query result:', {
            size: querySnapshot.size,
            empty: querySnapshot.empty,
            docs: querySnapshot.docs.map(d => ({
              id: d.id,
              userId: d.data().userId,
              storeName: d.data().storeName,
            })),
          });
          
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const data = doc.data();
            const storeProfile = { id: doc.id, ...data } as StoreProfile;
            console.log('✅ Query found store, setting it:', {
              id: storeProfile.id,
              userId: storeProfile.userId,
              storeName: storeProfile.storeName,
              note: 'Store found via query, but document ID does not match userId. This suggests the store was created with a random ID instead of userId as document ID.',
            });
            setStore(storeProfile);
            setIsLoading(false);
            return;
          }
        } catch (queryErr: any) {
          console.error('❌ Query failed:', {
            code: queryErr?.code,
            message: queryErr?.message,
          });
          
          // If query also fails with offline error, log it
          // Firestore will automatically reconnect when network is available
          if (queryErr?.code === 'unavailable' || queryErr?.message?.includes('offline')) {
            console.log('⚠️ Query appears offline. Firestore will automatically reconnect when network is available.');
            // Don't retry - let the listener handle reconnection
          }
        }
      } catch (testErr: any) {
        // Log the full error object
        console.error('🧪 Test read failed - Full error object:', testErr);
        console.error('🧪 Error type:', typeof testErr);
        console.error('🧪 Error constructor:', testErr?.constructor?.name);
        console.error('🧪 Error keys:', Object.keys(testErr || {}));
        
        // Try to extract Firebase-specific error info
        const firebaseError = testErr as any;
        console.error('🧪 Test read failed details:', {
          code: firebaseError?.code,
          message: firebaseError?.message,
          name: firebaseError?.name,
          stack: firebaseError?.stack,
          currentUser: auth.currentUser?.uid,
          isAuthenticated: !!auth.currentUser,
          errorString: String(testErr),
          // Try to stringify, but catch if it fails
          errorJSON: (() => {
            try {
              return JSON.stringify(testErr, Object.getOwnPropertyNames(testErr), 2);
            } catch {
              return 'Could not stringify error';
            }
          })(),
        });
      }
    };
    testRead();

    // Set up listener
    const setupListener = async () => {
      try {
        console.log('🔍 Setting up real-time listener...');
        const unsubscribe = onSnapshot(
          storeRef,
          (docSnapshot) => {
            console.log('📥 Store snapshot received:', {
              exists: docSnapshot.exists(),
              id: docSnapshot.id,
              hasData: !!docSnapshot.data(),
              metadata: {
                fromCache: docSnapshot.metadata.fromCache,
                hasPendingWrites: docSnapshot.metadata.hasPendingWrites,
              },
            });

            // If reading from cache and document doesn't exist, wait for server data
            if (!docSnapshot.exists() && docSnapshot.metadata.fromCache) {
              console.log('⏳ Reading from cache (document not found), waiting for server data...');
              return; // Don't set store to null yet, wait for server response
            }

            if (docSnapshot.exists()) {
              const data = docSnapshot.data();
              const storeProfile = { id: docSnapshot.id, ...data } as StoreProfile;
              
              console.log('✅ Store loaded successfully:', {
                id: storeProfile.id,
                userId: storeProfile.userId,
                storeName: storeProfile.storeName,
                onboardingCompleted: storeProfile.onboardingCompleted,
                hasDescription: !!storeProfile.storeDescription,
                hasLocation: !!storeProfile.storeLocation,
                hasBusinessType: !!storeProfile.businessType,
                fromCache: docSnapshot.metadata.fromCache,
              });
              
              setStore(storeProfile);
              setError(null);
              setIsLoading(false);
            } else {
              // Only set to null if this is from server (not cache)
              if (!docSnapshot.metadata.fromCache) {
                console.log('⚠️ Store document does not exist for userId:', userId);
                console.log('💡 Document path checked:', `stores/${userId}`);
                console.log('💡 Server confirmed document does not exist');
                setStore(null);
                setError(null);
                setIsLoading(false);
              }
            }
          },
          async (err) => {
            console.error('❌ Error fetching store:', err);
            console.error('Error code:', err.code);
            console.error('Error message:', err.message);
            console.error('Document path:', `stores/${userId}`);
            
            // Handle offline errors
            // Firestore will automatically reconnect when network is available
            if (err.code === 'unavailable' || err.message?.includes('offline')) {
              console.log('⚠️ Listener appears offline. Firestore will automatically reconnect when network is available.');
              // Don't set error or clear store - let the listener retry automatically
              return;
            }
            
            if (err.code === 'permission-denied') {
              console.error('🔒 Permission denied - check Firestore security rules');
              console.error('💡 Make sure security rules allow read access to stores/{storeId}');
              console.error('💡 Current user might not be authenticated');
            }
            
            setError(err);
            setStore(null);
            setIsLoading(false);
          }
        );
        
        return unsubscribe;
      } catch (listenerErr) {
        console.error('❌ Failed to setup listener:', listenerErr);
        setError(listenerErr as FirestoreError);
        setIsLoading(false);
        return () => {}; // Return empty cleanup function
      }
    };
    
    let unsubscribeFn: (() => void) | null = null;
    
    setupListener().then((unsubscribe) => {
      unsubscribeFn = unsubscribe;
    }).catch((err) => {
      console.error('❌ Listener setup failed:', err);
    });
    
    return () => {
      console.log('🔍 Store: Cleaning up (component unmounting)');
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, [storeRef, userId, firestore, auth]);

  return { data: store, isLoading, error };
};

/**
 * Hook to get all stores (for browsing)
 */
export const useAllStores = () => {
  const { firestore } = useFirebase();
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const storesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'stores'));
  }, [firestore]);

  useEffect(() => {
    if (!storesQuery) {
      console.log('🔍 Stores Query: No query available');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    console.log('🔍 Stores Query: Setting up listener...');

    const unsubscribe = onSnapshot(
      storesQuery,
      (snapshot) => {
        console.log('🏪 Stores Snapshot:', {
          size: snapshot.size,
          empty: snapshot.empty,
          docs: snapshot.docs.length,
        });

        const storesData = snapshot.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, ...data } as StoreProfile;
        });

        // Filter stores that have completed onboarding
        const activeStores = storesData.filter(s => 
          s.storeName && 
          s.storeName.trim().length > 0 && 
          s.onboardingCompleted === true
        );

        console.log('🏪 All Stores Fetched:', {
          totalStores: storesData.length,
          activeStores: activeStores.length,
        });

        setStores(activeStores);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        console.error('❌ Error fetching all stores: ', err);
        setError(err);
        setStores([]);
        setIsLoading(false);
        const permissionError = new FirestorePermissionError({ path: 'stores', operation: 'list' });
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    return () => {
      console.log('🔍 Stores Query: Cleaning up listener');
      unsubscribe();
    };
  }, [storesQuery]);

  return { data: stores, isLoading, error };
};
