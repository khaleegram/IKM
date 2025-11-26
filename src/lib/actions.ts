
'use server';

import { generateProductDescription as genProductDesc, type GenerateProductDescriptionInput } from "@/ai/flows/seller-product-description-assistance";
import { suggestStoreName as genStoreName, type SuggestStoreNameInput } from "@/ai/flows/store-name-assistance";
import { addProduct as addProd, updateProduct as updateProd } from "@/lib/firebase/firestore/products";
import { uploadImage } from "@/lib/firebase/storage";
import { z } from "zod";
import { getAdminFirestore } from '@/lib/firebase/admin';
import type { Product } from "@/lib/firebase/firestore/products";


// Server-side function for the WhatsApp Bot to search products
export async function searchProducts(searchTerm: string): Promise<Product[]> {
    const db = getAdminFirestore();
    const productsRef = db.collection('products');
    const snapshot = await productsRef.get();

    if (snapshot.empty) {
        return [];
    }

    const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

    const lowercasedTerm = searchTerm.toLowerCase();
    const filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(lowercasedTerm) || 
        (product.description && product.description.toLowerCase().includes(lowercasedTerm)) ||
        (product.category && product.category.toLowerCase().includes(lowercasedTerm))
    );

    return filteredProducts;
}


const productDescriptionSchema = z.object({
  productName: z.string(),
  productCategory: z.string(),
  keyFeatures: z.string(),
  targetAudience: z.string(),
});

export async function getProductDescription(input: GenerateProductDescriptionInput) {
  const parsedInput = productDescriptionSchema.parse(input);
  const result = await genProductDesc(parsedInput);
  return result.description;
}

const storeNameSchema = z.object({
  keywords: z.string(),
});

export async function suggestStoreName(input: SuggestStoreNameInput) {
    const parsedInput = storeNameSchema.parse(input);
    const result = await genStoreName(parsedInput);
    return result;
}


const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string(),
    price: z.preprocess(
      (val) => (val === "" ? undefined : Number(val)),
      z.number().positive("Price must be a positive number")
    ),
    stock: z.preprocess(
      (val) => (val === "" ? undefined : Number(val)),
      z.number().int().min(0, "Stock cannot be negative")
    ),
    category: z.string().optional(),
    image: z.instanceof(File).optional(),
});

export async function addProduct(userId: string, data: FormData) {
    const rawData = Object.fromEntries(data.entries());
    const validation = productSchema.safeParse(rawData);

    if (!validation.success) {
        throw new Error(validation.error.errors.map(e => e.message).join(', '));
    }
    
    let imageUrl: string | undefined = undefined;
    if (validation.data.image && validation.data.image.size > 0) {
        imageUrl = await uploadImage(userId, validation.data.image);
    }

    await addProd(userId, {
        ...validation.data,
        sellerId: userId,
        imageUrl: imageUrl,
    });
}

export async function updateProduct(productId: string, userId: string, data: FormData) {
    const rawData = Object.fromEntries(data.entries());
    const validation = productSchema.safeParse(rawData);

    if (!validation.success) {
        throw new Error(validation.error.errors.map(e => e.message).join(', '));
    }
    
    const { image, ...productData } = validation.data;
    let imageUrl: string | undefined = undefined;

    if (image && image.size > 0) {
        imageUrl = await uploadImage(userId, image);
    }

    await updateProd(productId, userId, {
        ...productData,
        ...(imageUrl && { imageUrl }),
    });
}

    