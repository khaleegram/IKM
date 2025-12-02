
import { auth } from 'next-firebase-auth-edge';
import { clientConfig, serverConfig } from '@/lib/firebase/config.edge';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    const tokens = await auth.login(idToken, {
      ...serverConfig,
      ...clientConfig,
    });

    const response = NextResponse.json(null, {
      status: 200,
    });

    tokens.setCookies(response);

    return response;
  } catch (e) {
    console.error('[API Login] Error:', e);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
