
'use client';

import { useFirebase } from '@/firebase/provider';
import { CartItem } from '@/lib/cart-context';
import {
  DocumentData,
  Firestore,
  FirestoreError,
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

export interface OrderNote {
  id: string;
  note: string;
  isInternal: boolean;
  createdBy: string;
  createdAt: any;
}

export interface Refund {
  id: string;
  orderId: string;
  amount: number;
  reason: string;
  refundMethod: 'original_payment' | 'store_credit' | 'manual';
  status: 'pending' | 'processed' | 'failed';
  processedBy?: string;
  createdAt: any;
  processedAt?: any;
}

export interface OrderChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderType: 'customer' | 'seller' | 'system';
  message?: string;
  imageUrl?: string;
  isSystemMessage: boolean;
  createdAt: any;
}

export interface OrderDispute {
  id: string;
  orderId: string;
  openedBy: string; // customerId
  type: 'item_not_received' | 'wrong_item' | 'damaged_item';
  description: string;
  status: 'open' | 'resolved' | 'closed';
  photos?: string[];
  resolvedBy?: string; // adminId
  resolvedAt?: any;
  createdAt: any;
}

export interface Order extends DocumentData {
  id?: string;
  customerId: string;
  sellerId: string;
  items: CartItem[];
  total: number;
  status: 'Processing' | 'AvailabilityCheck' | 'Sent' | 'Received' | 'Completed' | 'Cancelled' | 'Disputed';
  deliveryAddress: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  notes?: OrderNote[];
  refunds?: Refund[];
  paymentReference?: string;
  paymentMethod?: string;
  commissionRate?: number; // Commission rate at time of order (for historical accuracy)
  // Escrow fields
  escrowStatus: 'held' | 'released' | 'refunded';
  fundsReleasedAt?: any;
  // Delivery tracking
  sentAt?: any;
  sentPhotoUrl?: string;
  receivedAt?: any;
  receivedPhotoUrl?: string;
  // Auto-release
  autoReleaseDate?: any; // Date when funds auto-release if no dispute
  // Dispute
  dispute?: OrderDispute;
  // Shipping
  shippingType?: 'delivery' | 'pickup' | 'contact';
  shippingPrice?: number;
  deliveryFeePaidBy?: 'seller' | 'buyer';
  waybillParkId?: string;
  waybillParkName?: string; // "none" or custom text
  // Availability check fields (for food/snacks)
  availabilityStatus?: 'available' | 'not_available' | 'waiting_buyer_response' | 'waiting_restock' | 'cancelled';
  waitTimeDays?: number;
  waitTimeExpiresAt?: any; // Timestamp
  availabilityReason?: string;
  buyerWaitResponse?: 'accepted' | 'cancelled' | null;
  refundedAt?: any; // Timestamp when refund was processed
  idempotencyKey?: string; // For preventing duplicate orders
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
        // The orderBy clause can fail if the collection doesn't exist and an index hasn't been created.
        // Removing it makes the query more robust. We will sort client-side.
        return query(collection(firestore, 'orders'));
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

                // Sort client-side to avoid query errors on missing indexes
                ordersData.sort((a, b) => {
                    if (a.createdAt?.toDate && b.createdAt?.toDate) {
                        return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
                    }
                    return 0;
                });

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
// CRITICAL: This includes both orders created while logged in AND guest orders that were linked
export const useOrdersByCustomer = (customerId: string | undefined) => {
  const { firestore } = useFirebase();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const customerOrdersQuery = useMemo(() => {
    if (!firestore || !customerId) return null;
    // CRITICAL: Query orders where customerId matches the user's UID
    // This includes:
    // 1. Orders created while logged in (customerId = auth.uid)
    // 2. Guest orders that were linked (customerId updated from guest_xxx to auth.uid)
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
        // CRITICAL: Sort by date (newest first) in case orderBy doesn't work
        ordersData.sort((a, b) => {
          const aDate = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const bDate = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return bDate - aDate;
        });
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


/**
 * @deprecated Use server action instead: updateOrderStatus from @/lib/order-actions
 * Client-side writes are deprecated in favor of server actions for better security and validation.
 * This function is kept for backward compatibility but should not be used in new code.
 */
export const updateOrderStatus = async (firestore: Firestore, orderId: string, status: Order['status']) => {
    console.warn('⚠️ updateOrderStatus is deprecated. Use updateOrderStatus server action from @/lib/order-actions instead.');
    if (!firestore) throw new Error("Firestore is not initialized");

    const orderRef = doc(firestore, 'orders', orderId);
    return await updateDoc(orderRef, { status });
}
