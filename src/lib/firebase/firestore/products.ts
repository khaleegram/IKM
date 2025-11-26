
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
} from 'firebase/firestore';
import { useFirebase } from '@/firebase';

export interface Product extends DocumentData {
  id?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  sellerId: string;
}

// Hook to get all products for the storefront
export const useAllProducts = () => {
  const { firestore } = useFirebase();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const productsQuery = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);


  useEffect(() => {
    if (!productsQuery) return;

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productsData);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching products: ", err);
        setError(err);
        setIsLoading(false);
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
      return query(collection(firestore, 'products'), where('sellerId', '==', sellerId));
  }, [firestore, sellerId]);


  useEffect(() => {
    if (!sellerProductsQuery) {
        if (!sellerId) setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(
      sellerProductsQuery,
      (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productsData);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching seller products: ", err);
        setError(err);
        setIsLoading(false);
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
    if (!productRef) return;

    const unsubscribe = onSnapshot(
      productRef,
      (doc) => {
        if (doc.exists()) {
          setProduct({ id: doc.id, ...doc.data() } as Product);
        } else {
          setProduct(null);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching product:", err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [productRef]);

  return { data: product, isLoading, error };
};


// Functions to modify products
export const addProduct = async (userId: string, product: Omit<Product, 'id' | 'sellerId'>) => {
    const { firestore } = useFirebase();
    if (!firestore) throw new Error("Firestore is not initialized");

    const productsCollection = collection(firestore, 'products');
    return await addDoc(productsCollection, {
        ...product,
        sellerId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
};

export const updateProduct = async (productId: string, userId: string, product: Partial<Product>) => {
    const { firestore } = useFirebase();
    if (!firestore) throw new Error("Firestore is not initialized");

    const productRef = doc(firestore, 'products', productId);
    const productDoc = await getDoc(productRef);

    if (!productDoc.exists() || productDoc.data().sellerId !== userId) {
        throw new Error("Product not found or permission denied");
    }

    return await updateDoc(productRef, {
        ...product,
        updatedAt: serverTimestamp(),
    });
};

export const deleteProduct = async (productId: string, userId: string) => {
    const { firestore } = useFirebase();
    if (!firestore) throw new Error("Firestore is not initialized");

    const productRef = doc(firestore, 'products', productId);
    const productDoc = await getDoc(productRef);

    if (!productDoc.exists() || productDoc.data().sellerId !== userId) {
        throw new Error("Product not found or permission denied");
    }

    return await deleteDoc(productRef);
};
