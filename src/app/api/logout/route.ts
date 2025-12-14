import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Clear the session cookie by setting its maxAge to 0
    cookies().set(process.env.AUTH_COOKIE_NAME || 'AuthToken', '', {
      maxAge: -1,
      path: '/',
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: 'Failed to log out.' }, { status: 500 });
  }
}
