
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useFirebase } from '@/firebase/provider';
import type { IdTokenResult } from 'firebase/auth';

export const useUser = () => {
  const { auth } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<IdTokenResult['claims'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        setIsLoading(true);
        setUser(user);
        if (user) {
          try {
            // Force refresh to get latest custom claims (especially important for admin)
            // This ensures custom claims are up-to-date after role changes
            const tokenPromise = user.getIdTokenResult(true); // Force refresh
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Token refresh timeout')), 10000);
            });
            
            const idTokenResult = await Promise.race([tokenPromise, timeoutPromise]) as any;
            setClaims(idTokenResult.claims);
          } catch (error: any) {
            // Handle network errors gracefully
            const isNetworkError = 
              error?.code === 'auth/network-request-failed' ||
              error?.message?.includes('network') ||
              error?.message?.includes('ENOTFOUND') ||
              error?.message?.includes('timeout');
            
            if (isNetworkError) {
              console.warn('⚠️ Network error refreshing token, using cached user:', error.message);
              // Try to get cached token if available
              try {
                const cachedToken = await user.getIdTokenResult(false);
                setClaims(cachedToken.claims);
              } catch {
                // If no cached token, still set user but no claims
                setClaims(null);
              }
            } else {
              console.error('❌ Error getting token result:', error);
              setClaims(null);
            }
          }
        } else {
          setClaims(null);
        }
        setIsLoading(false);
      },
      (error) => {
        // Handle auth state change errors
        console.error('❌ Auth state change error:', error);
        setUser(null);
        setClaims(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  return { user, claims, isLoading };
};
