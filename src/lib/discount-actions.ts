'use server';

import { z } from "zod";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";
import { FieldValue } from 'firebase-admin/firestore';

const discountCodeSchema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z0-9]+$/, 'Code must be uppercase alphanumeric'),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0),
  maxUses: z.number().min(1).optional(),
  minOrderAmount: z.number().min(0).optional(),
  validFrom: z.date().optional(),
  validUntil: z.date().optional(),
  sellerId: z.string(),
});

const applyDiscountSchema = z.object({
  code: z.string(),
  orderTotal: z.number(),
  sellerId: z.string(),
});

export interface DiscountCode {
  id?: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  uses: number;
  maxUses?: number;
  minOrderAmount?: number;
  validFrom?: any;
  validUntil?: any;
  sellerId: string;
  status: 'active' | 'inactive' | 'expired';
  createdAt: any;
  updatedAt: any;
}

/**
 * Create a discount code
 */
export async function createDiscountCode(data: unknown) {
  const auth = await requireAuth();
  const validation = discountCodeSchema.safeParse(data);
  
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`);
  }

  const { sellerId, ...discountData } = validation.data;

  // Verify seller owns this discount code
  if (auth.uid !== sellerId && !auth.isAdmin) {
    throw new Error('Unauthorized: You can only create discount codes for your own store');
  }

  const firestore = getAdminFirestore();
  const discountRef = firestore.collection('discount_codes').doc();

  // Check if code already exists
  const existingCodeQuery = await firestore
    .collection('discount_codes')
    .where('code', '==', discountData.code.toUpperCase())
    .where('sellerId', '==', sellerId)
    .limit(1)
    .get();

  if (!existingCodeQuery.empty) {
    throw new Error('Discount code already exists');
  }

  const discountCodeData = {
    ...discountData,
    code: discountData.code.toUpperCase(),
    sellerId,
    uses: 0,
    status: 'active',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await discountRef.set(discountCodeData);

  revalidatePath('/seller/marketing');
  return { success: true, discountCodeId: discountRef.id };
}

/**
 * Apply discount code to an order
 */
export async function applyDiscountCode(data: unknown) {
  const validation = applyDiscountSchema.safeParse(data);
  
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`);
  }

  const { code, orderTotal, sellerId } = validation.data;
  const firestore = getAdminFirestore();

  // Find discount code
  const discountQuery = await firestore
    .collection('discount_codes')
    .where('code', '==', code.toUpperCase())
    .where('sellerId', '==', sellerId)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (discountQuery.empty) {
    throw new Error('Invalid or expired discount code');
  }

  const discountDoc = discountQuery.docs[0];
  const discount = discountDoc.data() as DiscountCode;

  // Check validity dates
  const now = new Date();
  if (discount.validFrom) {
    const validFrom = discount.validFrom.toDate ? discount.validFrom.toDate() : new Date(discount.validFrom);
    if (now < validFrom) {
      throw new Error('Discount code is not yet valid');
    }
  }
  if (discount.validUntil) {
    const validUntil = discount.validUntil.toDate ? discount.validUntil.toDate() : new Date(discount.validUntil);
    if (now > validUntil) {
      throw new Error('Discount code has expired');
    }
  }

  // Check max uses
  if (discount.maxUses && discount.uses >= discount.maxUses) {
    throw new Error('Discount code has reached maximum uses');
  }

  // Check minimum order amount
  if (discount.minOrderAmount && orderTotal < discount.minOrderAmount) {
    throw new Error(`Minimum order amount of ₦${discount.minOrderAmount.toLocaleString()} required`);
  }

  // Calculate discount
  let discountAmount = 0;
  if (discount.type === 'percentage') {
    discountAmount = (orderTotal * discount.value) / 100;
  } else {
    discountAmount = Math.min(discount.value, orderTotal); // Can't discount more than order total
  }

  return {
    success: true,
    discountAmount,
    finalTotal: orderTotal - discountAmount,
    discountCode: discount.code,
  };
}

/**
 * Get discount codes for a seller
 */
export async function getDiscountCodes(sellerId: string) {
  const auth = await requireAuth();
  
  if (auth.uid !== sellerId && !auth.isAdmin) {
    throw new Error('Unauthorized');
  }

  const firestore = getAdminFirestore();
  const discountQuery = await firestore
    .collection('discount_codes')
    .where('sellerId', '==', sellerId)
    .orderBy('createdAt', 'desc')
    .get();

  return discountQuery.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Update discount code usage (called when order is created)
 */
export async function incrementDiscountCodeUsage(code: string, sellerId: string) {
  const firestore = getAdminFirestore();
  const discountQuery = await firestore
    .collection('discount_codes')
    .where('code', '==', code.toUpperCase())
    .where('sellerId', '==', sellerId)
    .limit(1)
    .get();

  if (!discountQuery.empty) {
    const discountRef = discountQuery.docs[0].ref;
    await discountRef.update({
      uses: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

