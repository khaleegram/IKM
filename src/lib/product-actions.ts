'use server';

import { z } from "zod";
import { getAdminFirestore, getAdminStorage } from "@/lib/firebase/admin";
import { FIREBASE_STORAGE_BUCKET } from "@/config/env";
import { revalidatePath } from "next/cache";
import { requireAuth, requireOwnerOrAdmin } from "@/lib/auth-utils";

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

const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string(),
    initialPrice: z.preprocess(
      (val) => (val === "" ? undefined : Number(val)),
      z.number().positive("Price must be a positive number")
    ),
    lastPrice: z.preprocess(
      (val) => (val === "" ? undefined : Number(val)),
      z.number().positive("Last price must be a positive number")
    ),
    stock: z.preprocess(
      (val) => (val === "" ? undefined : Number(val)),
      z.number().int().min(0, "Stock cannot be negative")
    ),
    category: z.string().optional(),
    image: z.instanceof(File).optional(),
    variants: z.preprocess(
      (val) => {
        if (!val || val === "") return undefined;
        try {
          return JSON.parse(val as string);
        } catch {
          return undefined;
        }
      },
      z.array(variantSchema).optional()
    ),
}).refine(data => data.lastPrice <= data.initialPrice, {
    message: "Lowest price cannot be greater than the initial price.",
    path: ["lastPrice"],
});

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
        rawData[key] = value;
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
        sellerId: userId,
        views: 0,
        salesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    
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
        initialPrice: dataToSave.initialPrice,
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

    const dataToUpdate: any = {
        name: productData.name,
        description: productData.description || '',
        price: productData.price,
        compareAtPrice: productData.compareAtPrice,
        stock: productData.stock || 0,
        sku: productData.sku || '',
        category: productData.category || '',
        status: productData.status || 'active',
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
     