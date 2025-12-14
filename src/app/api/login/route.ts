
import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'next-firebase-auth-edge';
import { clientConfig, serverConfig } from '@/lib/firebase/config.edge';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    // The auth.login method expects a single options object with all keys.
    const tokens = await auth.login(idToken, {
      apiKey: clientConfig.apiKey,
      cookieName: serverConfig.cookieName,
      cookieSignatureKeys: serverConfig.cookieSignatureKeys,
      cookieSerializeOptions: serverConfig.cookieSerializeOptions,
      serviceAccount: serverConfig.serviceAccount,
    });

    return NextResponse.json(
      { success: true },
      { status: 200, headers: tokens.headers }
    );
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
