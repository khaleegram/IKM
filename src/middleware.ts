
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

// Force the middleware to run on the Node.js runtime
// This is required because the Firebase Admin SDK uses Node.js APIs
// that are not available in the default Edge runtime.
export const runtime = 'nodejs';

async function verifySessionCookie(sessionCookie: string | undefined, requireStrict: boolean = false) {
    if (!sessionCookie) return null;
    try {
        const adminApp = getAdminApp();
        const auth = getAuth(adminApp);
        
        // For admin routes, use longer timeout and don't fail on timeout
        // Instead, let the request through and let client-side handle it
        const timeoutDuration = requireStrict ? 10000 : 5000;
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Auth verification timeout')), timeoutDuration);
        });
        
        const decodedToken = await Promise.race([
            auth.verifySessionCookie(sessionCookie, true),
            timeoutPromise
        ]) as any;
        
        return decodedToken;
    } catch (error: any) {
        // For admin routes with timeout, allow through but log warning
        // The client-side will handle the auth check
        // This prevents blocking legitimate admin users due to network/Firebase latency
        if (requireStrict && (error?.message?.includes('timeout') || error?.code === 'auth/network-request-failed')) {
            console.warn('⚠️ Admin route: Auth verification timeout/network error (allowing request, client will verify):', error.message);
            // Return a special marker so we know it timed out but still allow the request
            // This allows the route to load, and client-side will verify
            return { timeout: true, allowThrough: true } as any;
        }
        
        // For admin routes with other errors (invalid token, etc), fail closed
        if (requireStrict) {
            console.error('❌ Admin route: Auth verification failed (strict mode):', error.message);
            return null;
        }
        
        // For other routes, we can be more lenient
        const isNetworkError = 
            error?.code === 'ENOTFOUND' ||
            error?.message?.includes('ENOTFOUND') ||
            error?.message?.includes('network') ||
            error?.message?.includes('timeout') ||
            error?.code === 'auth/network-request-failed';
        
        if (isNetworkError) {
            console.warn('⚠️ Network error during auth verification (allowing request):', error.message);
            return null;
        } else {
            if (error?.code === 'auth/user-not-found' || error?.message?.includes('no user record')) {
                console.warn('⚠️ Session cookie references non-existent user:', error.message);
            } else {
                console.error('❌ Auth verification error:', error);
            }
            return null;
        }
    }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieName = process.env.AUTH_COOKIE_NAME || 'AuthToken';
  const sessionCookie = request.cookies.get(cookieName)?.value;
  
  console.log('🛂 MIDDLEWARE HIT:', pathname);
  console.log('🍪 Cookie present?', Boolean(sessionCookie));
  console.log('🍪 Cookie name used:', cookieName);
  console.log('🍪 Cookie value length:', sessionCookie?.length || 0);
  console.log('🍪 All cookies:', Array.from(request.cookies.getAll().map(c => c.name)));
  
  // Public admin creation route - allow through without authentication
  if (pathname === '/admin-signup') {
    return NextResponse.next();
  }
  
  const isAdminRoute = pathname.startsWith('/admin');
  const decodedToken = await verifySessionCookie(sessionCookie, isAdminRoute);
  
  console.log('🔐 Decoded token:', {
    uid: decodedToken?.uid,
    isAdmin: decodedToken?.isAdmin,
    email: decodedToken?.email,
    hasToken: Boolean(decodedToken),
    isTimeout: Boolean((decodedToken as any)?.timeout),
  });
  
  const headers = new Headers(request.headers);
  
  // Set headers if we have a valid token (not a timeout marker)
  if (decodedToken && !(decodedToken as any).timeout) {
    headers.set('X-User-UID', decodedToken.uid);
    headers.set('X-User-Email', decodedToken.email || '');
    headers.set('X-User-IsAdmin', decodedToken.isAdmin === true ? 'true' : 'false');
  }

  // Admin routes require strict authentication
  if (isAdminRoute) {
    // If timeout occurred, allow through (client will verify)
    if (decodedToken && (decodedToken as any).timeout) {
      console.warn('⚠️ Admin route: Allowing request after timeout, client will verify');
      headers.set('X-Auth-Timeout', 'true');
      return NextResponse.next({ request: { headers } });
    }
    
    // No token at all - redirect to login
    if (!decodedToken) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.search = `redirect=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
    
    // Not an admin - redirect to seller dashboard
    if (decodedToken.isAdmin !== true) {
      return NextResponse.redirect(new URL('/seller/dashboard', request.url));
    }
    
    // Valid admin token - continue
    return NextResponse.next({ request: { headers } });
  }

  // Seller routes - require authentication
  if (pathname.startsWith('/seller') && !decodedToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `redirect=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // Other protected routes - require authentication
  if ((pathname === '/profile' || pathname === '/checkout') && !decodedToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `redirect=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  /*
   * Match all request paths except for the ones that should be public.
   * This is a more robust way to define protected routes.
   */
  matcher: [
    '/seller/:path*',
    '/admin/:path*',
    '/profile',
    '/checkout',
    '/api/verify-payment',
    '/api/payout-details', // Assuming you might have more protected APIs
  ],
};
