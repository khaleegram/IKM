'use server';

import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/auth-utils";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

/**
 * Add product to wishlist
 */
export async function addToWishlist(productId: string) {
  const auth = await requireAuth();
  const userId = auth.uid;

  const firestore = getAdminFirestore();

  // Verify product exists
  const productDoc = await firestore.collection('products').doc(productId).get();
  if (!productDoc.exists) {
    throw new Error('Product not found');
  }

  // Check if already in wishlist
  const wishlistSnapshot = await firestore.collection('wishlists')
    .where('userId', '==', userId)
    .where('productId', '==', productId)
    .limit(1)
    .get();

  if (!wishlistSnapshot.empty) {
    throw new Error('Product is already in your wishlist');
  }

  // Add to wishlist
  await firestore.collection('wishlists').add({
    userId,
    productId,
    createdAt: FieldValue.serverTimestamp(),
  });

  revalidatePath('/profile/wishlist');
  revalidatePath('/');

  return { success: true };
}

/**
 * Remove product from wishlist
 */
export async function removeFromWishlist(productId: string) {
  const auth = await requireAuth();
  const userId = auth.uid;

  const firestore = getAdminFirestore();

  // Find wishlist item
  const wishlistSnapshot = await firestore.collection('wishlists')
    .where('userId', '==', userId)
    .where('productId', '==', productId)
    .limit(1)
    .get();

  if (wishlistSnapshot.empty) {
    throw new Error('Product is not in your wishlist');
  }

  // Delete wishlist item
  await wishlistSnapshot.docs[0].ref.delete();

  revalidatePath('/profile/wishlist');
  revalidatePath('/');

  return { success: true };
}

/**
 * Get user's wishlist
 */
export async function getUserWishlist(userId: string) {
  const auth = await requireAuth();
  
  if (auth.uid !== userId && !auth.isAdmin) {
    throw new Error('Unauthorized');
  }

  const firestore = getAdminFirestore();

  const wishlistSnapshot = await firestore.collection('wishlists')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  const productIds = wishlistSnapshot.docs.map(doc => doc.data().productId);

  if (productIds.length === 0) {
    return [];
  }

  // Fetch products
  const products = await Promise.all(
    productIds.map(async (productId) => {
      const productDoc = await firestore.collection('products').doc(productId).get();
      if (productDoc.exists) {
        return {
          id: productDoc.id,
          ...productDoc.data(),
        };
      }
      return null;
    })
  );

  return products.filter(p => p !== null);
}

/**
 * Check if product is in wishlist
 */
export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
  const firestore = getAdminFirestore();

  const wishlistSnapshot = await firestore.collection('wishlists')
    .where('userId', '==', userId)
    .where('productId', '==', productId)
    .limit(1)
    .get();

  return !wishlistSnapshot.empty;
}

