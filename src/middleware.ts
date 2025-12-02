import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from 'next-firebase-auth-edge';
import { clientConfig, serverConfig } from '@/lib/firebase/config.edge';

export async function middleware(request: NextRequest) {
  return authMiddleware(request, {
    loginPath: '/api/login',
    logoutPath: '/api/logout',
    apiKey: clientConfig.apiKey,
    cookieName: serverConfig.cookieName,
    cookieSignatureKeys: serverConfig.cookieSignatureKeys,
    cookieSerializeOptions: serverConfig.cookieSerializeOptions,
    serviceAccount: serverConfig.serviceAccount,
    handleValidToken: async ({ token, decodedToken }) => {
      const { pathname } = request.nextUrl;
      
      if (pathname.startsWith('/admin')) {
        if (decodedToken.claims?.isAdmin !== true) {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }

      // Add the user's UID to the request headers for use in server-side actions
      const headers = new Headers(request.headers);
      headers.set('X-User-UID', decodedToken.uid);

      return NextResponse.next({
        request: { headers },
      });
    },
    handleInvalidToken: async () => {
      return NextResponse.redirect(new URL('/login', request.url));
    },
    handleError: async (error) => {
      console.error('Middleware auth error:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    },
  });
}

export const config = {
  matcher: ['/admin/:path*', '/seller/:path*', '/profile', '/checkout', '/api/login', '/api/logout'],
};
