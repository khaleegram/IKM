
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

// Force the middleware to run on the Node.js runtime
// This is required because the Firebase Admin SDK uses Node.js APIs
// that are not available in the default Edge runtime.
export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(process.env.AUTH_COOKIE_NAME || 'AuthToken')?.value;

  // For API routes that need the user's UID
  if (request.nextUrl.pathname.startsWith('/api/')) {
      if (sessionCookie) {
         try {
            const adminApp = getAdminApp();
            const auth = getAuth(adminApp);
            const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
            const headers = new Headers(request.headers);
            headers.set('X-User-UID', decodedToken.uid);
            return NextResponse.next({ request: { headers } });
         } catch (error) {
            // Invalid cookie, continue without the header for public API routes.
         }
      }
      return NextResponse.next();
  }
  
  // If no cookie, redirect to login for protected pages
  if (!sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `redirect=${request.nextUrl.pathname}`;
    return NextResponse.redirect(url);
  }

  try {
    const adminApp = getAdminApp();
    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);

    const { pathname } = request.nextUrl;
    
    // Check for admin routes
    if (pathname.startsWith('/admin')) {
      if (decodedToken.isAdmin !== true) {
        // Not an admin, redirect to seller dashboard
        return NextResponse.redirect(new URL('/seller/dashboard', request.url));
      }
    }

    // Add user UID to request headers for server-side actions
    const headers = new Headers(request.headers);
    headers.set('X-User-UID', decodedToken.uid);

    return NextResponse.next({
      request: { headers },
    });
  } catch (error) {
    console.error('Middleware auth error:', error);
    // Failed to verify cookie, redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    // Clear the invalid cookie
    response.cookies.set(process.env.AUTH_COOKIE_NAME || 'AuthToken', '', { maxAge: -1 });
    return response;
  }
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
    '/api/verify-payment', // protect payment verification
  ],
};
