
import { NextResponse, type NextRequest } from "next/server";
import { authentication } from "next-firebase-auth-edge/lib/next/middleware";
import { serverConfig } from "./lib/firebase/config.edge";

export async function middleware(request: NextRequest) {
    return authentication(request, {
        loginPath: "/api/login",
        logoutPath: "/api/logout",
        ...serverConfig,
        handleValidToken: async ({ token, decodedToken }) => {
            const pathname = request.nextUrl.pathname;
            const headers = new Headers(request.headers);
            
            // Pass UID to server components and actions
            headers.set('X-User-UID', decodedToken.uid);

            // Gatekeep admin routes
            if (pathname.startsWith('/admin') && decodedToken.claims?.isAdmin !== true) {
                console.log(`[Middleware] Unauthorized access to ${pathname} by user ${decodedToken.uid}`);
                return NextResponse.redirect(new URL('/', request.url));
            }

            return NextResponse.next({
                request: { headers },
            });
        },
        handleInvalidToken: async () => {
            const pathname = request.nextUrl.pathname;
            if (pathname.startsWith('/admin') || pathname.startsWith('/seller') || pathname === '/profile' || pathname === '/checkout') {
                console.log(`[Middleware] Invalid token. Redirecting from ${pathname} to /login`);
                return NextResponse.redirect(new URL(`/login?redirect=${pathname}`, request.url));
            }
            return NextResponse.next();
        },
        handleError: async (error) => {
            console.error('[Middleware] Error:', error.message);
            // Fallback for unexpected errors
            return NextResponse.redirect(new URL('/login', request.url));
        },
    });
}

export const config = {
    matcher: [
        "/admin/:path*",
        "/seller/:path*",
        "/profile",
        "/checkout",
        "/api/login",
        "/api/logout",
    ],
};
