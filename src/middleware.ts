
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "next-firebase-auth-edge/lib/next/middleware";
import { clientConfig, serverConfig } from '@/lib/firebase/config.edge';

export async function middleware(request: NextRequest) {
    return auth(request, {
        loginPath: "/api/login",
        logoutPath: "/api/logout",
        // These are the client-side config variables, safe for the edge
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        
        // This handler runs if the user is authenticated
        handleValidToken: async ({ token, decodedToken }) => {
            const pathname = request.nextUrl.pathname;
            const headers = new Headers(request.headers);
            
            // Pass the user's UID to server components and API routes
            headers.set('X-User-UID', decodedToken.uid);

            // Enforce admin role for /admin routes
            if (pathname.startsWith('/admin') && decodedToken.claims?.isAdmin !== true) {
                console.log(`[Middleware] Unauthorized access to ${pathname} by user ${decodedToken.uid}`);
                return NextResponse.redirect(new URL('/', request.url));
            }

            return NextResponse.next({
                request: { headers },
            });
        },
        
        // This handler runs if the user is not authenticated
        handleInvalidToken: async () => {
            const pathname = request.nextUrl.pathname;
            // Redirect to login if trying to access a protected route
            if (pathname.startsWith('/admin') || pathname.startsWith('/seller') || pathname === '/profile' || pathname === '/checkout') {
                console.log(`[Middleware] Invalid token. Redirecting from ${pathname} to /login`);
                return NextResponse.redirect(new URL(`/login?redirect=${pathname}`, request.url));
            }
            // Allow access to public pages
            return NextResponse.next();
        },

        // Handle any other errors
        handleError: async (error) => {
            console.error('[Middleware] Error:', error.message);
            // Fallback for unexpected errors is to redirect to login
            return NextResponse.redirect(new URL('/login', request.url));
        },
    });
}

// Define the routes that the middleware will run on
export const config = {
    matcher: [
        "/admin/:path*",
        "/seller/:path*",
        "/profile",
        "/checkout",
        "/api/login",
        "/api/logout",
        // Add API routes that need authentication context
        "/api/verify-payment",
    ],
};
