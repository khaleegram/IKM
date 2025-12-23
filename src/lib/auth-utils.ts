/**
 * Server-Side Authentication Utilities
 * 
 * Provides utilities for verifying authentication in server actions.
 * Never trust middleware alone - always verify in server actions.
 */

import { headers } from 'next/headers';
import { cookies } from 'next/headers';
import { getAdminApp } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

/**
 * Get the authenticated user ID from request headers
 * This is set by middleware after verifying the session cookie
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const headersList = await headers();
  const userId = headersList.get('X-User-UID');
  return userId;
}

/**
 * Get admin status from request headers
 * This is set by middleware after verifying the session cookie
 */
export async function getIsAdminFromHeaders(): Promise<boolean> {
  const headersList = await headers();
  return headersList.get('X-User-IsAdmin') === 'true';
}

/**
 * Verify session cookie and return decoded token
 * This is the source of truth for authentication in server actions
 */
export async function verifySessionCookieInServerAction(): Promise<{
  uid: string;
  email?: string;
  isAdmin?: boolean;
} | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(process.env.AUTH_COOKIE_NAME || 'AuthToken')?.value;
    
    if (!sessionCookie) {
      return null;
    }

    const adminApp = getAdminApp();
    const auth = getAuth(adminApp);
    
    // Verify the session cookie (source of truth)
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      isAdmin: decodedToken.isAdmin === true,
    };
  } catch (error) {
    console.error('Error verifying session cookie in server action:', error);
    return null;
  }
}

/**
 * Require authentication - throws error if user is not authenticated
 */
export async function requireAuth(): Promise<{
  uid: string;
  email?: string;
  isAdmin?: boolean;
}> {
  const token = await verifySessionCookieInServerAction();
  if (!token) {
    throw new Error('Unauthorized: Authentication required');
  }
  return token;
}

/**
 * Require admin access - throws error if user is not admin
 * This is the proper way to check admin status in server actions
 */
export async function requireAdmin(): Promise<{
  uid: string;
  email?: string;
}> {
  const token = await requireAuth();
  if (!token.isAdmin) {
    throw new Error('Forbidden: Admin access required');
  }
  return token;
}

/**
 * Verify ownership or admin access
 */
export async function requireOwnerOrAdmin(resourceOwnerId: string): Promise<{
  uid: string;
  email?: string;
  isAdmin?: boolean;
}> {
  const token = await requireAuth();
  if (token.uid !== resourceOwnerId && !token.isAdmin) {
    throw new Error('Forbidden: You do not have permission to access this resource');
  }
  return token;
}
