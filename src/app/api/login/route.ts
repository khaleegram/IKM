
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
    
    // getAdminApp will throw if not initialized, which is caught below.
    const adminApp = getAdminApp();
    const auth = getAuth(adminApp);
    
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    cookies().set(process.env.AUTH_COOKIE_NAME || 'AuthToken', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err: any) {
    console.error('FULL LOGIN ERROR:', err);
    const errorMessage = err.message || 'Failed to create session cookie.';
    return NextResponse.json(
      { success: false, error: errorMessage, code: err.code },
      { status: 500 } // Use 500 for server issues like SDK initialization failure
    );
  }
}
