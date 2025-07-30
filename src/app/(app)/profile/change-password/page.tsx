
'use client';

import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

export default function ChangePasswordPage() {
  const { toast } = useToast();

  const handleUpdatePassword = () => {
    toast({
        title: "✅ Password Updated",
        description: "Your password has been changed successfully.",
        duration: 5000,
    })
  }

  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 sm:p-6 bg-background border-b flex items-center gap-4">
        <Link href="/profile">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold font-headline">Change Password</h1>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="items-center text-center">
                <div className="p-4 bg-primary/10 rounded-full w-fit">
                    <Lock className="h-8 w-8 text-primary" />
                </div>
              <CardTitle className="font-headline text-2xl pt-2">Set a New Password</CardTitle>
              <CardDescription>
                Your new password must be different from previous passwords.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" />
                </div>
                <div className="space-y-2">
                    <Label>Password Strength</Label>
                    <Progress value={100} className="h-2 [&>div]:bg-support" />
                    <p className="text-xs text-support font-medium">Strong</p>
                </div>
              <div className="pt-4">
                <Button size="lg" className="w-full" onClick={handleUpdatePassword}>
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
