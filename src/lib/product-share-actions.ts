'use server';

import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Generate WhatsApp share link for a product
 */
export async function generateProductShareLink(productId: string): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:9002';
  
  return `${baseUrl}/product/${productId}`;
}

/**
 * Update product with share link and preview image
 */
export async function updateProductShareInfo(
  productId: string,
  shareLink: string,
  previewImageUrl?: string
): Promise<void> {
  const firestore = getAdminFirestore();
  const productRef = firestore.collection('products').doc(productId);
  
  const updateData: any = {
    shareLink,
    updatedAt: FieldValue.serverTimestamp(),
  };
  
  if (previewImageUrl) {
    updateData.whatsappPreviewImage = previewImageUrl;
  }
  
  await productRef.update(updateData);
}

