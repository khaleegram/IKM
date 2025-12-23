'use server';

import { z } from "zod";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/auth-utils";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

const reviewSchema = z.object({
  productId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, "Review must be at least 10 characters").max(1000, "Review must not exceed 1000 characters"),
  orderId: z.string().optional(), // Optional: link review to order
});

/**
 * Submit a product review
 */
export async function submitReview(formData: FormData) {
  const auth = await requireAuth();
  const userId = auth.uid;

  const rawData = Object.fromEntries(formData);
  const validatedData = reviewSchema.parse(rawData);

  const { productId, rating, comment, orderId } = validatedData;

  const firestore = getAdminFirestore();

  // Verify product exists
  const productDoc = await firestore.collection('products').doc(productId).get();
  if (!productDoc.exists) {
    throw new Error('Product not found');
  }

  // Check if user has already reviewed this product
  const existingReviewSnapshot = await firestore.collection('reviews')
    .where('productId', '==', productId)
    .where('userId', '==', userId)
    .limit(1)
    .get();

  if (!existingReviewSnapshot.empty) {
    throw new Error('You have already reviewed this product');
  }

  // Optional: Verify user has purchased this product (if orderId provided)
  if (orderId) {
    const orderDoc = await firestore.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      throw new Error('Order not found');
    }
    
    const orderData = orderDoc.data();
    if (orderData?.customerId !== userId) {
      throw new Error('Unauthorized: This order does not belong to you');
    }

    // Check if order contains this product
    const hasProduct = orderData?.items?.some((item: any) => item.productId === productId);
    if (!hasProduct) {
      throw new Error('This product is not in the specified order');
    }
  }

  // Create review
  const reviewRef = await firestore.collection('reviews').add({
    productId,
    userId,
    rating,
    comment,
    orderId: orderId || null,
    verifiedPurchase: !!orderId,
    helpfulCount: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Update product rating
  await updateProductRating(productId, firestore);

  revalidatePath(`/product/${productId}`);
  revalidatePath(`/seller/products`);

  return { success: true, reviewId: reviewRef.id };
}

/**
 * Update product rating based on all reviews
 */
async function updateProductRating(productId: string, firestore: FirebaseFirestore.Firestore) {
  const reviewsSnapshot = await firestore.collection('reviews')
    .where('productId', '==', productId)
    .get();

  if (reviewsSnapshot.empty) {
    return;
  }

  let totalRating = 0;
  let count = 0;

  reviewsSnapshot.forEach(doc => {
    const review = doc.data();
    totalRating += review.rating || 0;
    count++;
  });

  const averageRating = totalRating / count;

  await firestore.collection('products').doc(productId).update({
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    reviewCount: count,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Update a review
 */
export async function updateReview(reviewId: string, formData: FormData) {
  const auth = await requireAuth();
  const userId = auth.uid;

  const rawData = Object.fromEntries(formData);
  const updateSchema = z.object({
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().min(10).max(1000).optional(),
  });

  const validatedData = updateSchema.parse(rawData);

  const firestore = getAdminFirestore();
  const reviewDoc = await firestore.collection('reviews').doc(reviewId).get();

  if (!reviewDoc.exists) {
    throw new Error('Review not found');
  }

  const reviewData = reviewDoc.data();
  if (reviewData?.userId !== userId) {
    throw new Error('Unauthorized: You can only update your own reviews');
  }

  const updateData: any = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (validatedData.rating !== undefined) {
    updateData.rating = validatedData.rating;
  }

  if (validatedData.comment !== undefined) {
    updateData.comment = validatedData.comment;
  }

  await reviewDoc.ref.update(updateData);

  // Update product rating
  await updateProductRating(reviewData.productId, firestore);

  revalidatePath(`/product/${reviewData.productId}`);
  revalidatePath(`/seller/products`);

  return { success: true };
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string) {
  const auth = await requireAuth();
  const userId = auth.uid;

  const firestore = getAdminFirestore();
  const reviewDoc = await firestore.collection('reviews').doc(reviewId).get();

  if (!reviewDoc.exists) {
    throw new Error('Review not found');
  }

  const reviewData = reviewDoc.data();
  
  // User can delete their own review, admin can delete any
  if (reviewData?.userId !== userId && !auth.isAdmin) {
    throw new Error('Unauthorized');
  }

  const productId = reviewData.productId;

  await reviewDoc.ref.delete();

  // Update product rating
  await updateProductRating(productId, firestore);

  revalidatePath(`/product/${productId}`);
  revalidatePath(`/seller/products`);

  return { success: true };
}

/**
 * Mark review as helpful
 */
export async function markReviewHelpful(reviewId: string) {
  const auth = await requireAuth();
  const userId = auth.uid;

  const firestore = getAdminFirestore();
  const reviewDoc = await firestore.collection('reviews').doc(reviewId).get();

  if (!reviewDoc.exists) {
    throw new Error('Review not found');
  }

  const reviewData = reviewDoc.data();
  
  // Check if user has already marked this as helpful
  const helpfulUsers = reviewData?.helpfulUsers || [];
  if (helpfulUsers.includes(userId)) {
    throw new Error('You have already marked this review as helpful');
  }

  await reviewDoc.ref.update({
    helpfulCount: FieldValue.increment(1),
    helpfulUsers: FieldValue.arrayUnion(userId),
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/product/${reviewData.productId}`);

  return { success: true };
}

/**
 * Reply to a review (seller only)
 */
export async function replyToReview(reviewId: string, formData: FormData) {
  const auth = await requireAuth();

  const rawData = Object.fromEntries(formData);
  const replySchema = z.object({
    reply: z.string().min(5, "Reply must be at least 5 characters").max(500, "Reply must not exceed 500 characters"),
  });

  const validatedData = replySchema.parse(rawData);

  const firestore = getAdminFirestore();
  const reviewDoc = await firestore.collection('reviews').doc(reviewId).get();

  if (!reviewDoc.exists) {
    throw new Error('Review not found');
  }

  const reviewData = reviewDoc.data();
  
  // Get product to verify seller
  const productDoc = await firestore.collection('products').doc(reviewData.productId).get();
  const productData = productDoc.data();

  if (productData?.sellerId !== auth.uid && !auth.isAdmin) {
    throw new Error('Unauthorized: Only the product seller can reply to reviews');
  }

  await reviewDoc.ref.update({
    sellerReply: validatedData.reply,
    sellerReplyAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/product/${reviewData.productId}`);
  revalidatePath(`/seller/products`);

  return { success: true };
}

