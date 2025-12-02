
import { NextResponse, type NextRequest } from "next/server";
import { getAdminApp } from '@/lib/firebase/admin-sdk';
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin
const adminApp = getAdminApp();
const adminAuth = getAuth(adminApp);

export async function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get("AuthToken")?.value;
    const { pathname } = request.nextUrl;

    if (!sessionCookie) {
        // If no cookie and trying to access a protected route, redirect to login
        if (pathname.startsWith('/admin') || pathname.startsWith('/seller') || pathname === '/profile' || pathname === '/checkout') {
             return NextResponse.redirect(new URL(`/login?redirect=${pathname}`, request.url));
        }
        return NextResponse.next();
    }

    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        const headers = new Headers(request.headers);
        headers.set('X-User-UID', decodedToken.uid);

        // Handle admin route protection
        if (pathname.startsWith('/admin')) {
            if (decodedToken.isAdmin !== true) {
                // Not an admin, redirect to home
                return NextResponse.redirect(new URL('/', request.url));
            }
        }
        
        return NextResponse.next({
            request: { headers },
        });

    } catch (error) {
        // Session cookie is invalid. Clear it and redirect to login for protected routes.
        const response = NextResponse.next();

        if (pathname.startsWith('/admin') || pathname.startsWith('/seller') || pathname === '/profile' || pathname === '/checkout') {
            const redirectResponse = NextResponse.redirect(new URL(`/login?redirect=${pathname}`, request.url));
            redirectResponse.cookies.set("AuthToken", "", { maxAge: -1 }); // Clear the invalid cookie
            return redirectResponse;
        }

        response.cookies.set("AuthToken", "", { maxAge: -1 }); // Clear the invalid cookie
        return response;
    }
}

// Define the routes that the middleware will run on
export const config = {
    matcher: [
        "/((?!api/login|_next/static|_next/image|favicon.ico).*)",
    ],
};
