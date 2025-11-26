import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { CartProvider } from "@/lib/cart-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "IKM Marketplace",
  description: "Your one-stop marketplace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider config={firebaseConfig}>
          <CartProvider>
            {children}
          </CartProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
