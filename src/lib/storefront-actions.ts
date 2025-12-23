'use server';

import { z } from "zod";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { revalidatePath } from "next/cache";
import { requireOwnerOrAdmin } from "@/lib/auth-utils";
import { FieldValue } from 'firebase-admin/firestore';

const storefrontSettingsSchema = z.object({
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format').optional(),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format').optional(),
  fontFamily: z.string().min(1, 'Font family is required').optional(),
  storeLayout: z.enum(['grid', 'list', 'masonry']).optional(),
  layout: z.enum(['grid', 'list', 'masonry']).optional(), // Alias for backward compatibility
});

/**
 * Update storefront design settings
 */
export async function updateStorefrontSettings(userId: string, data: unknown) {
  // Authorization
  await requireOwnerOrAdmin(userId);

  // Validation
  const validation = storefrontSettingsSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`);
  }

  const firestore = getAdminFirestore();
  const storeRef = firestore.collection('stores').doc(userId);

  // Check if store exists
  const storeDoc = await storeRef.get();
  if (!storeDoc.exists) {
    throw new Error('Store not found');
  }

  // Update storefront settings - only update fields that are provided
  const updateData: any = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (validation.data.primaryColor) {
    updateData.primaryColor = validation.data.primaryColor;
  }
  if (validation.data.secondaryColor) {
    updateData.secondaryColor = validation.data.secondaryColor;
  }
  if (validation.data.fontFamily) {
    updateData.fontFamily = validation.data.fontFamily;
  }
  if (validation.data.storeLayout) {
    updateData.storeLayout = validation.data.storeLayout;
  } else if (validation.data.layout) {
    updateData.storeLayout = validation.data.layout;
  }

  await storeRef.update(updateData);

  revalidatePath('/seller/storefront');
  revalidatePath('/seller/dashboard');
  revalidatePath(`/store/${userId}`); // Revalidate store page

  return { success: true };
}
