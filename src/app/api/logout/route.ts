
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Instruct the browser to clear the cookie
    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set("AuthToken", "", { maxAge: -1, path: '/' });
    return response;

  } catch (e) {
    console.error('[API Logout] Error:', e);
    return NextResponse.json({ error: 'Failed to destroy session' }, { status: 500 });
  }
}
