
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { getAdminApp } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ success: false, error: 'ID token is required.' }, { status: 400 });
    }
    
    // getAdminApp will now throw if not initialized, which is caught below.
    const adminApp = getAdminApp();
    const auth = getAuth(adminApp);
    
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    
    // Add timeout for network issues
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Session cookie creation timeout - network issue')), 10000);
    });
    
    // Verify the ID token to get custom claims (including isAdmin)
    const decodedToken = await auth.verifyIdToken(idToken, true);
    
    console.log('✅ SESSION CREATED');
    console.log('Cookie name:', process.env.AUTH_COOKIE_NAME || 'AuthToken');
    console.log('Is admin:', decodedToken.isAdmin);
    console.log('UID:', decodedToken.uid);
    console.log('CLAIMS AT LOGIN:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      isAdmin: decodedToken.isAdmin,
      customClaims: decodedToken,
    });
    
    // Create session cookie with the verified token
    const sessionCookie = await Promise.race([
      auth.createSessionCookie(idToken, { expiresIn }),
      timeoutPromise
    ]) as string;

    const cookieStore = await cookies();
    const cookieName = process.env.AUTH_COOKIE_NAME || 'AuthToken';
    cookieStore.set(cookieName, sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    console.log('🍪 Cookie set successfully');
    console.log('Cookie name used:', cookieName);
    console.log('Cookie value length:', sessionCookie.length);

    // Return success with admin status for client-side routing
    return NextResponse.json({ 
      success: true, 
      isAdmin: decodedToken.isAdmin === true 
    }, { status: 200 });

  } catch (err: any) {
    // Check if it's a network error
    const isNetworkError = 
      err?.code === 'ENOTFOUND' ||
      err?.message?.includes('ENOTFOUND') ||
      err?.message?.includes('network') ||
      err?.message?.includes('timeout') ||
      err?.code === 'auth/network-request-failed';
    
    if (isNetworkError) {
      console.error('🌐 Network error during login:', err.message);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Network connection issue. Please check your internet connection and try again.',
          code: 'NETWORK_ERROR',
          isNetworkError: true
        },
        { status: 503 } // Service Unavailable for network issues
      );
    }
    
    console.error('FULL LOGIN ERROR:', err);
    const errorMessage = err.message || 'Failed to create session cookie.';
    return NextResponse.json(
      { success: false, error: errorMessage, code: err.code },
      { status: 500 } // Use 500 for server issues like SDK initialization failure
    );
  }
}
