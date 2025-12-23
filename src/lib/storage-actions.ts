'use server';

import { getAdminStorage } from './firebase/admin';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload image to Firebase Storage
 * Returns the public URL of the uploaded image
 */
export async function uploadImageToStorage(
  file: Buffer | Uint8Array,
  fileName: string,
  folder: string = 'uploads'
): Promise<string> {
  try {
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    
    // Generate unique filename
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const uniqueFileName = `${folder}/${uuidv4()}.${fileExtension}`;
    
    // Upload file
    const fileRef = bucket.file(uniqueFileName);
    await fileRef.save(file, {
      metadata: {
        contentType: `image/${fileExtension}`,
      },
    });
    
    // Make file publicly accessible
    await fileRef.makePublic();
    
    // Return public URL
    return `https://storage.googleapis.com/${bucket.name}/${uniqueFileName}`;
  } catch (error) {
    console.error('Error uploading image to storage:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Upload base64 image to Firebase Storage
 */
export async function uploadBase64ImageToStorage(
  base64Data: string,
  folder: string = 'uploads'
): Promise<string> {
  try {
    // Remove data URL prefix if present
    const base64String = base64Data.includes(',')
      ? base64Data.split(',')[1]
      : base64Data;
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64String, 'base64');
    
    // Determine file extension from base64 data
    const matches = base64Data.match(/data:image\/(\w+);base64/);
    const extension = matches ? matches[1] : 'jpg';
    
    return await uploadImageToStorage(buffer, `image.${extension}`, folder);
  } catch (error) {
    console.error('Error uploading base64 image:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Delete image from Firebase Storage
 */
export async function deleteImageFromStorage(imageUrl: string): Promise<void> {
  try {
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const folder = urlParts[urlParts.length - 2];
    const filePath = `${folder}/${fileName}`;
    
    // Delete file
    await bucket.file(filePath).delete();
  } catch (error) {
    console.error('Error deleting image from storage:', error);
    // Don't throw - deletion failures shouldn't break the flow
  }
}

