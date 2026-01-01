'use server';

import { getAdminFirestore, getAdminAuth } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ============================================================================
// Access Logs
// ============================================================================

export interface AccessLog {
  id: string;
  userId: string;
  email?: string;
  action: 'login' | 'logout' | 'failed_login' | 'session_timeout';
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  timestamp: Date;
  failureReason?: string;
}

export async function getAccessLogs(limit: number = 100, startAfter?: string) {
  await requireAdmin();
  
  const firestore = getAdminFirestore();
  let query = firestore.collection('access_logs')
    .orderBy('timestamp', 'desc')
    .limit(limit);
  
  if (startAfter) {
    const startAfterDoc = await firestore.collection('access_logs').doc(startAfter).get();
    if (startAfterDoc.exists) {
      query = query.startAfter(startAfterDoc);
    }
  }
  
  const snapshot = await query.get();
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      email: data.email,
      action: data.action,
      success: data.success ?? true,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      deviceInfo: data.deviceInfo,
      failureReason: data.failureReason,
      timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : (data.timestamp || new Date()),
    };
  }) as AccessLog[];
}

export async function getFailedLogins(limit: number = 50) {
  await requireAdmin();
  
  const firestore = getAdminFirestore();
  const snapshot = await firestore.collection('access_logs')
    .where('action', '==', 'failed_login')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      email: data.email,
      action: data.action,
      success: data.success ?? false,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      deviceInfo: data.deviceInfo,
      failureReason: data.failureReason,
      timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : (data.timestamp || new Date()),
    };
  }) as AccessLog[];
}

// ============================================================================
// API Keys Management
// ============================================================================

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string; // First 8 chars for display
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  scopes: string[];
  rateLimit?: number;
  isActive: boolean;
  createdBy: string;
}

const apiKeySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  scopes: z.array(z.string()).min(1, 'At least one scope is required'),
  rateLimit: z.number().optional(),
  expiresInDays: z.number().optional(),
});

export async function getApiKeys() {
  await requireAdmin();
  
  const firestore = getAdminFirestore();
  const snapshot = await firestore.collection('api_keys')
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      keyPrefix: data.keyPrefix,
      scopes: data.scopes || [],
      rateLimit: data.rateLimit,
      isActive: data.isActive ?? true,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
      lastUsedAt: data.lastUsedAt?.toDate ? data.lastUsedAt.toDate() : data.lastUsedAt,
      expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt,
    };
  }) as ApiKey[];
}

export async function createApiKey(data: unknown) {
  await requireAdmin();
  const auth = await requireAdmin();
  
  const validation = apiKeySchema.safeParse(data);
  if (!validation.success) {
    throw new Error(validation.error.errors.map(e => e.message).join(', '));
  }
  
  const firestore = getAdminFirestore();
  
  // Generate API key (in production, use crypto.randomBytes)
  const apiKey = `ikm_${Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}`;
  
  const keyHash = await hashApiKey(apiKey);
  
  const expiresAt = validation.data.expiresInDays
    ? new Date(Date.now() + validation.data.expiresInDays * 24 * 60 * 60 * 1000)
    : undefined;
  
  const docRef = firestore.collection('api_keys').doc();
  await docRef.set({
    name: validation.data.name,
    keyHash,
    keyPrefix: apiKey.substring(0, 8),
    scopes: validation.data.scopes,
    rateLimit: validation.data.rateLimit,
    expiresAt,
    isActive: true,
    createdBy: auth.uid,
    createdAt: new Date(),
  });
  
  revalidatePath('/admin/security');
  
  // Return the full key only once (client should store it securely)
  return { id: docRef.id, apiKey };
}

async function hashApiKey(key: string): Promise<string> {
  // In production, use proper hashing (bcrypt, argon2, etc.)
  // For now, using a simple hash (this should be improved)
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function revokeApiKey(apiKeyId: string) {
  await requireAdmin();
  
  const firestore = getAdminFirestore();
  await firestore.collection('api_keys').doc(apiKeyId).update({
    isActive: false,
    revokedAt: new Date(),
  });
  
  revalidatePath('/admin/security');
}

// ============================================================================
// Security Settings
// ============================================================================

export interface SecuritySettings {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  twoFactorEnabled: boolean;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  ipWhitelist: string[];
  ipBlacklist: string[];
  emailVerificationRequired: boolean;
  accountLockoutEnabled: boolean;
}

const securitySettingsSchema = z.object({
  passwordMinLength: z.number().min(6).max(128),
  passwordRequireUppercase: z.boolean(),
  passwordRequireLowercase: z.boolean(),
  passwordRequireNumbers: z.boolean(),
  passwordRequireSpecialChars: z.boolean(),
  twoFactorEnabled: z.boolean(),
  sessionTimeoutMinutes: z.number().min(5).max(1440),
  maxLoginAttempts: z.number().min(3).max(10),
  lockoutDurationMinutes: z.number().min(5).max(1440),
  ipWhitelist: z.array(z.string()).optional(),
  ipBlacklist: z.array(z.string()).optional(),
  emailVerificationRequired: z.boolean(),
  accountLockoutEnabled: z.boolean(),
});

export async function getSecuritySettings(): Promise<SecuritySettings> {
  await requireAdmin();
  
  const firestore = getAdminFirestore();
  const doc = await firestore.collection('security_settings').doc('settings').get();
  
  if (doc.exists) {
    return doc.data() as SecuritySettings;
  }
  
  // Return defaults
  return {
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: false,
    twoFactorEnabled: false,
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    ipWhitelist: [],
    ipBlacklist: [],
    emailVerificationRequired: false,
    accountLockoutEnabled: true,
  };
}

export async function updateSecuritySettings(data: unknown) {
  await requireAdmin();
  
  const validation = securitySettingsSchema.safeParse(data);
  if (!validation.success) {
    throw new Error(validation.error.errors.map(e => e.message).join(', '));
  }
  
  const firestore = getAdminFirestore();
  await firestore.collection('security_settings').doc('settings').set({
    ...validation.data,
    updatedAt: new Date(),
  }, { merge: true });
  
  revalidatePath('/admin/security');
}

// ============================================================================
// Firestore Rules
// ============================================================================

export async function getFirestoreRules() {
  await requireAdmin();
  
  // Note: In production, you'd fetch from Firebase Management API
  // For now, we'll read from the rules file or return a placeholder
  // This requires Firebase Admin SDK with appropriate permissions
  
  // Placeholder - in production, use Firebase Management API
  return {
    rules: '// Firestore rules would be fetched from Firebase Management API',
    version: '1',
    lastDeployed: new Date(),
  };
}

// ============================================================================
// Audit Trail
// ============================================================================

export interface AuditLog {
  id: string;
  userId: string;
  userEmail?: string;
  action: string;
  resourceType: 'user' | 'order' | 'product' | 'settings' | 'system';
  resourceId?: string;
  changes?: Record<string, { old: any; new: any }>;
  ipAddress?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export async function getAuditTrail(
  limit: number = 100,
  startAfter?: string,
  resourceType?: string,
  userId?: string
) {
  await requireAdmin();
  
  const firestore = getAdminFirestore();
  let query = firestore.collection('audit_trail')
    .orderBy('timestamp', 'desc')
    .limit(limit);
  
  if (resourceType) {
    query = query.where('resourceType', '==', resourceType) as any;
  }
  
  if (userId) {
    query = query.where('userId', '==', userId) as any;
  }
  
  if (startAfter) {
    const startAfterDoc = await firestore.collection('audit_trail').doc(startAfter).get();
    if (startAfterDoc.exists) {
      query = query.startAfter(startAfterDoc) as any;
    }
  }
  
  const snapshot = await query.get();
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      userEmail: data.userEmail,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      changes: data.changes,
      ipAddress: data.ipAddress,
      metadata: data.metadata,
      timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : (data.timestamp || new Date()),
    };
  }) as AuditLog[];
}

// ============================================================================
// Session Management
// ============================================================================

export interface ActiveSession {
  uid: string;
  email?: string;
  displayName?: string;
  lastRefresh: Date;
  createdAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export async function getActiveSessions() {
  await requireAdmin();
  
  // Note: Firebase Auth doesn't provide a direct way to list all active sessions
  // This would require tracking sessions in Firestore or using Firebase Admin Auth
  // For now, return a placeholder that would need Cloud Function implementation
  
  return [] as ActiveSession[];
}

export async function forceLogout(userId: string) {
  await requireAdmin();
  
  const auth = getAdminAuth();
  
  // Revoke all refresh tokens for the user
  await auth.revokeRefreshTokens(userId);
  
  revalidatePath('/admin/security');
}

