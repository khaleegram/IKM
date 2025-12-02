
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase/admin-sdk';
import { getAuth } from 'firebase-admin/auth';

const adminApp = getAdminApp();
const adminAuth = getAuth(adminApp);

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    
    // Set session expiration to 14 days.
    const expiresIn = 60 * 60 * 24 * 14 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ success: true }, { status: 200 });
    
    response.cookies.set("AuthToken", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return response;

  } catch (e) {
    console.error('[API Login] Error:', e);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

