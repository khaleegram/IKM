'use server';

import { z } from "zod";
import { getAdminFirestore, getAdminStorage } from "@/lib/firebase/admin";
import { FIREBASE_STORAGE_BUCKET } from "@/config/env";
import { revalidatePath } from "next/cache";
import { serializeFirestoreData } from "@/lib/firestore-serializer";
import { requireOwnerOrAdmin } from "@/lib/auth-utils";
import { FieldValue } from 'firebase-admin/firestore';
import { generateAvailableSubdomain } from './subdomain-actions';

/**
 * Initialize or get store for a user
 * Creates an empty store document if one doesn't exist
 * This is called automatically when needed
 */
export async function initializeStore(userId: string) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const firestore = getAdminFirestore();
  
  // Use userId as document ID for direct access
  const storeRef = firestore.collection('stores').doc(userId);
  
  // Check if store already exists
  const storeDoc = await storeRef.get();
  
  if (storeDoc.exists) {
    // Store exists, return it
    const storeData = storeDoc.data();
    const serializedData = serializeFirestoreData(storeData);
    return { 
      success: true, 
      storeId: userId, 
      alreadyExists: true,
      data: serializedData
    };
  }
  
  // Create new empty store using userId as document ID
  const defaultStoreName = 'My Store';
  
  // Generate subdomain from store name
  const subdomain = await generateAvailableSubdomain(defaultStoreName, userId);
  
  const storeData = {
    userId,
    storeName: defaultStoreName,
    subdomain, // Auto-generated subdomain
    onboardingCompleted: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  
  await storeRef.set(storeData);
  
  console.log(`✨ Store initialized for userId: ${userId} (using userId as document ID)`);
  
  revalidatePath('/seller/dashboard');
  revalidatePath('/seller/onboarding');
  
  // Serialize Firestore data before returning
  const serializedData = serializeFirestoreData(storeData);
  
  return { 
    success: true, 
    storeId: userId, 
    alreadyExists: false,
    data: serializedData
  };
}

/**
 * Upload store logo
 */
async function uploadStoreLogo(userId: string, file: File): Promise<string> {
    const storage = getAdminStorage();
    const bucket = storage.bucket(FIREBASE_STORAGE_BUCKET);
    
    const filePath = `store_logos/${userId}/${Date.now()}_${file.name}`;
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
 * Upload store banner
 */
async function uploadStoreBanner(userId: string, file: File): Promise<string> {
    const storage = getAdminStorage();
    const bucket = storage.bucket(FIREBASE_STORAGE_BUCKET);
    
    const filePath = `store_banners/${userId}/${Date.now()}_${file.name}`;
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

// Schema for full store setup (onboarding)
const storeSetupSchema = z.object({
    storeName: z.string().min(1, "Store name is required"),
    storeDescription: z.string().min(10, "Store description must be at least 10 characters"),
    storeLogo: z.instanceof(File).optional(),
    storeBanner: z.instanceof(File).optional(),
    state: z.string().min(1, "State is required"),
    lga: z.string().min(1, "LGA is required"),
    city: z.string().min(1, "City is required"),
    address: z.string().optional(),
    businessType: z.string().min(1, "Business type is required"),
    shippingPolicy: z.string().optional(),
    returnsPolicy: z.string().optional(),
    refundsPolicy: z.string().optional(),
    privacyPolicy: z.string().optional(),
});

// Schema for partial updates (settings)
// Accepts optional strings - empty strings are treated as "not provided"
const storeUpdateSchema = z.object({
    storeName: z.string().optional(),
    storeDescription: z.string().optional(),
    storeLogo: z.instanceof(File).optional(),
    storeBanner: z.instanceof(File).optional(),
    state: z.string().optional(),
    lga: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    businessType: z.string().optional(),
    shippingPolicy: z.string().optional(),
    returnsPolicy: z.string().optional(),
    refundsPolicy: z.string().optional(),
    privacyPolicy: z.string().optional(),
    // Social media links
    facebookUrl: z.string().url().optional().or(z.literal('')),
    instagramUrl: z.string().url().optional().or(z.literal('')),
    twitterUrl: z.string().url().optional().or(z.literal('')),
    tiktokUrl: z.string().url().optional().or(z.literal('')),
    // Store hours
    storeHours: z.object({
        monday: z.string().optional(),
        tuesday: z.string().optional(),
        wednesday: z.string().optional(),
        thursday: z.string().optional(),
        friday: z.string().optional(),
        saturday: z.string().optional(),
        sunday: z.string().optional(),
    }).optional(),
    // Contact info
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
    // Store theme
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    fontFamily: z.string().optional(),
    // SEO settings
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    metaKeywords: z.string().optional(),
});

/**
 * Complete store setup/onboarding (full setup)
 * Write Contract: 1. Input Validation, 2. Authorization, 3. Domain Logic, 4. Firestore Write
 */
export async function completeStoreSetup(userId: string, data: FormData) {
    // 2. Authorization Check (must be first to prevent unauthorized access)
    const auth = await requireOwnerOrAdmin(userId);

    // 1. Input Validation
    const rawData: Record<string, any> = {};
    data.forEach((value, key) => {
        rawData[key] = value;
    });

    const validation = storeSetupSchema.safeParse(rawData);

    if (!validation.success) {
        throw new Error(validation.error.errors.map(e => e.message).join(', '));
    }

    const { 
        storeName, 
        storeDescription, 
        storeLogo, 
        storeBanner,
        state,
        lga,
        city,
        address,
        businessType,
        shippingPolicy,
        returnsPolicy,
        refundsPolicy,
        privacyPolicy
    } = validation.data;

    // Generate or update subdomain if store name changed or subdomain doesn't exist
    let subdomain = existingData.subdomain;
    if (!subdomain || (existingData.storeName !== storeName && storeName.trim().length > 0)) {
      subdomain = await generateAvailableSubdomain(storeName, userId);
    }

    const firestore = getAdminFirestore();
    
    // Use userId as document ID for direct access
    const storeRef = firestore.collection('stores').doc(userId);
    
    // Check if store exists
    const storeDoc = await storeRef.get();
    let existingData: any = {};
    
    if (storeDoc.exists) {
        // Store exists, update it
        existingData = storeDoc.data() || {};
        console.log('📝 Updating existing store:', userId);
    } else {
        // Create new store document
        console.log('✨ Creating new store:', userId);
    }

    // Upload images if provided
    let storeLogoUrl: string | undefined = existingData.storeLogoUrl;
    let storeBannerUrl: string | undefined = existingData.storeBannerUrl;

    if (storeLogo && storeLogo.size > 0) {
        storeLogoUrl = await uploadStoreLogo(userId, storeLogo);
    }

    if (storeBanner && storeBanner.size > 0) {
        storeBannerUrl = await uploadStoreBanner(userId, storeBanner);
    }

    // Prepare store data
    const hasRequiredFields = 
        storeName.trim().length > 0 &&
        storeDescription.trim().length >= 10 &&
        state && lga && city.trim().length > 0 &&
        businessType.trim().length > 0;

    const storeData: any = {
        userId, // Link to user
        storeName,
        storeDescription,
        subdomain, // Auto-generated or existing subdomain
        storeLocation: {
            state,
            lga,
            city,
            ...(address && { address }),
        },
        businessType,
        onboardingCompleted: hasRequiredFields,
        ...(storeLogoUrl && { storeLogoUrl }),
        ...(storeBannerUrl && { storeBannerUrl }),
    };

    // Add policies if provided
    if (shippingPolicy || returnsPolicy || refundsPolicy || privacyPolicy) {
        storeData.storePolicies = {
            ...(existingData.storePolicies || {}), // Preserve existing policies
            ...(shippingPolicy && { shipping: shippingPolicy }),
            ...(returnsPolicy && { returns: returnsPolicy }),
            ...(refundsPolicy && { refunds: refundsPolicy }),
            ...(privacyPolicy && { privacy: privacyPolicy }),
        };
    }

    // Add timestamps
    if (!existingData.createdAt) {
        storeData.createdAt = new Date();
    }
    storeData.updatedAt = new Date();

    // Log what we're about to save
    console.log('💾 Saving store setup data:', {
        storeName,
        hasDescription: storeDescription.length >= 10,
        location: { state, lga, city, address },
        businessType,
        hasLogo: !!storeLogoUrl,
        hasBanner: !!storeBannerUrl,
    });

    // Use set with merge: true to ensure document exists and update
    await storeRef.set(storeData, { merge: true });
    console.log(`💾 Store saved to document: stores/${userId}`);

    // Verify the data was saved by reading it back
    const savedDoc = await storeRef.get();
    if (!savedDoc.exists) {
        console.error(`❌ Store document does not exist after save at: stores/${userId}`);
        throw new Error('Failed to save store setup data - document does not exist after save');
    }

    const savedData = savedDoc.data();
    console.log('✅ Store setup saved and verified:', {
        documentId: savedDoc.id,
        documentPath: `stores/${userId}`,
        storeName: savedData?.storeName,
        storeDescription: savedData?.storeDescription?.substring(0, 50) + '...',
        location: savedData?.storeLocation,
        businessType: savedData?.businessType,
        hasLogo: !!savedData?.storeLogoUrl,
        hasBanner: !!savedData?.storeBannerUrl,
        onboardingCompleted: savedData?.onboardingCompleted,
    });

    revalidatePath('/seller/dashboard');
    revalidatePath('/seller/settings');
    revalidatePath('/stores');

    // Serialize Firestore data before returning (convert Timestamps to strings)
    const serializedData = serializeFirestoreData(savedData);

    return { success: true, data: serializedData };
}

/**
 * Update store settings (partial update from settings page)
 * Write Contract: 1. Input Validation, 2. Authorization, 3. Domain Logic, 4. Firestore Write
 */
export async function updateStoreSettings(userId: string, data: FormData) {
    // 2. Authorization Check
    const auth = await requireOwnerOrAdmin(userId);

    // 1. Input Validation
    const rawData: Record<string, any> = {};
    data.forEach((value, key) => {
        // Convert empty strings to undefined for optional fields
        rawData[key] = value === '' ? undefined : value;
    });

    // Handle storeHours nested object
    if (rawData['storeHours[monday]'] !== undefined) {
        rawData.storeHours = {
            monday: rawData['storeHours[monday]'] || undefined,
            tuesday: rawData['storeHours[tuesday]'] || undefined,
            wednesday: rawData['storeHours[wednesday]'] || undefined,
            thursday: rawData['storeHours[thursday]'] || undefined,
            friday: rawData['storeHours[friday]'] || undefined,
            saturday: rawData['storeHours[saturday]'] || undefined,
            sunday: rawData['storeHours[sunday]'] || undefined,
        };
        // Remove the individual keys
        ['storeHours[monday]', 'storeHours[tuesday]', 'storeHours[wednesday]', 'storeHours[thursday]', 'storeHours[friday]', 'storeHours[saturday]', 'storeHours[sunday]'].forEach(key => {
            delete rawData[key];
        });
    }

    const validation = storeUpdateSchema.safeParse(rawData);

    if (!validation.success) {
        const errors = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const firestore = getAdminFirestore();
    
    // Find store by userId
    const storesQuery = await firestore.collection('stores')
        .where('userId', '==', userId)
        .limit(1)
        .get();
    
    if (storesQuery.empty) {
        throw new Error('Store does not exist. Please complete onboarding first.');
    }
    
    const storeRef = storesQuery.docs[0].ref;
    const existingData = storesQuery.docs[0].data() || {};

    // Upload images if provided
    let storeLogoUrl: string | undefined = existingData.storeLogoUrl;
    let storeBannerUrl: string | undefined = existingData.storeBannerUrl;

    if (validation.data.storeLogo && validation.data.storeLogo.size > 0) {
        storeLogoUrl = await uploadStoreLogo(userId, validation.data.storeLogo);
    }

    if (validation.data.storeBanner && validation.data.storeBanner.size > 0) {
        storeBannerUrl = await uploadStoreBanner(userId, validation.data.storeBanner);
    }

    // Build update data - only update provided fields
    const updateData: any = {};

    if (validation.data.storeName !== undefined && validation.data.storeName !== '') {
        updateData.storeName = validation.data.storeName.trim();
    }
    if (validation.data.storeDescription !== undefined && validation.data.storeDescription !== '') {
        if (validation.data.storeDescription.trim().length < 10) {
            throw new Error('Store description must be at least 10 characters');
        }
        updateData.storeDescription = validation.data.storeDescription.trim();
    }
    if (storeLogoUrl) {
        updateData.storeLogoUrl = storeLogoUrl;
    }
    if (storeBannerUrl) {
        updateData.storeBannerUrl = storeBannerUrl;
    }

    // Update location if any location field is provided
    if (validation.data.state !== undefined || validation.data.lga !== undefined || 
        validation.data.city !== undefined || validation.data.address !== undefined) {
        updateData.storeLocation = {
            ...(existingData.storeLocation || {}),
            ...(validation.data.state && validation.data.state !== '' && { state: validation.data.state.trim() }),
            ...(validation.data.lga && validation.data.lga !== '' && { lga: validation.data.lga.trim() }),
            ...(validation.data.city && validation.data.city !== '' && { city: validation.data.city.trim() }),
            ...(validation.data.address !== undefined && { address: validation.data.address?.trim() || '' }),
        };
    }

    if (validation.data.businessType !== undefined && validation.data.businessType !== '') {
        updateData.businessType = validation.data.businessType.trim();
    }

    // Update policies if any policy field is provided
    if (validation.data.shippingPolicy !== undefined || 
        validation.data.returnsPolicy !== undefined || 
        validation.data.refundsPolicy !== undefined || 
        validation.data.privacyPolicy !== undefined) {
        updateData.storePolicies = {
            ...(existingData.storePolicies || {}),
            ...(validation.data.shippingPolicy !== undefined && { shipping: validation.data.shippingPolicy }),
            ...(validation.data.returnsPolicy !== undefined && { returns: validation.data.returnsPolicy }),
            ...(validation.data.refundsPolicy !== undefined && { refunds: validation.data.refundsPolicy }),
            ...(validation.data.privacyPolicy !== undefined && { privacy: validation.data.privacyPolicy }),
        };
    }

    // Update social media links
    if (validation.data.facebookUrl !== undefined) {
        updateData.facebookUrl = validation.data.facebookUrl || null;
    }
    if (validation.data.instagramUrl !== undefined) {
        updateData.instagramUrl = validation.data.instagramUrl || null;
    }
    if (validation.data.twitterUrl !== undefined) {
        updateData.twitterUrl = validation.data.twitterUrl || null;
    }
    if (validation.data.tiktokUrl !== undefined) {
        updateData.tiktokUrl = validation.data.tiktokUrl || null;
    }

    // Update store hours
    if (validation.data.storeHours !== undefined) {
        updateData.storeHours = {
            ...(existingData.storeHours || {}),
            ...validation.data.storeHours,
        };
    }

    // Update contact info
    if (validation.data.email !== undefined) {
        updateData.email = validation.data.email || null;
    }
    if (validation.data.phone !== undefined) {
        updateData.phone = validation.data.phone || null;
    }
    if (validation.data.website !== undefined) {
        updateData.website = validation.data.website || null;
    }

    // Update store theme
    if (validation.data.primaryColor !== undefined) {
        updateData.primaryColor = validation.data.primaryColor || null;
    }
    if (validation.data.secondaryColor !== undefined) {
        updateData.secondaryColor = validation.data.secondaryColor || null;
    }
    if (validation.data.fontFamily !== undefined) {
        updateData.fontFamily = validation.data.fontFamily || null;
    }

    // Update SEO settings
    if (validation.data.metaTitle !== undefined) {
        updateData.metaTitle = validation.data.metaTitle || null;
    }
    if (validation.data.metaDescription !== undefined) {
        updateData.metaDescription = validation.data.metaDescription || null;
    }
    if (validation.data.metaKeywords !== undefined) {
        updateData.metaKeywords = validation.data.metaKeywords || null;
    }

    // Recalculate onboardingCompleted based on required fields
    const hasRequiredFields = 
        (updateData.storeName || existingData.storeName) &&
        (updateData.storeDescription || existingData.storeDescription) &&
        (updateData.storeLocation?.state || existingData.storeLocation?.state) &&
        (updateData.storeLocation?.lga || existingData.storeLocation?.lga) &&
        (updateData.storeLocation?.city || existingData.storeLocation?.city) &&
        (updateData.businessType || existingData.businessType);

    if (hasRequiredFields) {
        updateData.onboardingCompleted = true;
    }

    // Log what we're updating
    console.log('💾 Updating store settings:', Object.keys(updateData));

    // Use update to only modify provided fields
    if (Object.keys(updateData).length === 0) {
        throw new Error('No fields to update');
    }

    await storeRef.update(updateData);

    // Verify the update
    const updatedDoc = await storeRef.get();
    if (!updatedDoc.exists) {
        throw new Error('Failed to verify update - document not found');
    }

    const updatedData = updatedDoc.data();
    console.log('✅ Store settings updated successfully:', {
        storeName: updatedData?.storeName,
        hasDescription: !!updatedData?.storeDescription,
        hasLocation: !!updatedData?.storeLocation,
        hasBusinessType: !!updatedData?.businessType,
    });

    revalidatePath('/seller/dashboard');
    revalidatePath('/seller/settings');
    revalidatePath('/stores');

    // Don't return data - just return success
    // The client will refetch via real-time listener
    return { success: true };
}
