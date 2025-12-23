'use server';

import { z } from "zod";
import { getAdminFirestore } from './firebase/admin';
import { requireAuth } from './auth-utils';
import { FieldValue } from 'firebase-admin/firestore';

const RESERVED_SUBDOMAINS = [
  'www', 'admin', 'api', 'app', 'mail', 'email', 'ftp', 'localhost',
  'test', 'staging', 'dev', 'blog', 'shop', 'store', 'help', 'support',
  'login', 'signup', 'dashboard', 'seller', 'customer', 'profile',
];

/**
 * Generate a valid subdomain from store name
 */
function generateSubdomainSlug(storeName: string): string {
  // Convert to lowercase, remove special chars, replace spaces with hyphens
  let slug = storeName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  // Ensure it's not empty and has valid length
  if (slug.length === 0) {
    slug = 'store';
  }

  // Limit length (subdomain max is 63 chars, but we'll use 50 for safety)
  if (slug.length > 50) {
    slug = slug.substring(0, 50);
    slug = slug.replace(/-+$/, ''); // Remove trailing hyphens
  }

  return slug;
}

/**
 * Check if subdomain is available
 */
export async function checkSubdomainAvailability(subdomain: string): Promise<{ available: boolean; message?: string }> {
  if (!subdomain || subdomain.trim().length === 0) {
    return { available: false, message: 'Subdomain cannot be empty' };
  }

  const normalized = subdomain.toLowerCase().trim();

  // Check length
  if (normalized.length < 3) {
    return { available: false, message: 'Subdomain must be at least 3 characters' };
  }

  if (normalized.length > 50) {
    return { available: false, message: 'Subdomain must be less than 50 characters' };
  }

  // Check for invalid characters
  if (!/^[a-z0-9-]+$/.test(normalized)) {
    return { available: false, message: 'Subdomain can only contain lowercase letters, numbers, and hyphens' };
  }

  // Check if starts/ends with hyphen
  if (normalized.startsWith('-') || normalized.endsWith('-')) {
    return { available: false, message: 'Subdomain cannot start or end with a hyphen' };
  }

  // Check if reserved
  if (RESERVED_SUBDOMAINS.includes(normalized)) {
    return { available: false, message: 'This subdomain is reserved and cannot be used' };
  }

  // Check if already exists in Firestore
  const firestore = getAdminFirestore();
  const storesQuery = await firestore
    .collection('stores')
    .where('subdomain', '==', normalized)
    .limit(1)
    .get();

  if (!storesQuery.empty) {
    return { available: false, message: 'This subdomain is already taken' };
  }

  return { available: true };
}

/**
 * Generate available subdomain from store name with fallbacks
 */
export async function generateAvailableSubdomain(storeName: string, userId: string): Promise<string> {
  const firestore = getAdminFirestore();
  
  // Generate base slug
  let baseSlug = generateSubdomainSlug(storeName);
  
  // Check if base slug is available
  let checkResult = await checkSubdomainAvailability(baseSlug);
  
  if (checkResult.available) {
    return baseSlug;
  }

  // If not available, try with user ID suffix
  const userIdSuffix = userId.substring(0, 8);
  let attempt = `${baseSlug}-${userIdSuffix}`;
  
  // Limit total length
  if (attempt.length > 50) {
    const maxBaseLength = 50 - userIdSuffix.length - 1; // -1 for hyphen
    baseSlug = baseSlug.substring(0, maxBaseLength);
    attempt = `${baseSlug}-${userIdSuffix}`;
  }

  checkResult = await checkSubdomainAvailability(attempt);
  if (checkResult.available) {
    return attempt;
  }

  // If still not available, try with random suffix
  let counter = 1;
  let finalSubdomain = '';
  
  while (counter < 100) { // Max 100 attempts
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const candidate = baseSlug.length + randomSuffix.length + 1 <= 50
      ? `${baseSlug}-${randomSuffix}`
      : `${baseSlug.substring(0, 50 - randomSuffix.length - 1)}-${randomSuffix}`;
    
    checkResult = await checkSubdomainAvailability(candidate);
    if (checkResult.available) {
      finalSubdomain = candidate;
      break;
    }
    counter++;
  }

  // Last resort: use userId with prefix
  if (!finalSubdomain) {
    finalSubdomain = `store-${userIdSuffix}`;
    checkResult = await checkSubdomainAvailability(finalSubdomain);
    if (!checkResult.available) {
      // Even this failed, use timestamp
      finalSubdomain = `store-${Date.now().toString().slice(-8)}`;
    }
  }

  return finalSubdomain;
}

/**
 * Update store subdomain (for manual changes)
 */
export async function updateStoreSubdomain(userId: string, newSubdomain: string) {
  const auth = await requireAuth();
  
  if (auth.uid !== userId && !auth.isAdmin) {
    throw new Error('Unauthorized: You can only update your own store subdomain');
  }

  // Check availability
  const availability = await checkSubdomainAvailability(newSubdomain);
  if (!availability.available) {
    throw new Error(availability.message || 'Subdomain is not available');
  }

  const firestore = getAdminFirestore();
  const storeRef = firestore.collection('stores').doc(userId);

  // Check if store exists
  const storeDoc = await storeRef.get();
  if (!storeDoc.exists) {
    throw new Error('Store not found');
  }

  // Update subdomain
  await storeRef.update({
    subdomain: newSubdomain.toLowerCase().trim(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, subdomain: newSubdomain.toLowerCase().trim() };
}

/**
 * Get store URL from subdomain
 */
export async function getStoreUrl(subdomain: string): Promise<string> {
  // Get domain from environment variable or use default
  const baseDomain = process.env.NEXT_PUBLIC_STORE_DOMAIN || process.env.NEXT_PUBLIC_APP_DOMAIN || 'ikm.com';
  return `https://${subdomain}.${baseDomain}`;
}

