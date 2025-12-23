import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { CartProvider } from "@/lib/cart-context";
import { ErrorBoundaryWrapper } from "@/components/error-boundary-wrapper";
import { PT_Sans } from "next/font/google";
import "./globals.css";

const ptSans = PT_Sans({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pt-sans',
});

export const metadata: Metadata = {
  title: "IKM Marketplace",
  description: "Your one-stop marketplace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${ptSans.variable} font-body antialiased`}>
        <ErrorBoundaryWrapper>
          <FirebaseClientProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </FirebaseClientProvider>
        </ErrorBoundaryWrapper>
        <Toaster />
      </body>
    </html>
  );
}
