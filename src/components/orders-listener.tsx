'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@/lib/firebase/auth/use-user';
import { useOrdersBySeller } from '@/lib/firebase/firestore/orders';
import { useToast } from '@/hooks/use-toast';

/**
 * OrdersListener - Lazy loaded component that listens for new orders
 * Only renders when needed (on seller routes)
 */
export function OrdersListener() {
  const { user } = useUser();
  const { data: orders, isLoading: isLoadingOrders } = useOrdersBySeller(user?.uid);
  const { toast } = useToast();
  const isInitialLoad = useRef(true);
  
  useEffect(() => {
    if (!isLoadingOrders && orders) {
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
      } else {
        toast({
          title: "New Order Received!",
          description: "A customer has placed a new order. Check your orders page.",
        });
      }
    }
  }, [orders, isLoadingOrders, toast]);

  return null; // This component doesn't render anything
}

