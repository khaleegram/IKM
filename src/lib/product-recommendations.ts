'use server';

import { getAdminFirestore } from "@/lib/firebase/admin";
import type { Product } from "@/lib/firebase/firestore/products";

/**
 * Get product recommendations based on:
 * 1. Same category
 * 2. Similar price range
 * 3. Popular products (high sales/views)
 */
export async function getProductRecommendations(
  productId: string,
  category?: string,
  price?: number,
  limit: number = 8
): Promise<Product[]> {
  const firestore = getAdminFirestore();
  const productDoc = await firestore.collection('products').doc(productId).get();

  if (!productDoc.exists) {
    return [];
  }

  const productData = productDoc.data();
  const productCategory = category || productData?.category;
  const productPrice = price || productData?.price || productData?.initialPrice || 0;
  const priceRange = productPrice * 0.5; // ±50% price range

  let query = firestore.collection('products')
    .where('stock', '>', 0); // Only in-stock products

  // If category exists, prioritize same category
  if (productCategory) {
    query = query.where('category', '==', productCategory);
  }

  const snapshot = await query.limit(limit * 2).get(); // Get more to filter

  const recommendations = snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((p: any) => p.id !== productId) // Exclude current product
    .map((p: any) => {
      // Calculate relevance score
      let score = 0;
      
      // Same category bonus
      if (p.category === productCategory) {
        score += 10;
      }
      
      // Price similarity (closer price = higher score)
      const priceDiff = Math.abs((p.price || p.initialPrice || 0) - productPrice);
      if (priceDiff <= priceRange) {
        score += 10 - (priceDiff / priceRange) * 5;
      }
      
      // Popularity bonus (sales and views)
      if (p.salesCount) {
        score += Math.min(p.salesCount / 10, 5); // Max 5 points
      }
      if (p.views) {
        score += Math.min(p.views / 100, 3); // Max 3 points
      }
      
      // Rating bonus
      if (p.averageRating) {
        score += p.averageRating;
      }
      
      return { ...p, _score: score };
    })
    .sort((a: any, b: any) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, ...p }: any) => p); // Remove score before returning

  return recommendations as Product[];
}

/**
 * Get trending products (high sales/views in recent period)
 */
export async function getTrendingProducts(limit: number = 8): Promise<Product[]> {
  const firestore = getAdminFirestore();
  
  const snapshot = await firestore.collection('products')
    .where('stock', '>', 0)
    .limit(limit * 3)
    .get();

  const products = snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
    .map((p: any) => {
      // Calculate trending score
      let score = 0;
      
      // Sales count
      if (p.salesCount) {
        score += p.salesCount * 2;
      }
      
      // Views
      if (p.views) {
        score += p.views * 0.1;
      }
      
      // Rating
      if (p.averageRating) {
        score += p.averageRating * 5;
      }
      
      return { ...p, _score: score };
    })
    .sort((a: any, b: any) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, ...p }: any) => p);

  return products as Product[];
}

