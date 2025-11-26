
'use server';

import { generateProductDescription as genProductDesc, type GenerateProductDescriptionInput } from "@/ai/flows/seller-product-description-assistance";
import { suggestStoreName as genStoreName, type SuggestStoreNameInput } from "@/ai/flows/store-name-assistance";
import { addProduct as addProd, updateProduct as updateProd } from "@/lib/firebase/firestore/products";
import { uploadImage } from "@/lib/firebase/storage";
import { z } from "zod";
import { getAdminFirestore } from '@/lib/firebase/admin';
import type { Product } from "@/lib/firebase/firestore/products";
import { headers } from "next/headers";
import { serverTimestamp } from "firebase-admin/firestore";
import type { Order } from "./firebase/firestore/orders";


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
}).refine(data => data.lastPrice <= data.initialPrice, {
    message: "Lowest price cannot be greater than the initial price.",
    path: ["lastPrice"],
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

const verifyPaymentSchema = z.object({
  reference: z.string(),
  cartItems: z.any(),
  total: z.number(),
  deliveryAddress: z.string(),
  customerInfo: z.any(),
});

export async function verifyPaymentAndCreateOrder(data: unknown) {
  const validation = verifyPaymentSchema.safeParse(data);
   if (!validation.success) {
        throw new Error('Invalid payment verification data.');
    }
    const { reference, cartItems, total, deliveryAddress, customerInfo } = validation.data;
    
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
        },
    });

    const paystackResult = await response.json();

    if (!response.ok || !paystackResult.status || !paystackResult.data) {
         throw new Error(paystackResult.message || 'Paystack verification failed');
    }

    const { status, amount, currency } = paystackResult.data;

    if (status !== 'success' || amount / 100 !== total) {
        throw new Error('Transaction verification failed. Status or amount mismatch.');
    }

    const sellerId = cartItems[0].sellerId;
    const customerId = headers().get('X-User-UID'); 

    if (!customerId) {
        console.warn("X-User-UID header not found. Order will be created without a customerId.");
    }
    
    const orderData: Omit<Order, 'id' | 'createdAt'> = {
        customerId: customerId || "anonymous",
        sellerId: sellerId,
        items: cartItems.map(({ id, name, price, quantity }: any) => ({ id, name, price, quantity })),
        total: total,
        status: 'Processing',
        deliveryAddress: deliveryAddress,
        customerInfo: customerInfo,
    };

    const db = getAdminFirestore();
    const ordersCollectionRef = db.collection('orders');
    const orderRef = await ordersCollectionRef.add({
        ...orderData,
        createdAt: serverTimestamp(),
        paystackReference: reference,
    });

    return { success: true, orderId: orderRef.id };
}
    