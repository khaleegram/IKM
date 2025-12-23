'use server';

import { z } from "zod";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { requireAuth, requireOwnerOrAdmin } from "@/lib/auth-utils";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

const bulkUpdateSchema = z.object({
  productIds: z.array(z.string()).min(1, "At least one product must be selected"),
  updateType: z.enum(['price', 'stock', 'category', 'status']),
  value: z.union([z.string(), z.number()]),
});

/**
 * Bulk update products
 */
export async function bulkUpdateProducts(formData: FormData) {
  const auth = await requireAuth();
  const userId = auth.uid;

  const rawData = Object.fromEntries(formData);
  const productIds = JSON.parse(rawData.productIds as string);
  const updateType = rawData.updateType as 'price' | 'stock' | 'category' | 'status';
  const value = rawData.value;

  const firestore = getAdminFirestore();

  // Verify all products belong to the user
  const productPromises = productIds.map(async (productId: string) => {
    const productDoc = await firestore.collection('products').doc(productId).get();
    if (!productDoc.exists) {
      throw new Error(`Product ${productId} not found`);
    }
    const productData = productDoc.data();
    if (productData?.sellerId !== userId && !auth.isAdmin) {
      throw new Error(`Unauthorized: Product ${productId} does not belong to you`);
    }
    return { productId, productData };
  });

  const products = await Promise.all(productPromises);

  // Perform bulk update
  const batch = firestore.batch();
  const updateData: any = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  switch (updateType) {
    case 'price':
      updateData.initialPrice = Number(value);
      updateData.price = Number(value);
      break;
    case 'stock':
      updateData.stock = Number(value);
      break;
    case 'category':
      updateData.category = value as string;
      break;
    case 'status':
      // Assuming status is a boolean for active/inactive
      // You might want to add an 'isActive' field to products
      break;
  }

  products.forEach(({ productId }) => {
    const productRef = firestore.collection('products').doc(productId);
    batch.update(productRef, updateData);
  });

  await batch.commit();

  revalidatePath('/seller/products');

  return { success: true, updatedCount: productIds.length };
}

/**
 * Bulk delete products
 */
export async function bulkDeleteProducts(productIds: string[]) {
  const auth = await requireAuth();
  const userId = auth.uid;

  const firestore = getAdminFirestore();

  // Verify all products belong to the user
  const productPromises = productIds.map(async (productId: string) => {
    const productDoc = await firestore.collection('products').doc(productId).get();
    if (!productDoc.exists) {
      throw new Error(`Product ${productId} not found`);
    }
    const productData = productDoc.data();
    if (productData?.sellerId !== userId && !auth.isAdmin) {
      throw new Error(`Unauthorized: Product ${productId} does not belong to you`);
    }
    return productId;
  });

  await Promise.all(productPromises);

  // Delete all products
  const batch = firestore.batch();
  productIds.forEach((productId) => {
    const productRef = firestore.collection('products').doc(productId);
    batch.delete(productRef);
  });

  await batch.commit();

  revalidatePath('/seller/products');

  return { success: true, deletedCount: productIds.length };
}

/**
 * Bulk update stock
 */
export async function bulkUpdateStock(productIds: string[], stockValue: number, operation: 'set' | 'add' | 'subtract' = 'set') {
  const auth = await requireAuth();
  const userId = auth.uid;

  const firestore = getAdminFirestore();

  // Verify all products belong to the user
  const productPromises = productIds.map(async (productId: string) => {
    const productDoc = await firestore.collection('products').doc(productId).get();
    if (!productDoc.exists) {
      throw new Error(`Product ${productId} not found`);
    }
    const productData = productDoc.data();
    if (productData?.sellerId !== userId && !auth.isAdmin) {
      throw new Error(`Unauthorized: Product ${productId} does not belong to you`);
    }
    return { productId, currentStock: productData?.stock || 0 };
  });

  const products = await Promise.all(productPromises);

  // Perform bulk update
  const batch = firestore.batch();

  products.forEach(({ productId, currentStock }) => {
    const productRef = firestore.collection('products').doc(productId);
    let newStock: number;

    switch (operation) {
      case 'set':
        newStock = stockValue;
        break;
      case 'add':
        newStock = currentStock + stockValue;
        break;
      case 'subtract':
        newStock = Math.max(0, currentStock - stockValue);
        break;
      default:
        newStock = stockValue;
    }

    batch.update(productRef, {
      stock: newStock,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();

  revalidatePath('/seller/products');

  return { success: true, updatedCount: productIds.length };
}

