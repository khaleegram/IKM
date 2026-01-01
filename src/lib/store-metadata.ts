'use server';

import { getAdminFirestore } from '@/lib/firebase/admin';
import type { StoreProfile } from '@/lib/firebase/firestore/stores';
import { Metadata } from 'next';

/**
 * Get store data for metadata generation (server-side only)
 */
export async function getStoreForMetadata(sellerId: string): Promise<StoreProfile | null> {
  try {
    const firestore = getAdminFirestore();
    const storeDoc = await firestore.collection('stores').doc(sellerId).get();
    
    if (!storeDoc.exists) {
      return null;
    }
    
    const data = storeDoc.data();
    return {
      id: storeDoc.id,
      ...data,
    } as StoreProfile;
  } catch (error) {
    console.error('Error fetching store for metadata:', error);
    return null;
  }
}

/**
 * Get absolute URL helper (server-side)
 */
function getAbsoluteUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  process.env.NEXT_PUBLIC_APP_DOMAIN ||
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:9002');
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Generate store image URL for metadata
 */
function getStoreImageUrl(store: StoreProfile): string | null {
  // Prefer banner over logo (better aspect ratio for previews)
  if (store.storeBannerUrl) {
    return store.storeBannerUrl;
  }
  // Fallback to logo
  if (store.storeLogoUrl) {
    return store.storeLogoUrl;
  }
  return null;
}

/**
 * Generate metadata for store page
 */
export async function generateStoreMetadata(store: StoreProfile, sellerId: string): Promise<Metadata> {
  const storeUrl = getAbsoluteUrl(`/store/${sellerId}`);
  const imageUrl = getStoreImageUrl(store);
  const absoluteImageUrl = imageUrl ? imageUrl : null; // Image URLs from Firebase Storage should already be absolute
  
  const description = store.storeDescription 
    ? `${store.storeDescription.substring(0, 155)}${store.storeDescription.length > 155 ? '...' : ''}`
    : `Visit ${store.storeName} on IKM Marketplace`;
  
  const metadata: Metadata = {
    title: `${store.storeName} - IKM Marketplace`,
    description,
    openGraph: {
      title: store.storeName,
      description: description,
      url: storeUrl,
      type: 'website',
      images: absoluteImageUrl ? [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: store.storeName,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: store.storeName,
      description: description,
      images: absoluteImageUrl ? [absoluteImageUrl] : [],
    },
  };
  
  return metadata;
}

