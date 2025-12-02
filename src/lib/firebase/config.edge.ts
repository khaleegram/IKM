
// All of these are defined in `service-account.json.enc` and loaded in `next.config.js`
export const clientConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
};

const thirtyDaysInSeconds = 30 * 24 * 60 * 60;

// This private key is a secret and MUST NOT be exposed to the client-side.
// It's used in the Edge Runtime for session management.
const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

export const serverConfig = {
    cookieName: process.env.AUTH_COOKIE_NAME || 'AuthToken',
    cookieSignatureKeys: [
        process.env.AUTH_COOKIE_SIGNATURE_KEY_CURRENT || '9b552a952826a11e7330594343e064e4',
        process.env.AUTH_COOKIE_SIGNATURE_KEY_PREVIOUS || '24503524b09a473489849591ea280628',
    ],
    cookieSerializeOptions: {
        path: '/',
        httpOnly: true,
        secure: process.env.USE_SECURE_COOKIES === 'true', // Set this to false in local (non-HTTPS) development
        sameSite: 'lax' as const,
        maxAge: thirtyDaysInSeconds, 
    },
    serviceAccount: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: privateKey,
    },
};
