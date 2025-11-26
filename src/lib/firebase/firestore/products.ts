
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
} from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';

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
}

// This function is intended for server-side use now, but we keep it here to avoid breaking client-side imports of other functions for now.
// A better refactor would be to move server-side functions to their own files.
// The searchProducts logic is now in a server action file / a dedicated server file.
async function searchProducts(searchTerm: string): Promise<Product[]> {
    // This is a placeholder. The actual logic is now server-side.
    console.warn("searchProducts is being called on the client. This should be a server-side call.");
    return [];
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
    if (productLimit) {
        return query(coll, limit(productLimit));
    }
    return query(coll);
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
        setIsLoading(false);
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
    if (!productRef) {
      setIsLoading(false);
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
export const addProduct = async (firestore: Firestore, userId: string, product: Omit<Product, 'id' | 'sellerId' | 'price'>) => {
    if (!firestore) throw new Error("Firestore is not initialized");

    const productsCollection = collection(firestore, 'products');
    return await addDoc(productsCollection, {
        ...product,
        sellerId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
};

export const updateProduct = async (firestore: Firestore, productId: string, userId: string, product: Partial<Product>) => {
    if (!firestore) throw new Error("Firestore is not initialized");

    const productRef = doc(firestore, 'products', productId);
    const productDoc = await getDoc(productRef);

    if (!productDoc.exists() || productDoc.data().sellerId !== userId) {
        throw new Error("Product not found or permission denied");
    }

    // remove price field before update, as it's a client-side construct
    const { price, ...updateData } = product;

    return await updateDoc(productRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
    });
};

export const deleteProduct = async (firestore: Firestore, productId: string, userId: string) => {
    if (!firestore) throw new Error("Firestore is not initialized");

    const productRef = doc(firestore, 'products', productId);
    const productDoc = await getDoc(productRef);

    if (!productDoc.exists() || productDoc.data().sellerId !== userId) {
        throw new Error("Product not found or permission denied");
    }

    return await deleteDoc(productRef);
};

