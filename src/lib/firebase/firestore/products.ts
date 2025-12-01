
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  DocumentData,
  FirestoreError,
  getDoc,
  serverTimestamp,
  limit,
  getDocs,
  Firestore,
  orderBy,
} from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

export interface Product extends DocumentData {
  id?: string;
  name: string;
  description: string;
  price: number; // This will now be the initial price for client-side display
  initialPrice: number;
  lastPrice: number;
  stock: number;
  imageUrl?: string;
  sellerId: string;
  category?: string;
  isFeatured?: boolean;
  createdAt?: any;
}

// Hook to get all products for the storefront
export const useAllProducts = (productLimit?: number) => {
  const { firestore } = useFirebase();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const productsQuery = useMemo(() => {
    if (!firestore) return null;
    const coll = collection(firestore, 'products');
    let q = query(coll, orderBy('createdAt', 'desc'));
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
    setIsLoading(true);

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({ id: doc.id, price: doc.data().initialPrice, ...doc.data() } as Product));
        setProducts(productsData);
        setError(null);
        setIsLoading(false);
      },
      (err: any) => {
        console.error("Error fetching products: ", err);
        setError(err);
        setIsLoading(false);
        const permissionError = new FirestorePermissionError({
            path: (productsQuery as any).path,
            operation: 'list',
          });
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    return () => unsubscribe();
  }, [productsQuery]);

  return { data: products, isLoading, error };
};

// Hook to get products for a specific seller
export const useProductsBySeller = (sellerId: string | undefined) => {
  const { firestore } = useFirebase();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  
  const sellerProductsQuery = useMemo(() => {
      if (!firestore || !sellerId) return null;
      return query(collection(firestore, 'products'), where('sellerId', '==', sellerId), orderBy('createdAt', 'desc'));
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
        const productsData = snapshot.docs.map(doc => ({ id: doc.id, price: doc.data().initialPrice, ...doc.data() } as Product));
        setProducts(productsData);
        setError(null);
        setIsLoading(false);
      },
      (err: any) => {
        console.error("Error fetching seller products: ", err);
        setError(err);
        setIsLoading(false);
        const permissionError = new FirestorePermissionError({
          path: `users/${sellerId}/products`,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
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
          setProduct({ id: doc.id, price: doc.data().initialPrice, ...doc.data() } as Product);
        } else {
          setProduct(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (err: any) => {
        console.error("Error fetching product:", err);
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
