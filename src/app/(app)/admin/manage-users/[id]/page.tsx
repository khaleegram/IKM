
'use client';

import Link from 'next/link';
import { ArrowLeft, Briefcase, Mail, Phone, User, ShieldAlert, KeyRound, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const user = {
  id: 'usr1',
  name: 'Bolu Adekunle',
  email: 'bolu.adekunle@example.com',
  phone: '08012345678',
  role: 'Seller',
  joinDate: '15-Jun-2025',
  avatar: 'https://placehold.co/150x150.png',
};

const activityFeed = [
  { id: 1, text: "Listed new product 'Handmade Leather Boots'.", time: "2h ago" },
  { id: 2, text: "Received payout of ₦15,500 for order #IKM54320.", time: "1d ago" },
  { id: 3, text: "Updated store bio.", time: "3d ago" },
  { id: 4, text: "Completed order #IKM54315.", time: "4d ago" },
];

export default function UserDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 sm:p-6 bg-background border-b flex items-center gap-4 sticky top-0 z-10">
        <Link href="/admin/manage-users">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold font-headline">{user.name}</h1>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person portrait" />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="space-y-2 text-center sm:text-left">
                <CardTitle className="text-2xl font-headline">{user.name}</CardTitle>
                <p className="text-muted-foreground">Joined: {user.joinDate}</p>
                <div className="flex flex-col sm:flex-row gap-x-4 gap-y-1 text-sm text-muted-foreground pt-1">
                    <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {user.email}</span>
                    <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {user.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {activityFeed.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <li className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm">{item.text}</p>
                        <p className="text-xs text-muted-foreground">{item.time}</p>
                      </div>
                    </li>
                    {index < activityFeed.length -1 && <Separator />}
                  </React.Fragment>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-lg">Admin Actions</CardTitle>
              <CardDescription>Perform administrative tasks for this user.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button variant="outline">
                <ShieldAlert className="mr-2" /> Suspend User
              </Button>
              <Button variant="outline">
                <KeyRound className="mr-2" /> Reset Password
              </Button>
              <Button variant="destructive">
                <Trash2 className="mr-2" /> Delete User
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
