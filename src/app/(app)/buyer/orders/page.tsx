
'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, Package, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const completedOrders = [
  { id: 'IKM54321', date: '30-Jul-2025', total: '26500', status: 'Delivered', statusVariant: 'support' },
  { id: 'IKM54320', date: '25-Jul-2025', total: '18500', status: 'Delivered', statusVariant: 'support' },
];

const ongoingOrders = [
    { id: 'IKM54322', date: '01-Aug-2025', total: '12000', status: 'Shipped', statusVariant: 'accent' },
];

const cancelledOrders = [
    { id: 'IKM54319', date: '22-Jul-2025', total: '8000', status: 'Cancelled', statusVariant: 'destructive' },
];

type Order = {
    id: string;
    date: string;
    total: string;
    status: string;
    statusVariant: "support" | "accent" | "destructive";
}

const OrderCard = ({ order }: { order: Order }) => (
  <Card>
    <CardHeader className="p-4 flex flex-row items-start justify-between gap-4">
      <div>
        <CardTitle className="text-lg font-headline">{order.id}</CardTitle>
        <p className="text-sm text-muted-foreground">Placed on {order.date}</p>
      </div>
      <Badge variant={order.statusVariant === "support" ? "default" : order.statusVariant} className={`text-xs ${order.statusVariant === 'support' ? 'bg-support text-support-foreground' : ''}`}>{order.status}</Badge>
    </CardHeader>
    <CardContent className="p-4 pt-0">
        <p className="font-bold text-lg text-primary">Total: ₦{parseInt(order.total).toLocaleString()}</p>
    </CardContent>
    <CardFooter className="p-4 pt-0">
      <Button variant="outline" className="w-full">
        <FileText className="mr-2 h-4 w-4" />
        View Details
      </Button>
    </CardFooter>
  </Card>
);

export default function OrderHistoryPage() {
  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 sm:p-6 bg-background border-b flex items-center gap-4">
        <Link href="/buyer">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold font-headline">My Orders</h1>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="completed">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ongoing">
                <Package className="mr-2 h-4 w-4 sm:hidden" />
                <span>Ongoing</span>
              </TabsTrigger>
              <TabsTrigger value="completed">
                <FileText className="mr-2 h-4 w-4 sm:hidden" />
                <span>Completed</span>
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                <XCircle className="mr-2 h-4 w-4 sm:hidden" />
                <span>Cancelled</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="ongoing" className="mt-6">
              <div className="space-y-4">
                {ongoingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="completed" className="mt-6">
              <div className="space-y-4">
                {completedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </TabsContent>
             <TabsContent value="cancelled" className="mt-6">
              <div className="space-y-4">
                {cancelledOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
