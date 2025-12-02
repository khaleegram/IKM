
import { AuthOptions, ServiceAccount } from "next-firebase-auth-edge/lib/auth/types";

export const clientConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
};

// Safely handle the private key
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
if (!privateKey) {
    throw new Error("FIREBASE_ADMIN_PRIVATE_KEY environment variable is not set.");
}

const serviceAccount: ServiceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: privateKey.replace(/\\n/g, '\n'),
};

export const serverConfig: AuthOptions = {
    serviceAccount,
    apiKey: clientConfig.apiKey,
    cookieName: 'auth-token',
    cookieSignatureKeys: [process.env.COOKIE_SIGNATURE_KEY_A!, process.env.COOKIE_SIGNATURE_KEY_B!],
    cookieSerializeOptions: {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        maxAge: 12 * 60 * 60 * 24, // 12 days
    },
};
