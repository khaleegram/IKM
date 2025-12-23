'use server';

import { z } from 'zod';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { requireOwnerOrAdmin } from '@/lib/auth-utils';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyDnsRecord } from '@/lib/dns-verification';

const domainSettingsSchema = z.object({
  subdomain: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{3,50}$/, 'Subdomain must be 3-50 chars, letters/numbers/hyphens').optional(),
  customDomain: z.string().trim().toLowerCase().regex(/^[a-z0-9.-]+$/, 'Invalid domain format').optional(),
});

const dnsVerifySchema = z.object({
  userId: z.string(),
  domain: z.string(),
  recordType: z.enum(['A', 'CNAME', 'TXT']),
  name: z.string(),
  value: z.string(),
  customDomain: z.string().optional(),
});

/**
 * Update domain settings (subdomain + optional custom domain)
 */
export async function updateDomainSettings(userId: string, data: unknown) {
  await requireOwnerOrAdmin(userId);
  const validation = domainSettingsSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`);
  }

  const firestore = getAdminFirestore();
  const storeRef = firestore.collection('stores').doc(userId);
  const storeDoc = await storeRef.get();
  if (!storeDoc.exists) {
    throw new Error('Store not found');
  }

  const updateData: any = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (validation.data.subdomain !== undefined) {
    updateData.subdomain = validation.data.subdomain;
  }
  if (validation.data.customDomain !== undefined) {
    updateData.customDomain = validation.data.customDomain;
    updateData.domainStatus = 'pending';
  }

  await storeRef.update(updateData);
  return { success: true };
}

/**
 * Verify a DNS record for the store's domain
 */
export async function verifyStoreDnsRecord(data: unknown) {
  const validation = dnsVerifySchema.safeParse(data);
  if (!validation.success) {
    throw new Error(`Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`);
  }

  const { userId, domain, recordType, name, value, customDomain } = validation.data;
  await requireOwnerOrAdmin(userId);

  const domainToCheck = name === '@' ? domain : `${name}.${domain}`;
  const result = await verifyDnsRecord({
    domain: domainToCheck,
    recordType,
    expectedValue: value,
  });

  const firestore = getAdminFirestore();
  const storeRef = firestore.collection('stores').doc(userId);

  const updateFields: any = {
    dnsRecords: FieldValue.arrayUnion({
      type: recordType,
      name,
      value,
      status: result.verified ? 'verified' : 'failed',
      lastCheckedAt: FieldValue.serverTimestamp(),
    }),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (customDomain) {
    updateFields.customDomain = customDomain;
    updateFields.domainStatus = result.verified ? 'verified' : 'pending';
  }

  await storeRef.set(updateFields, { merge: true });

  return {
    success: result.verified,
    message: result.message,
    verified: result.verified,
  };
}

