
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(process.env.AUTH_COOKIE_NAME || 'AuthToken')?.value;

  // For API routes like /api/login, we don't want to redirect if there's no cookie.
  // The route itself will handle logic. This middleware is for protecting UI pages.
  if (request.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.next();
  }
  
  if (!sessionCookie) {
    // If the user is trying to access a protected page, redirect to login
    if (request.nextUrl.pathname !== '/login' && request.nextUrl.pathname !== '/signup' && request.nextUrl.pathname !== '/admin-signup') {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.search = `redirect=${request.nextUrl.pathname}`;
        return NextResponse.redirect(url);
    }
    return NextResponse.next();
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
  // Apply middleware to all routes except for static assets and public pages.
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (the root page, which is public)
     * - /store/* (public store pages)
     * - /product/* (public product pages)
     * - /stores (public stores directory)
     * - /api/verify-payment (public webhook)
     * - /api/whatsapp (public webhook)
     */
    '/((?!_next/static|_next/image|favicon.ico|store/.+|product/.+|stores|api/verify-payment|api/whatsapp|^/$).*)'
  ],
};
