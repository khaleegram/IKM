
import { NextRequest } from 'next/server';
import { auth } from 'next-firebase-auth-edge';
import { clientConfig, serverConfig } from '@/lib/firebase/config.edge';

export async function POST(request: NextRequest) {
    // The auth.logout method also expects the full configuration.
    return auth.logout(request, {
        apiKey: clientConfig.apiKey,
        cookieName: serverConfig.cookieName,
        cookieSignatureKeys: serverConfig.cookieSignatureKeys,
        cookieSerializeOptions: serverConfig.cookieSerializeOptions,
    });
}
