
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      setUser(user);
      if (user) {
        const idTokenResult = await user.getIdTokenResult();
        setClaims(idTokenResult.claims);
      } else {
        setClaims(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, claims, isLoading };
};
