
import { NextRequest, NextResponse } from 'next/server';
import { auth } from 'next-firebase-auth-edge';
import { clientConfig, serverConfig } from '@/lib/firebase/config.edge';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

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
  } catch (err: any) {
    // Log the full error for detailed debugging
    console.error('FULL LOGIN ERROR:', err, err?.cause);
    
    // Return a 400 status to match observed behavior and provide a clearer error message
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create session cookie.' },
      { status: 400 }
    );
  }
}
