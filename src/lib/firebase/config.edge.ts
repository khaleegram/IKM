// All of these are defined in `service-account.json.enc` and loaded in `next.config.js`
export const clientConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
};

export const serverConfig = {
    cookieName: process.env.AUTH_COOKIE_NAME!,
    cookieSignatureKeys: [
        process.env.AUTH_COOKIE_SIGNATURE_KEY_CURRENT!,
        process.env.AUTH_COOKIE_SIGNATURE_KEY_PREVIOUS!,
    ],
    cookieSerializeOptions: {
        path: '/',
        httpOnly: true,
        secure: true, // Set this to false in local (non-HTTPS) development
        sameSite: 'lax' as const,
        maxAge: 12 * 60 * 60 * 24, // twelve days
    },
    serviceAccount: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        // Replace all `\n` occurrences with a new line
        privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
};
