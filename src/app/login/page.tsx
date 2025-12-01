
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IkmLogo } from '@/components/icons';
import { useState, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { grantAdminRoleToFirstUser } from '@/lib/admin-actions';

export default function LoginPage() {
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleLogin = () => {
    startTransition(async () => {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Login Successful', description: "Welcome back!" });
        
        const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/seller/dashboard';
        router.push(redirectUrl);

      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
      }
    });
  };

  const handleSignUp = () => {
    startTransition(async () => {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create user profile in Firestore
        await setDoc(doc(firestore, "users", user.uid), {
            displayName: user.email?.split('@')[0] || 'New Seller',
            email: user.email,
            storeName: `${user.email?.split('@')[0]}'s Store`,
            storeDescription: 'Welcome to my new store!',
            whatsappNumber: ''
        });

        // Grant admin role if this is the first user
        await grantAdminRoleToFirstUser(user.uid);

        toast({ title: 'Account Created!', description: "Welcome! Let's get your store set up." });
        
        const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/seller/dashboard';
        router.push(redirectUrl);

      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Sign Up Failed', description: error.message });
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
                <IkmLogo />
              </Link>
            </div>
            <CardTitle className="text-2xl font-headline">Seller Hub Login</CardTitle>
            <CardDescription>Enter your credentials to manage your store</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 text-left">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
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
            <Button variant="outline" className="w-full" onClick={handleSignUp} disabled={isPending}>
              {isPending ? 'Creating Account...' : 'Create a Store'}
            </Button>
          </CardFooter>
        </Card>
        <div className="mt-4">
            <Link href="/">
                <Button variant="link">Back to Home</Button>
            </Link>
        </div>
      </main>
    </div>
  );
}
