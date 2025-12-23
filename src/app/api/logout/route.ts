
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Clear the session cookie with the EXACT same settings as login
    // This ensures the cookie is properly deleted
    const cookieStore = await cookies();
    const cookieName = process.env.AUTH_COOKIE_NAME || 'AuthToken';
    
    cookieStore.set(cookieName, '', {
      maxAge: 0, // Set to 0 to expire immediately
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    console.log('🚪 Logout: Cookie cleared', { cookieName });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: 'Failed to log out.' }, { status: 500 });
  }
}
