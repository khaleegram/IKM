
'use client';

import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useFirebase } from '@/firebase/provider';
import {
  DocumentData,
  Firestore,
  FirestoreError,
  QueryDocumentSnapshot,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where
} from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { firestoreCache, generateCacheKey } from './cache';

export interface ProductVariant {
  id: string;
  name: string; // e.g., "Size", "Color"
  options: {
    value: string; // e.g., "Small", "Red"
    priceModifier?: number; // Additional price for this variant
    stock?: number; // Stock for this specific variant
    sku?: string; // SKU for this variant
  }[];
}

export interface ProductDeliveryMethods {
  localDispatch?: {
    enabled: boolean;
    method?: "keke" | "bike" | "personal";
    price?: number;
    negotiable?: boolean;
  };
  waybill?: {
    enabled: boolean;
    parks?: string[]; // Park IDs like ["naibawa", "mando", "jabi"]
    feePaidBy?: "seller" | "buyer";
  };
  pickup?: {
    enabled: boolean;
    location?: string; // "my-shop" or landmark text
    landmark?: string;
  };
}

export interface Product extends DocumentData {
  // Core (Always Required)
  id?: string;
  name: string;
  price: number; // Selling price
  compareAtPrice?: number; // Original price (for showing discounts)
  category: string; // fragrance, fashion, snacks, materials, skincare, haircare, islamic, electronics
  sellerId: string;
  stock: number;
  sku?: string;
  
  // Media (Priority)
  imageUrl?: string;
  imageUrls?: string[]; // Multiple images
  videoUrl?: string; // 15-second video (priority)
  audioDescription?: string; // Audio file URL (basic recording)
  
  // Description
  description?: string;
  
  // Category-Specific Fields (Conditional)
  
  // FRAGRANCE fields
  volume?: string; // "3ml", "6ml", "12ml", "30ml", "50ml", "100ml", "other"
  fragranceType?: string; // "oil-based", "spray", "incense"
  container?: string; // "pocket-size", "standard-bottle", "refill-unboxed"
  
  // FASHION fields
  sizeType?: string; // "free-size", "abaya-length", "standard"
  abayaLength?: string; // "52", "54", "56", "58", "60"
  standardSize?: string; // "S", "M", "L", "XL", "XXL"
  setIncludes?: string; // "dress-only", "with-veil", "3-piece-set"
  material?: string; // "soft-silk", "stiff-cotton", "heavy-premium"
  
  // SNACKS fields
  packaging?: string; // "single-piece", "pack-sachet", "plastic-jar", "bucket"
  quantity?: number; // 1, 6, 12, 24, or custom
  taste?: string; // "sweet", "spicy", "crunchy", "soft"
  
  // MATERIALS fields
  fabricLength?: string; // "4-yards", "5-yards", "10-yards"
  quality?: string; // "super-vip", "standard", "starched"
  
  // SKINCARE fields
  skincareBrand?: string;
  skincareType?: string; // "face-cream", "soap", "toner", "serum", etc.
  skincareSize?: string; // "small", "medium", "large", or specific ml/g
  
  // HAIRCARE fields
  haircareType?: string; // "hair-oil", "treatment", "shampoo", "conditioner", etc.
  haircareBrand?: string;
  haircareSize?: string; // "small", "medium", "large", or specific ml/g
  
  // ISLAMIC fields
  islamicType?: string; // "prayer-mat", "tasbih", "book", "misbaha", etc.
  islamicSize?: string; // "small", "medium", "large", "standard"
  islamicMaterial?: string; // "wool", "cotton", "plastic", "wood", etc.
  
  // ELECTRONICS fields
  brand?: string;
  model?: string;
  
  // Delivery Settings
  deliveryFeePaidBy?: 'seller' | 'buyer';
  deliveryMethods?: ProductDeliveryMethods;
  
  // Status
  status?: 'active' | 'draft' | 'inactive';
  isFeatured?: boolean;
  allowShipping?: boolean; // Legacy field for backward compatibility
  variants?: ProductVariant[]; // Product variants (size, color, etc.)
  
  // WhatsApp Share
  shareLink?: string; // Generated product link
  whatsappPreviewImage?: string; // Generated preview image
  
  // Analytics
  views?: number;
  salesCount?: number;
  averageRating?: number; // Average rating from reviews (1-5)
  reviewCount?: number; // Total number of reviews
  
  // Timestamps
  createdAt?: any;
  updatedAt?: any;
}

// Hook to get all products for the storefront
export const useAllProducts = (productLimit?: number) => {
  const { firestore } = useFirebase();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const cacheKey = useMemo(() => generateCacheKey('products', 'all', productLimit || 'unlimited'), [productLimit]);

  const productsQuery = useMemo(() => {
    if (!firestore) return null;
    const coll = collection(firestore, 'products');
    let q = query(coll);
    if (productLimit) {
        q = query(q, limit(productLimit));
    }
    return q;
  }, [firestore, productLimit]);


  useEffect(() => {
    if (!productsQuery) {
        setIsLoading(false);
        return;
    }

    // Check cache first
    const cachedData = firestoreCache.get<Product[]>(cacheKey);
    if (cachedData) {
      setProducts(cachedData);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        
        const productsData = snapshot.docs.map(doc => {
          const data = doc.data();
          // Handle both Timestamp and Date objects
          let createdAt = data.createdAt;
          if (createdAt && typeof createdAt.toMillis === 'function') {
            // It's a Firestore Timestamp
            createdAt = createdAt;
          } else if (createdAt && createdAt instanceof Date) {
            // It's a Date object - convert to Timestamp-like object
            createdAt = { toMillis: () => createdAt.getTime() };
          }
          
          return { 
            id: doc.id, 
            price: data.price || 0, 
            ...data,
            createdAt 
          } as Product;
        });
        
        productsData.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || a.createdAt?.getTime?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || b.createdAt?.getTime?.() || 0;
          return bTime - aTime;
        });
        
        // Cache the results
        firestoreCache.set(cacheKey, productsData, 5 * 60 * 1000); // 5 minutes
        
        setProducts(productsData);
        setError(null);
        setIsLoading(false);
      },
      (err: any) => {
        setError(err);
        setProducts([]);
        setIsLoading(false);
        const permissionError = new FirestorePermissionError({
            path: 'products',
            operation: 'list',
          });
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [productsQuery, cacheKey]);

  return { data: products, isLoading, error };
};

// Hook for paginated products with infinite scroll support
export const usePaginatedProducts = (pageSize: number = 20) => {
  const { firestore } = useFirebase();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const productsQuery = useMemo(() => {
    if (!firestore) return null;
    const coll = collection(firestore, 'products');
    return query(coll, orderBy('createdAt', 'desc'), limit(pageSize));
  }, [firestore, pageSize]);

  // Initial load
  useEffect(() => {
    if (!productsQuery) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setProducts([]);
    setLastDoc(null);
    setHasMore(true);

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        const productsData = snapshot.docs.map(doc => {
          const data = doc.data();
          let createdAt = data.createdAt;
          if (createdAt && typeof createdAt.toMillis === 'function') {
            createdAt = createdAt;
          } else if (createdAt && createdAt instanceof Date) {
            createdAt = { toMillis: () => createdAt.getTime() };
          }
          
          return { 
            id: doc.id, 
            price: data.price || 0, 
            ...data,
            createdAt 
          } as Product;
        });
        
        setProducts(productsData);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === pageSize);
        setError(null);
        setIsLoading(false);
      },
      (err: any) => {
        setError(err);
        setProducts([]);
        setIsLoading(false);
        const permissionError = new FirestorePermissionError({
          path: 'products',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    return () => unsubscribe();
  }, [productsQuery, pageSize]);

  // Load more products
  const loadMore = useCallback(async () => {
    if (!firestore || !lastDoc || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const coll = collection(firestore, 'products');
      const nextQuery = query(
        coll,
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );
      
      const snapshot = await getDocs(nextQuery);
      const newProducts = snapshot.docs.map(doc => {
        const data = doc.data();
        let createdAt = data.createdAt;
        if (createdAt && typeof createdAt.toMillis === 'function') {
          createdAt = createdAt;
        } else if (createdAt && createdAt instanceof Date) {
          createdAt = { toMillis: () => createdAt.getTime() };
        }
        
          return { 
            id: doc.id, 
            price: data.price || 0, 
            ...data,
            createdAt 
          } as Product;
      });

      if (newProducts.length > 0) {
        setProducts(prev => [...prev, ...newProducts]);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === pageSize);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [firestore, lastDoc, isLoadingMore, hasMore, pageSize]);

  return { data: products, isLoading, isLoadingMore, error, loadMore, hasMore };
};

// Hook to get products for a specific seller
export const useProductsBySeller = (sellerId: string | undefined) => {
  const { firestore } = useFirebase();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  
  const sellerProductsQuery = useMemo(() => {
      if (!firestore || !sellerId) return null;
      // Query products by sellerId - we sort client-side to avoid composite index requirement
      return query(collection(firestore, 'products'), where('sellerId', '==', sellerId));
  }, [firestore, sellerId]);


  useEffect(() => {
    if (!sellerProductsQuery) {
        if (!sellerId) setIsLoading(false);
        setProducts([]);
        return;
    }
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(
      sellerProductsQuery,
      (snapshot) => {
        const productsData = snapshot.docs.map(doc => {
          const data = doc.data();
          let createdAt = data.createdAt;
          if (createdAt && typeof createdAt.toMillis === 'function') {
            createdAt = createdAt;
          } else if (createdAt && createdAt instanceof Date) {
            createdAt = { toMillis: () => createdAt.getTime() };
          }
          return { 
            id: doc.id, 
            price: data.price || 0, 
            ...data,
            createdAt 
          } as Product;
        });
        
        // Sort by createdAt descending if not already sorted by Firestore
        productsData.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || a.createdAt?.getTime?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || b.createdAt?.getTime?.() || 0;
          return bTime - aTime;
        });
        
        setProducts(productsData);
        setError(null);
        setIsLoading(false);
      },
      (err: any) => {
        setError(err);
        setIsLoading(false);
        // Only emit permission error if it's actually a permission error
        if (err.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: `products`,
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
        }
      }
    );

    return () => unsubscribe();
  }, [sellerId, sellerProductsQuery]);

  return { data: products, isLoading, error };
};

// Hook to get a single product by ID
export const useProduct = (productId: string) => {
  const { firestore } = useFirebase();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const productRef = useMemo(() => {
      if (!firestore || !productId) return null;
      return doc(firestore, 'products', productId);
  }, [firestore, productId]);

  useEffect(() => {
    if (!productRef) {
      if (!productId) setIsLoading(false);
      return;
    };

    setIsLoading(true);
    const unsubscribe = onSnapshot(
      productRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setProduct({ id: doc.id, price: data.price || 0, ...data } as Product);
        } else {
          setProduct(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (err: any) => {
        // Error fetching product
        setError(err);
        setIsLoading(false);
        const permissionError = new FirestorePermissionError({
          path: `products/${productId}`,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    return () => unsubscribe();
  }, [productRef, productId]);

  return { data: product, isLoading, error };
};


// Functions to modify products
export const addProduct = (firestore: Firestore, userId: string, productData: Omit<Product, 'id' | 'sellerId' | 'price' | 'createdAt'>) => {
    if (!firestore) throw new Error("Firestore is not initialized");

    const productsCollection = collection(firestore, 'products');
    const dataWithTimestamp = {
        ...productData,
        sellerId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    
    return addDoc(productsCollection, dataWithTimestamp).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: productsCollection.path,
        operation: 'create',
        requestResourceData: dataWithTimestamp
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError; // Re-throw original error
    });
};

export const updateProduct = (firestore: Firestore, productId: string, userId: string, product: Partial<Product>) => {
    if (!firestore) throw new Error("Firestore is not initialized");

    const productRef = doc(firestore, 'products', productId);
    
    // remove price field before update, as it's a client-side construct
    const { price, ...updateData } = product;

    const dataWithTimestamp = {
        ...updateData,
        updatedAt: serverTimestamp(),
    };

    return updateDoc(productRef, dataWithTimestamp).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: productRef.path,
          operation: 'update',
          requestResourceData: dataWithTimestamp,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw serverError; // Re-throw original error
    });
};

export const deleteProduct = (firestore: Firestore, productId: string, userId: string) => {
    if (!firestore) throw new Error("Firestore is not initialized");

    const productRef = doc(firestore, 'products', productId);
    
    return deleteDoc(productRef).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: productRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
      throw serverError; // Re-throw original error
    });
};
