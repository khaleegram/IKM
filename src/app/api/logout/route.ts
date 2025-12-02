
import { auth } from 'next-firebase-auth-edge';
import { clientConfig, serverConfig } from '@/lib/firebase/config.edge';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(null, {
      status: 200,
    });

    await auth.logout(request, response, {
      ...serverConfig,
      ...clientConfig,
    });
    
    return response;

  } catch (e) {
    console.error('[API Logout] Error:', e);
    return NextResponse.json({ error: 'Failed to destroy session' }, { status: 500 });
  }
}
