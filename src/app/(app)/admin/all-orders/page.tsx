
'use client';

import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type OrderStatus = 'Completed' | 'In Transit' | 'Disputed' | 'Needs Shipment';

const orders: {
  id: string;
  buyer: string;
  seller: string;
  rider: string;
  total: number;
  status: OrderStatus;
  statusVariant: 'support' | 'accent' | 'destructive' | 'secondary';
}[] = [
  { id: 'IKM54323', buyer: 'Amina Bello', seller: 'Amina\'s Creations', rider: 'Jide Okoro', total: 12500, status: 'In Transit', statusVariant: 'accent' },
  { id: 'IKM54322', buyer: 'Chinedu Eze', seller: 'KicksRepublic', rider: 'N/A', total: 8000, status: 'Needs Shipment', statusVariant: 'secondary' },
  { id: 'IKM54321', buyer: 'Bolu Adekunle', seller: 'ShoeHaven', rider: 'David Okon', total: 26500, status: 'Completed', statusVariant: 'support' },
  { id: 'IKM54320', buyer: 'Fatima Diallo', seller: 'The Artisan Shop', rider: 'Jide Okoro', total: 18500, status: 'Completed', statusVariant: 'support' },
  { id: 'IKM54319', buyer: 'Amina Bello', seller: 'KicksRepublic', rider: 'David Okon', total: 5500, status: 'Disputed', statusVariant: 'destructive' },
];

const statusBadgeVariant: { [key in OrderStatus]: 'support' | 'accent' | 'destructive' | 'secondary' } = {
  Completed: 'support',
  'In Transit': 'accent',
  Disputed: 'destructive',
  'Needs Shipment': 'secondary',
};

const statusBadgeClass: { [key in OrderStatus]: string } = {
    Completed: 'bg-support text-support-foreground',
    'In Transit': 'bg-accent text-accent-foreground',
    Disputed: 'bg-destructive text-destructive-foreground',
    'Needs Shipment': 'bg-secondary text-secondary-foreground'
}

export default function AllOrdersPage() {
  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 sm:p-6 bg-background border-b flex items-center gap-4 sticky top-0 z-10">
        <Link href="/admin">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-grow">
          <h1 className="text-xl font-bold font-headline">All Platform Orders</h1>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Search by Order ID, customer name..." className="pl-10" />
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex-grow">
                    <CardTitle className="text-lg font-headline hover:text-primary cursor-pointer">{order.id}</CardTitle>
                    <p className="text-sm text-muted-foreground">Buyer: {order.buyer}</p>
                  </div>
                  <Badge variant={statusBadgeVariant[order.status]} className={`${statusBadgeClass[order.status]}`}>{order.status}</Badge>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="text-sm text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1">
                      <p><span className="font-medium text-foreground">Seller:</span> {order.seller}</p>
                      <p><span className="font-medium text-foreground">Rider:</span> {order.rider}</p>
                  </div>
                  <p className="font-bold text-lg">Total: ₦{order.total.toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
