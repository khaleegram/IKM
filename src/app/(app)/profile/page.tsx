
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, FileWarning, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useOrdersByCustomer, Order } from "@/lib/firebase/firestore/orders";
import { format } from 'date-fns';
import Link from "next/link";

const getStatusVariant = (status: Order['status']) => {
    switch (status) {
        case 'Processing': return 'secondary';
        case 'Shipped': return 'accent';
        case 'Delivered': return 'support';
        case 'Cancelled': return 'destructive';
        default: return 'default';
    }
}

export default function ProfilePage() {
  const { user } = useUser();
  const { data: orders, isLoading, error } = useOrdersByCustomer(user?.uid);

  const hasOrders = orders && orders.length > 0;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <header className="mb-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">My Orders</h1>
          <p className="text-muted-foreground">
            View your order history and track their status.
          </p>
        </div>
      </header>
      <main>
        {isLoading && (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )}
        {!isLoading && error && (
            <Card className="w-full text-center border-dashed shadow-none">
                <CardHeader>
                    <div className="mx-auto bg-destructive/10 rounded-full w-16 h-16 flex items-center justify-center">
                        <FileWarning className="w-8 h-8 text-destructive" />
                    </div>
                </CardHeader>
                <CardContent>
                    <CardTitle className="font-headline text-destructive">An Error Occurred</CardTitle>
                    <CardDescription className="mt-2">{error.message}</CardDescription>
                </CardContent>
            </Card>
        )}
        {!isLoading && !hasOrders && !error && (
          <Card className="w-full text-center border-dashed shadow-none">
            <CardHeader>
              <div className="mx-auto bg-secondary rounded-full w-16 h-16 flex items-center justify-center">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="font-headline">
                You haven't placed any orders yet
              </CardTitle>
              <CardDescription className="mt-2">
                Once you make a purchase, your orders will appear here.
              </CardDescription>
              <Link href="/" className="mt-4 inline-block">
                <Button>Start Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        )}
        {hasOrders && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id?.slice(0, 7)}</TableCell>
                      <TableCell>{format(order.createdAt.toDate(), 'PPP')}</TableCell>
                      <TableCell className="text-right">₦{order.total.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusVariant(order.status) as any}>{order.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
