'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import type { Product } from './products';

export interface RecentlyViewedItem extends DocumentData {
  productId: string;
  viewedAt?: any;
  product?: Product;
}

/**
 * Hook to get user's recently viewed products
 */
export function useRecentlyViewed(userId: string | undefined, limit: number = 10) {
  const { firestore } = useFirebase();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore || !userId) {
      setIsLoading(false);
      return;
    }

    const fetchRecentlyViewed = async () => {
      try {
        const recentlyViewedRef = doc(firestore, 'recentlyViewed', userId);
        const recentlyViewedDoc = await getDoc(recentlyViewedRef);

        if (!recentlyViewedDoc.exists()) {
          setProducts([]);
          setIsLoading(false);
          return;
        }

        const data = recentlyViewedDoc.data();
        const viewedItems = (data?.products || []).slice(0, limit);

        // Fetch product data for each viewed item
        const productPromises = viewedItems.map(async (item: RecentlyViewedItem) => {
          const productDoc = await getDoc(doc(firestore, 'products', item.productId));
          if (productDoc.exists()) {
            return {
              id: productDoc.id,
              ...productDoc.data(),
            } as Product;
          }
          return null;
        });

        const fetchedProducts = await Promise.all(productPromises);
        const validProducts = fetchedProducts.filter(p => p !== null) as Product[];
        
        setProducts(validProducts);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching recently viewed:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    fetchRecentlyViewed();
  }, [firestore, userId, limit]);

  return { data: products, isLoading, error };
}

