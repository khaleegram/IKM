
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
import { useFirebase } from '@/firebase/provider';
import { grantAdminRoleToFirstUser } from '@/lib/admin-actions';
import { createUserProfile } from '@/lib/user-actions';
import { DynamicLogo } from '@/components/DynamicLogo';
import { Home, ArrowLeft } from 'lucide-react';

export default function SignupPage() {
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();

  // Check if Firebase is initialized
  if (!auth || !firestore) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">Firebase is not initialized. Please refresh the page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAuthSuccess = async (user: User) => {
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
            throw new Error(errorData.error || 'Failed to create session.');
        }
        
        toast({ title: 'Account Created!', description: "Welcome! Let's get your store set up." });
        router.push('/seller/onboarding');

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

        if (password.length < 6) {
          toast({ variant: 'destructive', title: 'Invalid Password', description: 'Password must be at least 6 characters long.' });
          return;
        }

        console.log('Step 1: Creating user account...');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('Step 1: ✅ User created successfully:', user.uid);
        
        // Create the user profile in Firestore via server action
        console.log('Step 2: Creating user profile via server action...');
        try {
          await createUserProfile(user.uid, user.email || email);
          console.log('Step 2: ✅ User profile created successfully');
        } catch (profileError: any) {
          console.error('Step 2: ❌ Profile creation error:', profileError);
          // Don't block signup if profile creation fails - it can be created later
          toast({
            variant: 'default',
            title: 'Account Created',
            description: 'Your account was created. Profile setup had an issue but you can continue.',
          });
        }

        // This server action checks if it's the first user and makes them an admin if so.
        // Run this in the background - don't wait for it
        console.log('Step 3: Checking admin role (background)...');
        grantAdminRoleToFirstUser(user.uid).then(() => {
          console.log('Step 3: Admin role check completed');
        }).catch((adminError: any) => {
          console.error('Step 3: Admin role error (non-critical):', adminError);
        });
        
        // Log the user in and create a session
        console.log('Step 4: Creating session...');
        try {
          await handleAuthSuccess(user);
          console.log('Step 4: Session created successfully - signup complete!');
        } catch (sessionError: any) {
          console.error('Step 4: Session creation error:', sessionError);
          console.error('Step 4: Session error details:', {
            message: sessionError.message,
            code: sessionError.code,
            stack: sessionError.stack
          });
          
          // If session creation fails, still show success but warn user
          toast({
            variant: 'default',
            title: 'Account Created!',
            description: 'Your account was created successfully. However, there was an issue creating your session. Please try logging in manually.',
          });
          router.push('/login');
          return;
        }

      } catch (error: any) {
        console.error('Signup error:', error);
        if (error.code === 'auth/email-already-in-use') {
            toast({
                variant: 'destructive',
                title: 'Sign Up Failed',
                description: 'This email is already in use. Please log in instead.',
            });
        } else if (error.code === 'auth/weak-password') {
            toast({
                variant: 'destructive',
                title: 'Sign Up Failed',
                description: 'Password is too weak. Please use a stronger password.',
            });
        } else if (error.code === 'auth/invalid-email') {
            toast({
                variant: 'destructive',
                title: 'Sign Up Failed',
                description: 'Invalid email address. Please check your email and try again.',
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Sign Up Failed',
                description: error.message || 'An unexpected error occurred. Please try again.',
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
            <CardTitle className="text-2xl font-headline">Create a New Store</CardTitle>
            <CardDescription>Join our community of local sellers and start your business today.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }} className="space-y-4">
              <div className="grid gap-2 text-left">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  disabled={isPending}
                />
              </div>
              <div className="grid gap-2 text-left">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  minLength={6}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">Password must be at least 6 characters</p>
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Creating Account...' : 'Create My Store'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 text-sm">
              <div>
                Already have an account?{' '}
                <Link href="/login" className="underline">
                  Login
                </Link>
              </div>
              <div className="pt-2 border-t">
                <Link href="/" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
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
