'use server';

import { requireAuth } from '@/lib/auth-utils';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateProductShareLink, updateProductShareInfo } from './product-share-actions';

// Northern product schema with all category-specific fields
const northernProductSchema = z.object({
  // Core fields
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  compareAtPrice: z.number().positive().optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  category: z.enum([
    'fragrance',
    'fashion',
    'snacks',
    'materials',
    'skincare',
    'haircare',
    'islamic',
    'electronics'
  ]),
  status: z.enum(['active', 'draft', 'inactive']).default('draft'),
  
  // Media
  imageUrls: z.array(z.string()).optional(),
  videoUrl: z.string().optional(),
  audioDescription: z.string().optional(),
  
  // Fragrance fields
  volume: z.string().optional(),
  fragranceType: z.string().optional(),
  container: z.string().optional(),
  
  // Fashion fields
  sizeType: z.string().optional(),
  abayaLength: z.string().optional(),
  standardSize: z.string().optional(),
  setIncludes: z.string().optional(),
  material: z.string().optional(),
  
  // Snacks fields
  packaging: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  taste: z.string().optional(),
  
  // Materials fields
  materialType: z.string().optional(),
  fabricLength: z.string().optional(),
  quality: z.string().optional(),
  customMaterialType: z.string().optional(),
  
  // Skincare fields
  skincareBrand: z.string().optional(),
  skincareType: z.string().optional(),
  skincareSize: z.string().optional(),
  
  // Haircare fields
  haircareType: z.string().optional(),
  haircareBrand: z.string().optional(),
  haircareSize: z.string().optional(),
  haircarePackageItems: z.array(z.string()).optional(),
  
  // Islamic fields
  islamicType: z.string().optional(),
  islamicSize: z.string().optional(),
  islamicMaterial: z.string().optional(),
  
  // Electronics fields
  brand: z.string().optional(),
  model: z.string().optional(),
  
  // Delivery settings
  deliveryFeePaidBy: z.enum(['seller', 'buyer']).optional(),
  deliveryMethods: z.object({
    localDispatch: z.object({
      enabled: z.boolean(),
    }).optional(),
    waybill: z.object({
      enabled: z.boolean(),
    }).optional(),
    pickup: z.object({
      enabled: z.boolean(),
      landmark: z.string().optional(),
    }).optional(),
  }).optional(),
}).superRefine((data, ctx) => {
    // Category-specific validation with detailed error messages
    if (data.category === 'fragrance') {
      if (!data.volume) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['volume'],
          message: 'Volume is required for Fragrance products',
        });
      }
      if (!data.fragranceType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fragranceType'],
          message: 'Fragrance Type is required for Fragrance products',
        });
      }
      if (!data.container) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['container'],
          message: 'Container is required for Fragrance products',
        });
      }
    }
    if (data.category === 'fashion') {
      if (!data.sizeType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sizeType'],
          message: 'Size Type is required for Fashion products',
        });
      }
      if (!data.setIncludes) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['setIncludes'],
          message: 'Set Includes is required for Fashion products',
        });
      }
      if (!data.material) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['material'],
          message: 'Material is required for Fashion products',
        });
      }
    }
    if (data.category === 'snacks') {
      if (!data.packaging) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['packaging'],
          message: 'Packaging is required for Snacks products',
        });
      }
      if (!data.quantity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['quantity'],
          message: 'Quantity is required for Snacks products',
        });
      }
      if (!data.taste) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['taste'],
          message: 'Taste is required for Snacks products',
        });
      }
    }
    if (data.category === 'materials') {
      if (!data.materialType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['materialType'],
          message: 'Material Type is required for Materials products',
        });
      }
      if (!data.fabricLength) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fabricLength'],
          message: 'Fabric Length is required for Materials products',
        });
      }
      if (!data.quality) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['quality'],
          message: 'Quality is required for Materials products',
        });
      }
      if (data.materialType === 'custom' && !data.customMaterialType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customMaterialType'],
          message: 'Custom Material Type is required when Material Type is "Custom"',
        });
      }
    }
    if (data.category === 'haircare') {
      if (!data.haircareType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['haircareType'],
          message: 'Product Type is required for Hair Care products',
        });
      }
      if (data.haircareType === 'package-deal') {
        if (!data.haircarePackageItems || data.haircarePackageItems.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['haircarePackageItems'],
            message: 'Please select at least one item for Package Deal products',
          });
        }
      }
    }
    if (data.category === 'skincare') {
      if (!data.skincareType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['skincareType'],
          message: 'Product Type is required for Skincare products',
        });
      }
      if (!data.skincareSize) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['skincareSize'],
          message: 'Size is required for Skincare products',
        });
      }
    }
    if (data.category === 'islamic') {
      if (!data.islamicType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['islamicType'],
          message: 'Product Type is required for Islamic Products',
        });
      }
      if (!data.islamicSize) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['islamicSize'],
          message: 'Size is required for Islamic Products',
        });
      }
      if (!data.islamicMaterial) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['islamicMaterial'],
          message: 'Material is required for Islamic Products',
        });
      }
    }
    if (data.category === 'electronics') {
      if (!data.brand) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['brand'],
          message: 'Brand is required for Electronics products',
        });
      }
      if (!data.model) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['model'],
          message: 'Model is required for Electronics products',
        });
      }
    }
  });

/**
 * Create a Northern product with all category-specific fields
 */
export async function createNorthernProduct(data: unknown) {
  const auth = await requireAuth();
  
  const validation = northernProductSchema.safeParse(data);
  if (!validation.success) {
    // Collect all error messages with field names for better UX
    const errorMessages = validation.error.errors.map(e => {
      const fieldName = e.path.length > 0 ? e.path.join('.') : 'form';
      return `${fieldName}: ${e.message}`;
    });
    // Format error messages for better readability
    const errorMessage = errorMessages.length > 0 
      ? `Missing required fields: ${errorMessages.map(e => e.split(': ')[1] || e).join(', ')}`
      : 'Please fill in all required fields for this category';
    throw new Error(errorMessage);
  }
  
  const firestore = getAdminFirestore();
  const productData = validation.data;
  
  // Prepare product document
  const productDoc: any = {
    name: productData.name,
    description: productData.description || '',
    price: productData.price,
    compareAtPrice: productData.compareAtPrice,
    stock: productData.stock,
    category: productData.category,
    status: productData.status,
    sellerId: auth.uid,
    views: 0,
    salesCount: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  
  // Add media
  if (productData.imageUrls && productData.imageUrls.length > 0) {
    productDoc.imageUrls = productData.imageUrls;
    productDoc.imageUrl = productData.imageUrls[0]; // Legacy field
  }
  if (productData.videoUrl) {
    productDoc.videoUrl = productData.videoUrl;
  }
  if (productData.audioDescription) {
    productDoc.audioDescription = productData.audioDescription;
  }
  
  // Add category-specific fields
  if (productData.category === 'fragrance') {
    productDoc.volume = productData.volume;
    productDoc.fragranceType = productData.fragranceType;
    productDoc.container = productData.container;
  }
  
  if (productData.category === 'fashion') {
    productDoc.sizeType = productData.sizeType;
    productDoc.abayaLength = productData.abayaLength;
    productDoc.standardSize = productData.standardSize;
    productDoc.setIncludes = productData.setIncludes;
    productDoc.material = productData.material;
  }
  
  if (productData.category === 'snacks') {
    productDoc.packaging = productData.packaging;
    productDoc.quantity = productData.quantity;
    productDoc.taste = productData.taste;
  }
  
  if (productData.category === 'materials') {
    productDoc.materialType = productData.materialType;
    productDoc.fabricLength = productData.fabricLength;
    productDoc.quality = productData.quality;
    if (productData.customMaterialType) {
      productDoc.customMaterialType = productData.customMaterialType;
    }
  }
  
  if (productData.category === 'skincare') {
    productDoc.skincareBrand = productData.skincareBrand;
    productDoc.skincareType = productData.skincareType;
    productDoc.skincareSize = productData.skincareSize;
  }
  
  if (productData.category === 'haircare') {
    productDoc.haircareType = productData.haircareType;
    productDoc.haircareBrand = productData.haircareBrand;
    productDoc.haircareSize = productData.haircareSize;
    if (productData.haircarePackageItems) {
      productDoc.haircarePackageItems = productData.haircarePackageItems;
    }
  }
  
  if (productData.category === 'islamic') {
    productDoc.islamicType = productData.islamicType;
    productDoc.islamicSize = productData.islamicSize;
    productDoc.islamicMaterial = productData.islamicMaterial;
  }
  
  if (productData.category === 'electronics') {
    productDoc.brand = productData.brand;
    productDoc.model = productData.model;
  }
  
  // Add delivery settings
  if (productData.deliveryFeePaidBy) {
    productDoc.deliveryFeePaidBy = productData.deliveryFeePaidBy;
  }
  if (productData.deliveryMethods) {
    productDoc.deliveryMethods = productData.deliveryMethods;
  }
  
  // Create product
  const productRef = await firestore.collection('products').add(productDoc);
  
  // Generate share link
  const shareLink = await generateProductShareLink(productRef.id);
  await updateProductShareInfo(productRef.id, shareLink);
  
  revalidatePath('/seller/products');
  
  return {
    success: true,
    productId: productRef.id,
    shareLink,
  };
}

/**
 * Update a Northern product
 */
export async function updateNorthernProduct(productId: string, data: unknown) {
  const auth = await requireAuth();
  const firestore = getAdminFirestore();
  
  // Verify ownership
  const productRef = firestore.collection('products').doc(productId);
  const productDoc = await productRef.get();

  if (!productDoc.exists) {
    throw new Error('Product not found');
  }

  const product = productDoc.data();
  if (product?.sellerId !== auth.uid) {
    throw new Error('Unauthorized: You can only update your own products');
  }

  const providedData = data as Record<string, any>;
  const updateData: any = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Basic fields
  if (providedData.name !== undefined) updateData.name = providedData.name;
  if (providedData.description !== undefined) updateData.description = providedData.description || '';
  if (providedData.price !== undefined) updateData.price = providedData.price;
  if (providedData.compareAtPrice !== undefined) {
    updateData.compareAtPrice = providedData.compareAtPrice || null;
  }
  if (providedData.stock !== undefined) updateData.stock = providedData.stock;
  if (providedData.status !== undefined) updateData.status = providedData.status;
  if (providedData.category !== undefined) updateData.category = providedData.category;

  // Media
  if (providedData.imageUrls !== undefined) {
    updateData.imageUrls = providedData.imageUrls;
    updateData.imageUrl = providedData.imageUrls?.[0] || null; // Legacy field
  }
  if (providedData.videoUrl !== undefined) {
    updateData.videoUrl = providedData.videoUrl || null;
  }
  if (providedData.audioDescription !== undefined) {
    updateData.audioDescription = providedData.audioDescription || null;
  }

  // Category-specific fields
  const category = providedData.category || product?.category;
  
  if (category === 'fragrance') {
    if (providedData.volume !== undefined) updateData.volume = providedData.volume;
    if (providedData.fragranceType !== undefined) updateData.fragranceType = providedData.fragranceType;
    if (providedData.container !== undefined) updateData.container = providedData.container;
  }

  if (category === 'fashion') {
    if (providedData.sizeType !== undefined) updateData.sizeType = providedData.sizeType;
    if (providedData.abayaLength !== undefined) updateData.abayaLength = providedData.abayaLength;
    if (providedData.standardSize !== undefined) updateData.standardSize = providedData.standardSize;
    if (providedData.setIncludes !== undefined) updateData.setIncludes = providedData.setIncludes;
    if (providedData.material !== undefined) updateData.material = providedData.material;
  }

  if (category === 'snacks') {
    if (providedData.packaging !== undefined) updateData.packaging = providedData.packaging;
    if (providedData.quantity !== undefined) updateData.quantity = providedData.quantity;
    if (providedData.taste !== undefined) updateData.taste = providedData.taste;
  }

  if (category === 'materials') {
    if (providedData.materialType !== undefined) updateData.materialType = providedData.materialType;
    if (providedData.fabricLength !== undefined) updateData.fabricLength = providedData.fabricLength;
    if (providedData.quality !== undefined) updateData.quality = providedData.quality;
    if (providedData.customMaterialType !== undefined) {
      updateData.customMaterialType = providedData.customMaterialType || null;
    }
  }

  if (category === 'skincare') {
    if (providedData.skincareBrand !== undefined) updateData.skincareBrand = providedData.skincareBrand;
    if (providedData.skincareType !== undefined) updateData.skincareType = providedData.skincareType;
    if (providedData.skincareSize !== undefined) updateData.skincareSize = providedData.skincareSize;
  }

  if (category === 'haircare') {
    if (providedData.haircareType !== undefined) updateData.haircareType = providedData.haircareType;
    if (providedData.haircareBrand !== undefined) updateData.haircareBrand = providedData.haircareBrand;
    if (providedData.haircareSize !== undefined) updateData.haircareSize = providedData.haircareSize;
    if (providedData.haircarePackageItems !== undefined) {
      updateData.haircarePackageItems = providedData.haircarePackageItems || null;
    }
  }

  if (category === 'islamic') {
    if (providedData.islamicType !== undefined) updateData.islamicType = providedData.islamicType;
    if (providedData.islamicSize !== undefined) updateData.islamicSize = providedData.islamicSize;
    if (providedData.islamicMaterial !== undefined) updateData.islamicMaterial = providedData.islamicMaterial;
  }

  if (category === 'electronics') {
    if (providedData.brand !== undefined) updateData.brand = providedData.brand;
    if (providedData.model !== undefined) updateData.model = providedData.model;
  }

  // Delivery settings
  if (providedData.deliveryFeePaidBy !== undefined) {
    updateData.deliveryFeePaidBy = providedData.deliveryFeePaidBy;
  }
  if (providedData.deliveryMethods !== undefined) {
    updateData.deliveryMethods = providedData.deliveryMethods;
  }

  // Update share link if product name or price changed
  if (updateData.name || updateData.price) {
    const shareLink = await generateProductShareLink(productId);
    updateData.shareLink = shareLink;
  }

  await productRef.update(updateData);

  revalidatePath('/seller/products');
  revalidatePath(`/product/${productId}`);

  return { success: true };
}

