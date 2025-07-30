
'use client';

import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type UserRole = 'Buyer' | 'Seller' | 'Rider';
type UserStatus = 'Active' | 'Suspended';

const users: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  statusVariant: 'support' | 'destructive';
}[] = [
  { id: 'usr1', name: 'Bolu Adekunle', email: 'bolu.adekunle@example.com', role: 'Seller', status: 'Active', statusVariant: 'support' },
  { id: 'usr2', name: 'Amina Bello', email: 'amina.bello@example.com', role: 'Buyer', status: 'Active', statusVariant: 'support' },
  { id: 'usr3', name: 'Jide Okoro', email: 'jide.okoro@example.com', role: 'Rider', status: 'Active', statusVariant: 'support' },
  { id: 'usr4', name: 'Chinedu Eze', email: 'chinedu.eze@example.com', role: 'Buyer', status: 'Suspended', statusVariant: 'destructive' },
  { id: 'usr5', name: 'Fatima Diallo', email: 'fatima.diallo@example.com', role: 'Seller', status: 'Active', statusVariant: 'support' },
];

const roleBadgeVariant: { [key in UserRole]: 'default' | 'secondary' | 'accent' } = {
  Buyer: 'secondary',
  Seller: 'default',
  Rider: 'accent',
};

export default function ManageUsersPage() {
  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 sm:p-6 bg-background border-b flex items-center gap-4 sticky top-0 z-10">
        <Link href="/admin">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-grow">
          <h1 className="text-xl font-bold font-headline">Manage Users</h1>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Search by name or email..." className="pl-10" />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary">All</Button>
                <Button variant="outline">Buyers</Button>
                <Button variant="outline">Sellers</Button>
                <Button variant="outline">Riders</Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 space-y-4">
            {users.map((user) => (
              <Link key={user.id} href={`/admin/manage-users/${user.id}`}>
                <Card className="hover:bg-muted/50 cursor-pointer">
                  <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold">{user.name}</p>
                        <Badge variant={roleBadgeVariant[user.role]}>{user.role}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant={user.statusVariant} className={`${user.statusVariant === 'support' ? 'bg-support text-support-foreground' : ''}`}>{user.status}</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
