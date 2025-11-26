
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
  getDoc,
  orderBy,
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
    return query(collection(firestore, 'orders'), where('sellerId', '==', sellerId), orderBy('createdAt', 'desc'));
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

// Hook to get orders for a specific customer
export const useOrdersByCustomer = (customerId: string | undefined) => {
  const { firestore } = useFirebase();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const customerOrdersQuery = useMemo(() => {
    if (!firestore || !customerId) return null;
    return query(collection(firestore, 'orders'), where('customerId', '==', customerId), orderBy('createdAt', 'desc'));
  }, [firestore, customerId]);

  useEffect(() => {
    if (!customerOrdersQuery) {
        if (!customerId) setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(
      customerOrdersQuery,
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(ordersData);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching customer orders: ", err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [customerId, customerOrdersQuery]);

  return { data: orders, isLoading, error };
};


// Hook to get a single order by ID
export const useOrder = (orderId: string | undefined) => {
    const { firestore } = useFirebase();
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<FirestoreError | null>(null);

    const orderRef = useMemo(() => {
        if (!firestore || !orderId) return null;
        return doc(firestore, 'orders', orderId);
    }, [firestore, orderId]);

    useEffect(() => {
        if (!orderRef) {
            if (!orderId) setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const unsubscribe = onSnapshot(orderRef,
            (doc) => {
                if (doc.exists()) {
                    setOrder({ id: doc.id, ...doc.data() } as Order);
                } else {
                    setOrder(null);
                }
                setIsLoading(false);
            },
            (err) => {
                console.error(`Error fetching order ${orderId}:`, err);
                setError(err);
                setIsLoading(false);
            }
        );
        return () => unsubscribe();
    }, [orderId, orderRef]);

    return { data: order, isLoading, error };
};


// Function to update an order's status
export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const { firestore } = useFirebase();
    if (!firestore) throw new Error("Firestore is not initialized");

    const orderRef = doc(firestore, 'orders', orderId);
    return await updateDoc(orderRef, { status });
}
