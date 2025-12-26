'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, DocumentData, FirestoreError } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';

export interface SellerEarnings extends DocumentData {
  totalEarnings: number;
  availableBalance: number;
  pendingPayouts: number;
  totalPayouts: number;
  commissionPaid: number;
  totalOrders: number;
}

export interface Payout extends DocumentData {
  id?: string;
  sellerId: string;
  amount: number;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  requestedAt?: any;
  processedAt?: any;
  processedBy?: string;
  transferReference?: string;
  failureReason?: string;
  createdAt?: any;
}

export interface Transaction extends DocumentData {
  id?: string;
  sellerId: string;
  type: 'sale' | 'payout' | 'commission' | 'refund';
  amount: number;
  orderId?: string;
  payoutId?: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt?: any;
}

/**
 * Hook to get seller payouts
 */
export function useSellerPayouts(sellerId: string | undefined) {
  const { firestore } = useFirebase();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!firestore || !sellerId) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(firestore, 'payouts'),
      where('sellerId', '==', sellerId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const payoutsData: Payout[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          
          // Serialize Firestore Timestamps to plain objects
          const serializeTimestamp = (ts: any): any => {
            if (!ts) return null;
            if (typeof ts.toMillis === 'function') {
              // It's a Firestore Timestamp - convert to plain object
              return {
                _seconds: Math.floor(ts.toMillis() / 1000),
                _nanoseconds: (ts.toMillis() % 1000) * 1000000,
              };
            }
            return ts;
          };
          
          payoutsData.push({
            id: doc.id,
            ...data,
            requestedAt: serializeTimestamp(data.requestedAt),
            processedAt: serializeTimestamp(data.processedAt),
            createdAt: serializeTimestamp(data.createdAt),
            expectedProcessingDate: serializeTimestamp(data.expectedProcessingDate),
          } as Payout);
        });
        
        // Sort by date (most recent first)
        payoutsData.sort((a, b) => {
          const aTime = a.createdAt?._seconds ? a.createdAt._seconds * 1000 : 0;
          const bTime = b.createdAt?._seconds ? b.createdAt._seconds * 1000 : 0;
          return bTime - aTime;
        });
        
        setPayouts(payoutsData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching payouts:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, sellerId]);

  return { data: payouts, isLoading, error };
}

/**
 * Hook to get seller transactions
 */
export function useSellerTransactions(sellerId: string | undefined, limit: number = 50) {
  const { firestore } = useFirebase();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!firestore || !sellerId) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(firestore, 'transactions'),
      where('sellerId', '==', sellerId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const transactionsData: Transaction[] = [];
        snapshot.forEach((doc) => {
          transactionsData.push({
            id: doc.id,
            ...doc.data(),
          } as Transaction);
        });
        
        // Sort by date (most recent first)
        transactionsData.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        
        setTransactions(transactionsData.slice(0, limit));
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching transactions:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, sellerId, limit]);

  return { data: transactions, isLoading, error };
}

