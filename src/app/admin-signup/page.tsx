
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
import { useFirebase } from '@/firebase/provider';
import { createAdminUser } from '@/lib/admin-actions';
import { DynamicLogo } from '@/components/DynamicLogo';

export default function AdminSignupPage() {
  const { auth } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSignUp = () => {
    startTransition(async () => {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // This server action creates the admin user and sets the claim
        await createAdminUser(user.uid, user.email!, user.email!.split('@')[0]);

        toast({ title: 'Admin Account Created!', description: "Redirecting to the admin dashboard." });
        
        // Ensure the ID token is refreshed to get the new custom claims
        await user.getIdToken(true);
        
        router.push('/admin/dashboard');

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
                <DynamicLogo />
              </Link>
            </div>
            <CardTitle className="text-2xl font-headline">Admin Account Creation</CardTitle>
            <CardDescription>Create a new administrator account.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 text-left">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2 text-left">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" onClick={handleSignUp} disabled={isPending}>
              {isPending ? 'Creating Account...' : 'Create Admin Account'}
            </Button>
          </CardFooter>
        </Card>
        <div className="mt-4">
            <Link href="/login">
                <Button variant="link">Back to Seller Login</Button>
            </Link>
        </div>
      </main>
    </div>
  );
}
