
import { NextResponse, type NextRequest } from "next/server";
import { authentication } from "next-firebase-auth-edge/lib/next/middleware";

const commonOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    cookieName: 'auth-token',
    cookieSignatureKeys: [process.env.COOKIE_SIGNATURE_KEY_A!, process.env.COOKIE_SIGNATURE_KEY_B!],
    cookieSerializeOptions: {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        maxAge: 12 * 60 * 60 * 24, // 12 days
    },
    serviceAccount: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    },
};

export async function middleware(request: NextRequest) {
    return authentication(request, {
        loginPath: "/api/login",
        logoutPath: "/api/logout",
        ...commonOptions,
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
