'use server';

import { requireOwnerOrAdmin } from "@/lib/auth-utils";
import { getAdminFirestore, getAdminStorage } from "@/lib/firebase/admin";
import { FIREBASE_STORAGE_BUCKET } from "@/config/env";
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Upload artisan item photo
 */
async function uploadArtisanItemPhoto(storeId: string, itemId: string, file: File): Promise<string> {
    const storage = getAdminStorage();
    const bucket = storage.bucket(FIREBASE_STORAGE_BUCKET);
    
    const filePath = `artisan_items/${storeId}/${itemId}/${Date.now()}_${file.name}`;
    const fileUpload = bucket.file(filePath);

    const buffer = Buffer.from(await file.arrayBuffer());

    await fileUpload.save(buffer, {
        metadata: {
            contentType: file.type,
        },
    });

    await fileUpload.makePublic();
    return fileUpload.publicUrl();
}

/**
 * Upload artisan package photo
 */
async function uploadArtisanPackagePhoto(storeId: string, packageId: string, file: File): Promise<string> {
    const storage = getAdminStorage();
    const bucket = storage.bucket(FIREBASE_STORAGE_BUCKET);
    
    const filePath = `artisan_packages/${storeId}/${packageId}/${Date.now()}_${file.name}`;
    const fileUpload = bucket.file(filePath);

    const buffer = Buffer.from(await file.arrayBuffer());

    await fileUpload.save(buffer, {
        metadata: {
            contentType: file.type,
        },
    });

    await fileUpload.makePublic();
    return fileUpload.publicUrl();
}

// Schema for artisan item
const artisanItemSchema = z.object({
    name: z.string().min(1, "Item name is required"),
    price: z.number().positive("Price must be positive"),
    available: z.boolean().default(true),
    photo: z.instanceof(File).optional(),
});

// Schema for artisan package
const artisanPackageSchema = z.object({
    name: z.string().min(1, "Package name is required"),
    price: z.number().positive("Price must be positive"),
    itemIds: z.array(z.string()).min(1, "At least one item is required"),
    available: z.boolean().default(true),
    photo: z.instanceof(File).optional(),
});

/**
 * Add artisan item to store
 * Saves to subcollection: stores/{storeId}/items/{itemId}
 */
export async function addArtisanItem(userId: string, data: FormData) {
    // Authorization
    await requireOwnerOrAdmin(userId);

    const firestore = getAdminFirestore();
    
    // Verify store exists and is artisan type
    const storeRef = firestore.collection('stores').doc(userId);
    const storeDoc = await storeRef.get();
    
    if (!storeDoc.exists) {
        throw new Error('Store does not exist. Please complete onboarding first.');
    }
    
    const storeData = storeDoc.data();
    const storeType = storeData?.storeType || 'retail';
    
    if (storeType !== 'artisan') {
        throw new Error('This action is only available for artisan stores.');
    }

    // Parse form data
    const rawData: Record<string, any> = {};
    data.forEach((value, key) => {
        rawData[key] = value;
    });

    // Handle file separately
    const photoFile = data.get('photo') as File | null;
    if (photoFile && photoFile.size > 0) {
        rawData.photo = photoFile;
    }

    const validation = artisanItemSchema.safeParse({
        name: rawData.name,
        price: parseFloat(rawData.price || '0'),
        available: rawData.available === 'true' || rawData.available === true,
        photo: rawData.photo,
    });

    if (!validation.success) {
        throw new Error(validation.error.errors.map(e => e.message).join(', '));
    }

    const { name, price, available, photo } = validation.data;

    // Upload photo if provided
    let photoUrl = '';
    if (photo && photo.size > 0) {
        const itemId = `item_${Date.now()}`;
        photoUrl = await uploadArtisanItemPhoto(userId, itemId, photo);
    }

    // Add to subcollection
    const itemsRef = storeRef.collection('items');
    const itemData = {
        storeId: userId,
        name,
        price,
        photo: photoUrl,
        available,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    const itemDoc = await itemsRef.add(itemData);

    revalidatePath('/seller/products');
    revalidatePath(`/store/${userId}`);

    return { success: true, itemId: itemDoc.id };
}

/**
 * Update artisan item
 */
export async function updateArtisanItem(userId: string, itemId: string, data: FormData) {
    await requireOwnerOrAdmin(userId);

    const firestore = getAdminFirestore();
    const storeRef = firestore.collection('stores').doc(userId);
    const itemRef = storeRef.collection('items').doc(itemId);

    // Verify item exists
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
        throw new Error('Item not found');
    }

    // Parse form data
    const rawData: Record<string, any> = {};
    data.forEach((value, key) => {
        rawData[key] = value;
    });

    const photoFile = data.get('photo') as File | null;
    const updateData: any = {};

    if (rawData.name !== undefined) {
        updateData.name = rawData.name;
    }
    if (rawData.price !== undefined) {
        updateData.price = parseFloat(rawData.price);
    }
    if (rawData.available !== undefined) {
        updateData.available = rawData.available === 'true' || rawData.available === true;
    }
    if (photoFile && photoFile.size > 0) {
        updateData.photo = await uploadArtisanItemPhoto(userId, itemId, photoFile);
    }

    updateData.updatedAt = FieldValue.serverTimestamp();

    await itemRef.update(updateData);

    revalidatePath('/seller/products');
    revalidatePath(`/store/${userId}`);

    return { success: true };
}

/**
 * Delete artisan item
 */
export async function deleteArtisanItem(userId: string, itemId: string) {
    await requireOwnerOrAdmin(userId);

    const firestore = getAdminFirestore();
    const storeRef = firestore.collection('stores').doc(userId);
    const itemRef = storeRef.collection('items').doc(itemId);

    await itemRef.delete();

    revalidatePath('/seller/products');
    revalidatePath(`/store/${userId}`);

    return { success: true };
}

/**
 * Create artisan package
 * Saves to subcollection: stores/{storeId}/packages/{packageId}
 * SOFT VALIDATION: Checks itemIds exist, but does NOT invalidate package if items become unavailable later
 */
export async function createArtisanPackage(userId: string, data: FormData) {
    await requireOwnerOrAdmin(userId);

    const firestore = getAdminFirestore();
    
    // Verify store exists and is artisan type
    const storeRef = firestore.collection('stores').doc(userId);
    const storeDoc = await storeRef.get();
    
    if (!storeDoc.exists) {
        throw new Error('Store does not exist. Please complete onboarding first.');
    }
    
    const storeData = storeDoc.data();
    const storeType = storeData?.storeType || 'retail';
    
    if (storeType !== 'artisan') {
        throw new Error('This action is only available for artisan stores.');
    }

    // Parse form data
    const rawData: Record<string, any> = {};
    data.forEach((value, key) => {
        rawData[key] = value;
    });

    // Handle itemIds array
    const itemIds: string[] = [];
    if (rawData.itemIds) {
        if (Array.isArray(rawData.itemIds)) {
            itemIds.push(...rawData.itemIds);
        } else if (typeof rawData.itemIds === 'string') {
            // Try parsing as JSON array
            try {
                const parsed = JSON.parse(rawData.itemIds);
                if (Array.isArray(parsed)) {
                    itemIds.push(...parsed);
                } else {
                    itemIds.push(rawData.itemIds);
                }
            } catch {
                itemIds.push(rawData.itemIds);
            }
        }
    }

    const photoFile = data.get('photo') as File | null;
    if (photoFile && photoFile.size > 0) {
        rawData.photo = photoFile;
    }

    const validation = artisanPackageSchema.safeParse({
        name: rawData.name,
        price: parseFloat(rawData.price || '0'),
        itemIds,
        available: rawData.available === 'true' || rawData.available === true,
        photo: rawData.photo,
    });

    if (!validation.success) {
        throw new Error(validation.error.errors.map(e => e.message).join(', '));
    }

    const { name, price, itemIds: validatedItemIds, available, photo } = validation.data;

    // SOFT VALIDATION: Check itemIds exist (but don't block if they don't)
    const itemsRef = storeRef.collection('items');
    const itemsSnapshot = await itemsRef.get();
    const existingItemIds = itemsSnapshot.docs.map(doc => doc.id);
    const missingItemIds = validatedItemIds.filter(id => !existingItemIds.includes(id));
    
    if (missingItemIds.length > 0) {
        console.warn(`⚠️ Package "${name}" references non-existent items: ${missingItemIds.join(', ')}. Package will still be created.`);
        // Don't throw - soft validation allows this
    }

    // Upload photo if provided
    let photoUrl: string | undefined;
    if (photo && photo.size > 0) {
        const packageId = `package_${Date.now()}`;
        photoUrl = await uploadArtisanPackagePhoto(userId, packageId, photo);
    }

    // Add to subcollection
    const packagesRef = storeRef.collection('packages');
    const packageData = {
        storeId: userId,
        name,
        price,
        itemIds: validatedItemIds,
        available,
        ...(photoUrl && { photo: photoUrl }),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    const packageDoc = await packagesRef.add(packageData);

    revalidatePath('/seller/products');
    revalidatePath(`/store/${userId}`);

    return { success: true, packageId: packageDoc.id };
}

/**
 * Update artisan package
 */
export async function updateArtisanPackage(userId: string, packageId: string, data: FormData) {
    await requireOwnerOrAdmin(userId);

    const firestore = getAdminFirestore();
    const storeRef = firestore.collection('stores').doc(userId);
    const packageRef = storeRef.collection('packages').doc(packageId);

    // Verify package exists
    const packageDoc = await packageRef.get();
    if (!packageDoc.exists) {
        throw new Error('Package not found');
    }

    // Parse form data
    const rawData: Record<string, any> = {};
    data.forEach((value, key) => {
        rawData[key] = value;
    });

    const photoFile = data.get('photo') as File | null;
    const updateData: any = {};

    if (rawData.name !== undefined) {
        updateData.name = rawData.name;
    }
    if (rawData.price !== undefined) {
        updateData.price = parseFloat(rawData.price);
    }
    if (rawData.available !== undefined) {
        updateData.available = rawData.available === 'true' || rawData.available === true;
    }
    if (rawData.itemIds !== undefined) {
        let itemIds: string[] = [];
        if (Array.isArray(rawData.itemIds)) {
            itemIds = rawData.itemIds;
        } else if (typeof rawData.itemIds === 'string') {
            try {
                const parsed = JSON.parse(rawData.itemIds);
                itemIds = Array.isArray(parsed) ? parsed : [rawData.itemIds];
            } catch {
                itemIds = [rawData.itemIds];
            }
        }
        updateData.itemIds = itemIds;
    }
    if (photoFile && photoFile.size > 0) {
        updateData.photo = await uploadArtisanPackagePhoto(userId, packageId, photoFile);
    }

    updateData.updatedAt = FieldValue.serverTimestamp();

    await packageRef.update(updateData);

    revalidatePath('/seller/products');
    revalidatePath(`/store/${userId}`);

    return { success: true };
}

/**
 * Delete artisan package
 */
export async function deleteArtisanPackage(userId: string, packageId: string) {
    await requireOwnerOrAdmin(userId);

    const firestore = getAdminFirestore();
    const storeRef = firestore.collection('stores').doc(userId);
    const packageRef = storeRef.collection('packages').doc(packageId);

    await packageRef.delete();

    revalidatePath('/seller/products');
    revalidatePath(`/store/${userId}`);

    return { success: true };
}

