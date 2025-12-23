'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, DocumentData, FirestoreError, orderBy } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import type { Product } from './products';

export interface WishlistItem extends DocumentData {
  id?: string;
  userId: string;
  productId: string;
  createdAt?: any;
  // Joined product data
  product?: Product;
}

/**
 * Hook to get user's wishlist
 */
export function useWishlist(userId: string | undefined) {
  const { firestore } = useFirebase();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!firestore || !userId) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(firestore, 'wishlists'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const wishlistItems: WishlistItem[] = [];
        
        // Fetch product data for each wishlist item
        const productPromises = snapshot.docs.map(async (doc) => {
          const wishlistData = doc.data();
          const productDoc = await firestore.collection('products').doc(wishlistData.productId).get();
          
          if (productDoc.exists) {
            const productData = {
              id: productDoc.id,
              ...productDoc.data(),
            } as Product;
            
            return {
              id: doc.id,
              ...wishlistData,
              product: productData,
            } as WishlistItem;
          }
          
          return null;
        });
        
        const itemsWithProducts = await Promise.all(productPromises);
        wishlistItems.push(...itemsWithProducts.filter(item => item !== null) as WishlistItem[]);
        
        setWishlist(wishlistItems);
        setProducts(wishlistItems.map(item => item.product!).filter(Boolean));
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching wishlist:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, userId]);

  return { data: wishlist, products, isLoading, error };
}

/**
 * Hook to check if a product is in wishlist
 */
export function useIsInWishlist(userId: string | undefined, productId: string | undefined) {
  const { firestore } = useFirebase();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !userId || !productId) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(firestore, 'wishlists'),
      where('userId', '==', userId),
      where('productId', '==', productId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setIsInWishlist(!snapshot.empty);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error checking wishlist:', err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, userId, productId]);

  return { isInWishlist, isLoading };
}

