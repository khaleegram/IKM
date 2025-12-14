
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword, User } from 'firebase/auth';
import { useFirebase } from '@/firebase/provider';
import { DynamicLogo } from '@/components/DynamicLogo';

export default function LoginPage() {
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

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create session.');
        }
        
        const idTokenResult = await user.getIdTokenResult(true);
        const isAdmin = idTokenResult.claims.isAdmin === true;

        toast({ title: 'Login Successful', description: "Welcome back!" });
        
        const redirectUrl = searchParams.get('redirect');
        if (isAdmin && (!redirectUrl || !redirectUrl.startsWith('/seller'))) {
            router.push('/admin/dashboard');
        } else if (redirectUrl) {
            router.push(redirectUrl);
        } else {
            router.push('/seller/dashboard');
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
            <div className="flex justify-center">
              <Link href="/">
                <DynamicLogo />
              </Link>
            </div>
            <CardTitle className="text-2xl font-headline">Seller Hub Login</CardTitle>
            <CardDescription>Enter your credentials to manage your store</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 text-left">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seller@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2 text-left">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" onClick={handleLogin} disabled={isPending}>
              {isPending ? 'Logging in...' : 'Login'}
            </Button>
            <div className="text-sm">
                Don't have an account?{' '}
                <Link href="/signup" className="underline">
                    Create a Store
                </Link>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
