'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  DocumentData,
  FirestoreError,
  serverTimestamp,
  doc,
} from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { CartItem } from '@/lib/cart-context';

export interface Order extends DocumentData {
  id?: string;
  customerId: string;
  sellerId: string;
  items: CartItem[];
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  deliveryAddress: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt: any; // Firestore Timestamp
}

// Function to create an order
export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt'>) => {
  const { firestore } = useFirebase();
  if (!firestore) throw new Error("Firestore is not initialized");

  const ordersCollection = collection(firestore, 'orders');
  return await addDoc(ordersCollection, {
    ...orderData,
    createdAt: serverTimestamp(),
  });
};

// Hook to get orders for a specific seller
export const useOrdersBySeller = (sellerId: string | undefined) => {
  const { firestore } = useFirebase();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const sellerOrdersQuery = useMemo(() => {
    if (!firestore || !sellerId) return null;
    return query(collection(firestore, 'orders'), where('sellerId', '==', sellerId));
  }, [firestore, sellerId]);

  useEffect(() => {
    if (!sellerOrdersQuery) {
        if (!sellerId) setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(
      sellerOrdersQuery,
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(ordersData);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching seller orders: ", err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sellerId, sellerOrdersQuery]);

  return { data: orders, isLoading, error };
};


// Function to update an order's status
export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const { firestore } = useFirebase();
    if (!firestore) throw new Error("Firestore is not initialized");

    const orderRef = doc(firestore, 'orders', orderId);
    return await updateDoc(orderRef, { status });
}
