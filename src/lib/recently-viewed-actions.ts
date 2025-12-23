'use server';

import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/auth-utils";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

/**
 * Track recently viewed product
 */
export async function trackProductView(productId: string) {
  const auth = await requireAuth();
  const userId = auth.uid;

  const firestore = getAdminFirestore();

  // Verify product exists
  const productDoc = await firestore.collection('products').doc(productId).get();
  if (!productDoc.exists) {
    return { success: false };
  }

  // Get or create user's recently viewed
  const recentlyViewedRef = firestore.collection('recentlyViewed').doc(userId);
  const recentlyViewedDoc = await recentlyViewedRef.get();

  const maxItems = 20; // Keep last 20 viewed products

  if (recentlyViewedDoc.exists) {
    const data = recentlyViewedDoc.data();
    const products = data?.products || [];
    
    // Remove if already exists
    const filteredProducts = products.filter((p: any) => p.productId !== productId);
    
    // Add to beginning
    const updatedProducts = [
      { productId, viewedAt: FieldValue.serverTimestamp() },
      ...filteredProducts
    ].slice(0, maxItems);

    await recentlyViewedRef.update({
      products: updatedProducts,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    await recentlyViewedRef.set({
      userId,
      products: [{ productId, viewedAt: FieldValue.serverTimestamp() }],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return { success: true };
}

