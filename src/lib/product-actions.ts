'use server';

import { z } from "zod";
import { getAdminFirestore, getAdminStorage } from "@/lib/firebase/admin";
import { revalidatePath } from "next/cache";

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

async function uploadImage(userId: string, file: File): Promise<string> {
    const storage = getAdminStorage();
    const bucket = storage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    
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


export async function addProduct(userId: string, data: FormData) {
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

    const dataToSave: any = {
        ...productData,
        sellerId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
    }

    if (imageUrl) {
        dataToSave.imageUrl = imageUrl;
    }

    await firestore.collection('products').add(dataToSave);

    revalidatePath('/seller/products');
}

export async function updateProduct(productId: string, userId: string, data: FormData) {
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

    const firestore = getAdminFirestore();
    const productRef = firestore.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists || productDoc.data()?.sellerId !== userId) {
        throw new Error("Product not found or permission denied");
    }

    if (image && image.size > 0) {
        imageUrl = await uploadImage(userId, image);
    }

    const dataToUpdate: any = {
        ...productData,
        updatedAt: new Date(),
    };

    if (imageUrl) {
        dataToUpdate.imageUrl = imageUrl;
    }


    await productRef.update(dataToUpdate);

    revalidatePath('/seller/products');
    revalidatePath(`/seller/products/edit/${productId}`);
}
    