
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { grantAdminRoleToFirstUser } from '@/lib/admin-actions';
import { DynamicLogo } from '@/components/DynamicLogo';

export default function SignupPage() {
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleAuthSuccess = async (user: User) => {
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
        
        toast({ title: 'Account Created!', description: "Welcome! Let's get your store set up." });
        router.push('/seller/dashboard');

    } catch (error) {
        console.error("Error creating session:", error);
        toast({ variant: 'destructive', title: 'Login Failed After Signup', description: (error as Error).message });
    }
  };

  const handleSignUp = () => {
    startTransition(async () => {
      try {
        if (!email || !password) {
          toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please enter both email and password.' });
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create the user profile in Firestore
        await setDoc(doc(firestore, "users", user.uid), {
            displayName: user.email?.split('@')[0] || 'New Seller',
            email: user.email,
            storeName: `${user.email?.split('@')[0]}'s Store`,
            storeDescription: 'Welcome to my new store!',
            whatsappNumber: ''
        });

        // This server action checks if it's the first user and makes them an admin if so.
        await grantAdminRoleToFirstUser(user.uid);
        
        // Log the user in and create a session
        await handleAuthSuccess(user);

      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            toast({
                variant: 'destructive',
                title: 'Sign Up Failed',
                description: 'This email is already in use. Please log in instead.',
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Sign Up Failed',
                description: error.message,
            });
        }
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
            <CardTitle className="text-2xl font-headline">Create a New Store</CardTitle>
            <CardDescription>Join our community of local sellers and start your business today.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 text-left">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2 text-left">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" onClick={handleSignUp} disabled={isPending}>
              {isPending ? 'Creating Account...' : 'Create My Store'}
            </Button>
            <div className="text-sm">
                Already have an account?{' '}
                <Link href="/login" className="underline">
                    Login
                </Link>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
