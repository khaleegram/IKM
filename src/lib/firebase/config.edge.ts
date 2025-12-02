
import { AuthOptions, ServiceAccount } from "next-firebase-auth-edge/lib/auth/types";

export const clientConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
};

export const serverConfig: {
    serviceAccount: ServiceAccount,
    cookieName: string,
    cookieSignatureKeys: string[],
    cookieSerializeOptions: AuthOptions['cookieSerializeOptions'],
} = {
    serviceAccount: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    },
    cookieName: 'auth-token',
    cookieSignatureKeys: [process.env.COOKIE_SIGNATURE_KEY_A!, process.env.COOKIE_SIGNATURE_KEY_B!],
    cookieSerializeOptions: {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 12 * 60 * 60 * 24, // 12 days
    },
};
