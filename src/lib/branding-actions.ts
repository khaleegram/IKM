
'use server';

import { z } from "zod";
import { getAdminFirestore, getAdminStorage } from "@/lib/firebase/admin";
import { revalidatePath } from "next/cache";

const brandingSchema = z.object({
    logo: z.instanceof(File).optional(),
});

async function uploadLogo(file: File): Promise<string> {
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    
    const filePath = `branding_assets/logo_${Date.now()}`;
    const fileUpload = bucket.file(filePath);

    const buffer = Buffer.from(await file.arrayBuffer());

    await fileUpload.save(buffer, {
        metadata: {
            contentType: file.type,
        },
    });

    await fileUpload.makePublic();
    return fileUpload.publicUrl();
};


export async function updateBrandingSettings(data: FormData) {
    const rawData: Record<string, any> = {};
    data.forEach((value, key) => {
        rawData[key] = value;
    });

    const validation = brandingSchema.safeParse(rawData);

    if (!validation.success) {
        throw new Error(validation.error.errors.map(e => e.message).join(', '));
    }
    
    const { logo } = validation.data;
    
    if (!logo || logo.size === 0) {
        // Allow saving without a logo change, maybe for other fields in the future
        return { success: true, message: "No logo file provided; no changes made."};
    }
    
    const imageUrl = await uploadLogo(logo);
    
    const firestore = getAdminFirestore();
    const brandingRef = firestore.collection('settings').doc('branding');

    await brandingRef.set({
        logoUrl: imageUrl,
        updatedAt: new Date(),
    }, { merge: true });

    // Revalidate all paths to ensure the new logo is fetched everywhere
    revalidatePath('/', 'layout');

    return { success: true, logoUrl: imageUrl };
}
