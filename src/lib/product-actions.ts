'use server';

import { z } from "zod";
import { getAdminFirestore, getAdminStorage } from "@/lib/firebase/admin";
import { FIREBASE_STORAGE_BUCKET } from "@/config/env";
import { revalidatePath } from "next/cache";
import { requireAuth, requireOwnerOrAdmin } from "@/lib/auth-utils";
import { getPublicShippingZones } from "./shipping-actions";

const variantOptionSchema = z.object({
  value: z.string().min(1, "Variant option value is required"),
  priceModifier: z.preprocess(
    (val) => (val === "" || val === undefined ? 0 : Number(val)),
    z.number().default(0)
  ).optional(),
  stock: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().int().min(0).optional()
  ),
  sku: z.string().optional(),
});

const variantSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  options: z.array(variantOptionSchema).min(1, "At least one variant option is required"),
});

// Helper function to safely convert string to number
const safeNumber = (val: any): number | undefined => {
  if (val === "" || val === undefined || val === null) {
    return undefined;
  }
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) {
    return undefined;
  }
  return num;
};

const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional().default(""),
    price: z.preprocess(
      safeNumber,
      z.number({ 
        required_error: "Price is required",
        invalid_type_error: "Price must be a valid number"
      }).positive("Price must be a positive number")
    ),
    compareAtPrice: z.preprocess(
      safeNumber,
      z.number().positive("Compare at price must be a positive number").optional()
    ),
    stock: z.preprocess(
      safeNumber,
      z.number({ 
        required_error: "Stock is required",
        invalid_type_error: "Stock must be a valid number"
      }).int("Stock must be a whole number").min(0, "Stock cannot be negative")
    ),
    sku: z.string().optional().default(""),
    category: z.string().optional().default(""),
    status: z.enum(['active', 'draft', 'inactive']).optional().default('draft'),
    allowShipping: z.preprocess(
      (val) => {
        if (val === undefined || val === null) return undefined;
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') {
          return val === 'true' || val === 'on';
        }
        return Boolean(val);
      },
      z.boolean().optional()
    ),
    image: z.instanceof(File).optional(),
    variants: z.preprocess(
      (val) => {
        if (!val || val === "") return undefined;
        try {
          const parsed = JSON.parse(val as string);
          return Array.isArray(parsed) ? parsed : undefined;
        } catch {
          return undefined;
        }
      },
      z.array(variantSchema).optional()
    ),
}).refine(
  (data) => {
    // If compareAtPrice is provided, it must be greater than price
    if (data.compareAtPrice !== undefined && data.price !== undefined) {
      return data.compareAtPrice > data.price;
    }
    return true;
  },
  {
    message: "Compare at price must be greater than the selling price.",
    path: ["compareAtPrice"],
  }
);

async function uploadImage(userId: string, file: File): Promise<string> {
    const storage = getAdminStorage();
    const bucket = storage.bucket(FIREBASE_STORAGE_BUCKET);
    
    const filePath = `product_images/${userId}/${Date.now()}_${file.name}`;
    const fileUpload = bucket.file(filePath);

    const buffer = Buffer.from(await file.arrayBuffer());

    await fileUpload.save(buffer, {
        metadata: {
            contentType: file.type,
        },
    });

    // Make the file public to get a public URL
    await fileUpload.makePublic();

    return fileUpload.publicUrl();
};


/**
 * Add product
 * Write Contract: 1. Input Validation, 2. Authorization, 3. Domain Logic, 4. Firestore Write
 */
export async function addProduct(userId: string, data: FormData) {
    // 2. Authorization Check - verify user is authenticated
    const auth = await requireAuth();
    if (auth.uid !== userId) {
        throw new Error('Forbidden: User ID mismatch');
    }

    // 1. Input Validation
    const rawData: Record<string, any> = {};
    data.forEach((value, key) => {
        // Parse JSON strings (like deliveryMethods)
        if (key === 'deliveryMethods' && typeof value === 'string') {
            try {
                rawData[key] = JSON.parse(value);
            } catch {
                rawData[key] = value;
            }
        } else {
            rawData[key] = value;
        }
    });

    const validation = productSchema.safeParse(rawData);

    if (!validation.success) {
        throw new Error(validation.error.errors.map(e => e.message).join(', '));
    }
    
    let imageUrl: string | undefined = undefined;
    if (validation.data.image && validation.data.image.size > 0) {
        imageUrl = await uploadImage(userId, validation.data.image);
    }
    
    const firestore = getAdminFirestore();
    const { image, ...productData } = validation.data;

    // Determine default allowShipping based on whether seller has shipping zones
    let allowShipping = productData.allowShipping;
    if (allowShipping === undefined) {
      // Check if seller has shipping zones
      const zones = await getPublicShippingZones(userId);
      allowShipping = zones.length > 0; // Default to true if zones exist, false otherwise
    }

    // Calculate price for display (use compareAtPrice if available, otherwise price)
    const displayPrice = productData.compareAtPrice || productData.price;
    
    const dataToSave: any = {
        name: productData.name,
        description: productData.description || '',
        price: productData.price,
        compareAtPrice: productData.compareAtPrice,
        stock: productData.stock || 0,
        sku: productData.sku || '',
        category: productData.category || '',
        status: productData.status || 'active',
        allowShipping: allowShipping,
        sellerId: userId,
        views: 0,
        salesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    // Add delivery settings if provided
    if (rawData.deliveryFeePaidBy) {
        dataToSave.deliveryFeePaidBy = rawData.deliveryFeePaidBy;
    }
    if (rawData.deliveryMethods) {
        dataToSave.deliveryMethods = rawData.deliveryMethods;
    }
    
    // Process variants - add IDs to each variant and option
    if (productData.variants && Array.isArray(productData.variants)) {
        dataToSave.variants = productData.variants.map((variant: any, idx: number) => ({
            id: `variant_${Date.now()}_${idx}`,
            name: variant.name,
            options: variant.options.map((opt: any, optIdx: number) => ({
                value: opt.value,
                priceModifier: opt.priceModifier || 0,
                stock: opt.stock,
                sku: opt.sku,
            })),
        }));
    }
    
    console.log('💾 Saving product:', {
        name: dataToSave.name,
        price: dataToSave.price,
        sellerId: dataToSave.sellerId,
        hasImage: !!imageUrl,
        hasVariants: !!(dataToSave.variants && dataToSave.variants.length > 0),
    });

    if (imageUrl) {
        dataToSave.imageUrl = imageUrl;
    }

    await firestore.collection('products').add(dataToSave);

    revalidatePath('/seller/products');
}

/**
 * Update product
 * Write Contract: 1. Input Validation, 2. Authorization, 3. Domain Logic, 4. Firestore Write
 */
export async function updateProduct(productId: string, userId: string, data: FormData) {
    // 1. Input Validation
    const rawData: Record<string, any> = {};
     data.forEach((value, key) => {
        rawData[key] = value;
    });
    
    const validation = productSchema.safeParse(rawData);

    if (!validation.success) {
        throw new Error(validation.error.errors.map(e => e.message).join(', '));
    }
    
    const { image, ...productData } = validation.data;
    let imageUrl: string | undefined = undefined;

    // 2. Authorization Check
    const firestore = getAdminFirestore();
    const productRef = firestore.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
        throw new Error("Product not found");
    }

    const product = productDoc.data() as { sellerId: string };
    if (!product || !product.sellerId) {
        throw new Error("Product data is invalid");
    }
    
    const auth = await requireOwnerOrAdmin(product.sellerId);

    // Prevent sellerId changes - productData doesn't include sellerId (it's not in schema)
    // But we check anyway to be safe
    const productDataAny = productData as any;
    if (productDataAny.sellerId && productDataAny.sellerId !== product.sellerId) {
        throw new Error("Cannot change product owner");
    }

    if (image && image.size > 0) {
        imageUrl = await uploadImage(userId, image);
    }

    // Determine allowShipping - use provided value or keep existing, or set default based on zones
    let allowShipping = productData.allowShipping;
    if (allowShipping === undefined) {
      // If not provided, check existing product or set default based on zones
      const existingProduct = productDoc.data() as { allowShipping?: boolean };
      if (existingProduct.allowShipping === undefined) {
        // No existing value, check if seller has shipping zones
        const zones = await getPublicShippingZones(product.sellerId);
        allowShipping = zones.length > 0;
      } else {
        // Keep existing value
        allowShipping = existingProduct.allowShipping;
      }
    }

    const dataToUpdate: any = {
        name: productData.name,
        description: productData.description || '',
        price: productData.price,
        compareAtPrice: productData.compareAtPrice,
        stock: productData.stock || 0,
        sku: productData.sku || '',
        category: productData.category || '',
        status: productData.status || 'active',
        allowShipping: allowShipping,
        updatedAt: new Date(),
    };

    if (imageUrl) {
        dataToUpdate.imageUrl = imageUrl;
    }


    await productRef.update(dataToUpdate);

    revalidatePath('/seller/products');
    revalidatePath(`/seller/products/edit/${productId}`);
}

/**
 * Duplicate product
 * Write Contract: 1. Authorization, 2. Domain Logic, 3. Firestore Write
 */
export async function duplicateProduct(productId: string, userId: string) {
    // 2. Authorization Check
    const auth = await requireAuth();
    if (auth.uid !== userId) {
        throw new Error('Forbidden: User ID mismatch');
    }

    const firestore = getAdminFirestore();
    const productRef = firestore.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
        throw new Error("Product not found");
    }

    const product = productDoc.data() as { sellerId: string };
    if (!product || !product.sellerId) {
        throw new Error("Product data is invalid");
    }

    // Verify ownership
    const authCheck = await requireOwnerOrAdmin(product.sellerId);
    if (authCheck.uid !== userId && !authCheck.isAdmin) {
        throw new Error("Forbidden: You can only duplicate your own products");
    }

    // 3. Domain Logic - Create a copy with "Copy of" prefix
    const productData = productDoc.data()!;
    const duplicatedData: any = {
        ...productData,
        name: `Copy of ${productData.name}`,
        sellerId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    // Remove id field if it exists
    delete duplicatedData.id;

    // 4. Firestore Write
    await firestore.collection('products').add(duplicatedData);

    revalidatePath('/seller/products');
}
     