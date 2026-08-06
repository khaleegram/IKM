'use server';

import { getAdminFirestore } from '@/lib/firebase/admin';
import type { Product } from '@/lib/firebase/firestore/products';
import { Metadata } from 'next';

/**
 * Get product data for metadata generation (server-side only)
 */
export async function getProductForMetadata(productId: string): Promise<Product | null> {
  try {
    const firestore = getAdminFirestore();
    const productDoc = await firestore.collection('products').doc(productId).get();
    
    if (!productDoc.exists) {
      return null;
    }
    
    const data = productDoc.data();
    return {
      id: productDoc.id,
      ...data,
    } as Product;
  } catch (error) {
    console.error('Error fetching product for metadata:', error);
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
 * Generate product image URL for metadata
 */
function getProductImageUrl(product: Product): string | null {
  // Prefer first image from imageUrls array
  if (product.imageUrls && product.imageUrls.length > 0) {
    return product.imageUrls[0];
  }
  // Fallback to imageUrl
  if (product.imageUrl) {
    return product.imageUrl;
  }
  return null;
}

/**
 * Generate metadata for product page
 */
export async function generateProductMetadata(product: Product): Promise<Metadata> {
  const productUrl = getAbsoluteUrl(`/product/${product.id}`);
  const imageUrl = getProductImageUrl(product);
  const absoluteImageUrl = imageUrl ? imageUrl : null; // Image URLs from Firebase Storage should already be absolute
  
  const description = product.description 
    ? `${product.description.substring(0, 155)}${product.description.length > 155 ? '...' : ''}`
    : `Check out ${product.name} - ₦${product.price.toLocaleString()} on IKM Marketplace`;
  
  const metadata: Metadata = {
    title: `${product.name} - IKM Marketplace`,
    description,
    openGraph: {
      title: product.name,
      description: description,
      url: productUrl,
      type: 'website',
      images: absoluteImageUrl ? [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: description,
      images: absoluteImageUrl ? [absoluteImageUrl] : [],
    },
  };
  
  return metadata;
}

