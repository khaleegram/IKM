
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin-sdk';
import { getAuth } from 'firebase-admin/auth';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(process.env.AUTH_COOKIE_NAME || 'AuthToken')?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const adminApp = getAdminApp();
    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);

    const { pathname } = request.nextUrl;
    
    // Check for admin routes
    if (pathname.startsWith('/admin')) {
      if (decodedToken.isAdmin !== true) {
        // Not an admin, redirect to home
        return NextResponse.redirect(new URL('/', request.url));
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
  // We are removing /api/login and /api/logout from the matcher
  // because middleware runs *before* these routes, and for these routes,
  // we need to allow unauthenticated access.
  matcher: ['/admin/:path*', '/seller/:path*', '/profile', '/checkout'],
};
