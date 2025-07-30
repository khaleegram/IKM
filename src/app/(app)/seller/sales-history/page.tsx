
'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, Package, Truck, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const needsShipmentSales = [
  { id: 'IKM54322', date: '01-Aug-2025', product: 'Classic Leather Watch', payout: '16650', status: 'Needs Shipment', statusVariant: 'destructive' },
];

const inTransitSales = [
    { id: 'IKM54323', date: '02-Aug-2025', product: 'Wireless Headphones', payout: '5850', status: 'In Transit', statusVariant: 'accent' },
];

const completedSales = [
    { id: 'IKM54321', date: '30-Jul-2025', product: 'Handmade Ceramic Mug', payout: '22500', status: 'Completed', statusVariant: 'support' },
    { id: 'IKM54320', date: '25-Jul-2025', product: 'Artisan Coffee Beans', payout: '14800', status: 'Completed', statusVariant: 'support' },
];

type Sale = {
    id: string;
    date: string;
    product: string;
    payout: string;
    status: string;
    statusVariant: "destructive" | "accent" | "support";
}

const SaleCard = ({ sale }: { sale: Sale }) => (
  <Card>
    <CardHeader className="p-4 flex flex-row items-start justify-between gap-4">
      <div>
        <CardTitle className="text-lg font-headline">{sale.id}</CardTitle>
        <p className="text-sm text-muted-foreground">Sold on {sale.date}</p>
      </div>
      <Badge variant={sale.statusVariant === "support" ? "default" : sale.statusVariant} className={`text-xs ${sale.statusVariant === 'support' ? 'bg-support text-support-foreground' : ''}`}>{sale.status}</Badge>
    </CardHeader>
    <CardContent className="p-4 pt-0 space-y-2">
        <p className="text-sm text-muted-foreground">{sale.product}</p>
        <p className="font-bold text-lg text-primary">Your Payout: ₦{parseInt(sale.payout).toLocaleString()}</p>
    </CardContent>
    <CardFooter className="p-4 pt-0">
      <Link href={`/buyer/orders/${sale.id}`} className="w-full">
        <Button variant="outline" className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            View Order Details
        </Button>
      </Link>
    </CardFooter>
  </Card>
);

export default function SalesHistoryPage() {
  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 sm:p-6 bg-background border-b flex items-center gap-4">
        <Link href="/seller">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold font-headline">My Sales History</h1>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="completed">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="needs-shipment">
                <Package className="mr-2 h-4 w-4 sm:hidden" />
                <span>Needs Shipment</span>
              </TabsTrigger>
               <TabsTrigger value="in-transit">
                <Truck className="mr-2 h-4 w-4 sm:hidden" />
                <span>In Transit</span>
              </TabsTrigger>
              <TabsTrigger value="completed">
                <CheckCircle className="mr-2 h-4 w-4 sm:hidden" />
                <span>Completed</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="needs-shipment" className="mt-6">
              <div className="space-y-4">
                {needsShipmentSales.map((sale) => (
                  <SaleCard key={sale.id} sale={sale} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="in-transit" className="mt-6">
              <div className="space-y-4">
                {inTransitSales.map((sale) => (
                  <SaleCard key={sale.id} sale={sale} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="completed" className="mt-6">
              <div className="space-y-4">
                {completedSales.map((sale) => (
                  <SaleCard key={sale.id} sale={sale} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
