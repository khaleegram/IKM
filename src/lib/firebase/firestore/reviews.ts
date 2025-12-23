'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, DocumentData, FirestoreError, orderBy, limit } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';

export interface Review extends DocumentData {
  id?: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  orderId?: string;
  verifiedPurchase?: boolean;
  helpfulCount?: number;
  helpfulUsers?: string[];
  sellerReply?: string;
  sellerReplyAt?: any;
  createdAt?: any;
  updatedAt?: any;
  // User info (joined from users collection)
  userDisplayName?: string;
  userEmail?: string;
}

/**
 * Hook to get reviews for a product
 */
export function useProductReviews(productId: string | undefined, reviewLimit: number = 50) {
  const { firestore } = useFirebase();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!firestore || !productId) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(firestore, 'reviews'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc'),
      limit(reviewLimit)
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const reviewsData: Review[] = [];
        
        // Fetch user info for each review
        const userPromises = snapshot.docs.map(async (doc) => {
          const reviewData = doc.data();
          const userDoc = await firestore.collection('users').doc(reviewData.userId).get();
          const userData = userDoc.data();
          
          return {
            id: doc.id,
            ...reviewData,
            userDisplayName: userData?.displayName || 'Anonymous',
            userEmail: userData?.email || '',
          } as Review;
        });
        
        const reviewsWithUsers = await Promise.all(userPromises);
        reviewsData.push(...reviewsWithUsers);
        
        setReviews(reviewsData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching reviews:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, productId, reviewLimit]);

  return { data: reviews, isLoading, error };
}

/**
 * Hook to get user's reviews
 */
export function useUserReviews(userId: string | undefined) {
  const { firestore } = useFirebase();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!firestore || !userId) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(firestore, 'reviews'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const reviewsData: Review[] = [];
        
        // Fetch product info for each review
        const productPromises = snapshot.docs.map(async (doc) => {
          const reviewData = doc.data();
          const productDoc = await firestore.collection('products').doc(reviewData.productId).get();
          const productData = productDoc.data();
          
          return {
            id: doc.id,
            ...reviewData,
            productName: productData?.name || 'Unknown Product',
            productImage: productData?.imageUrl || '',
          } as Review & { productName: string; productImage: string };
        });
        
        const reviewsWithProducts = await Promise.all(productPromises);
        reviewsData.push(...reviewsWithProducts);
        
        setReviews(reviewsData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching user reviews:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, userId]);

  return { data: reviews, isLoading, error };
}

