
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

// Force the middleware to run on the Node.js runtime
// This is required because the Firebase Admin SDK uses Node.js APIs
// that are not available in the default Edge runtime.
export const runtime = 'nodejs';

async function verifySessionCookie(sessionCookie: string | undefined) {
    if (!sessionCookie) return null;
    try {
        const adminApp = getAdminApp();
        const auth = getAuth(adminApp);
        return await auth.verifySessionCookie(sessionCookie, true);
    } catch (error) {
        console.error('Middleware auth error:', error);
        return null;
    }
}

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(process.env.AUTH_COOKIE_NAME || 'AuthToken')?.value;
  const decodedToken = await verifySessionCookie(sessionCookie);
  
  const headers = new Headers(request.headers);
  if (decodedToken) {
    headers.set('X-User-UID', decodedToken.uid);
  }

  const { pathname } = request.nextUrl;

  // If the route is protected
  if (config.matcher.some(path => new RegExp(`^${path.replace('*', '.*')}$`).test(pathname))) {
      if (!decodedToken) {
          const url = request.nextUrl.clone();
          url.pathname = '/login';
          url.search = `redirect=${request.nextUrl.pathname}`;
          return NextResponse.redirect(url);
      }
      
      // Check for admin routes
      if (pathname.startsWith('/admin')) {
        if (decodedToken.isAdmin !== true) {
          // Not an admin, redirect to seller dashboard
          return NextResponse.redirect(new URL('/seller/dashboard', request.url));
        }
      }
  }

  return NextResponse.next({
    request: { headers },
  });
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
