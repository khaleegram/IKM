'use client';

import { DynamicLogo } from '@/components/DynamicLogo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebase } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { linkGuestOrdersToAccount } from '@/lib/guest-order-actions';
import { User, signInWithEmailAndPassword } from 'firebase/auth';
import { ArrowLeft, Home, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

export default function BuyerLoginPage() {
  const { auth } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleAuthSuccess = async (user: User) => {
    // Force a token refresh to get the latest claims from the server
    const idToken = await user.getIdToken(true);
    
    try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });

        // Check if response is actually JSON before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response from /api/login:', text.substring(0, 200));
          throw new Error(
            'Server returned an error page. Please check your environment variables and server logs. ' +
            'Ensure all Firebase environment variables are set in your .env.local file.'
          );
        }

        if (!response.ok) {
            const errorData = await response.json();
            
            // Handle network errors with user-friendly message
            if (errorData.isNetworkError || errorData.code === 'NETWORK_ERROR') {
                throw new Error(
                    'Unable to connect to authentication service. Please check your internet connection and try again.'
                );
            }
            
            throw new Error(errorData.error || 'Failed to create session.');
        }
        
        // Get admin status from server response (more reliable than client-side token)
        const responseData = await response.json();
        const isAdmin = responseData.isAdmin === true;
        
        // Force token refresh to sync custom claims on client
        await user.getIdToken(true);

        // Link any guest orders to this account
        try {
          await linkGuestOrdersToAccount();
        } catch (linkError) {
          console.error('Error linking guest orders:', linkError);
          // Don't block login if linking fails
        }

        toast({ title: 'Login Successful', description: "Welcome back!" });
        
        const redirectUrl = searchParams.get('redirect');
        if (isAdmin && (!redirectUrl || !redirectUrl.startsWith('/seller'))) {
            router.push('/admin/dashboard');
        } else if (redirectUrl) {
            router.push(redirectUrl);
        } else {
            router.push('/profile');
        }
    } catch (error) {
        console.error("Error creating session:", error);
        toast({ variant: 'destructive', title: 'Login Failed', description: (error as Error).message });
    }
  };


  const handleLogin = () => {
    startTransition(async () => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await handleAuthSuccess(userCredential.user);
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Login Failed', description: 'Invalid email or password.' });
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <main className="flex w-full flex-1 flex-col items-center justify-center px-4 text-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/" className="flex justify-center flex-1">
                <DynamicLogo />
              </Link>
              <div className="w-24" /> {/* Spacer for alignment */}
            </div>
            <CardTitle className="text-2xl font-headline flex items-center justify-center gap-2">
              <ShoppingBag className="h-6 w-6" />
              Buyer Login
            </CardTitle>
            <CardDescription>Sign in to track your orders and manage your account</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 text-left">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="buyer@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && email && password) {
                    handleLogin();
                  }
                }}
              />
            </div>
            <div className="grid gap-2 text-left">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && email && password) {
                    handleLogin();
                  }
                }}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" onClick={handleLogin} disabled={isPending}>
              {isPending ? 'Logging in...' : 'Login'}
            </Button>
            <div className="flex flex-col gap-2 text-sm">
              <div>
                Don't have an account?{' '}
                <Link href="/buyer-signup" className="underline">
                  Sign Up
                </Link>
              </div>
              <div className="pt-2 border-t flex items-center justify-between">
                <Link href="/login" className="text-muted-foreground hover:text-foreground text-xs">
                  Seller Login
                </Link>
                <Link href="/" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs">
                  <Home className="h-4 w-4" />
                  Browse Marketplace
                </Link>
              </div>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}

