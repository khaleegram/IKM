
'use server';

import { generateProductDescription as genProductDesc, type GenerateProductDescriptionInput } from "@/ai/flows/seller-product-description-assistance";
import { suggestStoreName as genStoreName, type SuggestStoreNameInput } from "@/ai/flows/store-name-assistance";
import { addProduct as addProd, updateProduct as updateProd, type Product } from "@/lib/firebase/firestore/products";
import { z } from "zod";

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
    imageUrl: z.string().optional(),
});

export async function addProduct(userId: string, data: FormData) {
    const rawData = Object.fromEntries(data.entries());
    const validation = productSchema.safeParse(rawData);

    if (!validation.success) {
        throw new Error(validation.error.errors.map(e => e.message).join(', '));
    }
    
    await addProd(userId, {
        ...validation.data,
        sellerId: userId,
    });
}

export async function updateProduct(productId: string, userId: string, data: FormData) {
    const rawData = Object.fromEntries(data.entries());
    const validation = productSchema.safeParse(rawData);

    if (!validation.success) {
        throw new Error(validation.error.errors.map(e => e.message).join(', '));
    }
    
    await updateProd(productId, userId, validation.data);
}
