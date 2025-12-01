
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
  Firestore,
  getDocs,
} from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
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
export const createOrder = async (firestore: Firestore, orderData: Omit<Order, 'id' | 'createdAt'>) => {
  if (!firestore) throw new Error("Firestore is not initialized");

  const ordersCollection = collection(firestore, 'orders');
  return await addDoc(ordersCollection, {
    ...orderData,
    createdAt: serverTimestamp(),
  });
};

// Hook to get ALL orders (for admin)
export const useAllOrders = () => {
    const { firestore } = useFirebase();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<FirestoreError | null>(null);

    const ordersQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    useEffect(() => {
        if (!ordersQuery) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const unsubscribe = onSnapshot(
            ordersQuery,
            (snapshot) => {
                const ordersData = snapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data(),
                    total: doc.data().total || 0, // Ensure total is never undefined
                } as Order));
                setOrders(ordersData);
                setIsLoading(false);
            },
            (err) => {
                console.error("Error fetching all orders: ", err);
                setError(err);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [ordersQuery]);

    return { data: orders, isLoading, error };
}

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
        setOrders([]);
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
        setOrders([]);
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
            setOrder(null);
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
export const updateOrderStatus = async (firestore: Firestore, orderId: string, status: Order['status']) => {
    if (!firestore) throw new Error("Firestore is not initialized");

    const orderRef = doc(firestore, 'orders', orderId);
    return await updateDoc(orderRef, { status });
}
