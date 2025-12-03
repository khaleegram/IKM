
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
import { Package, FileWarning, Loader2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAllOrders, Order } from "@/lib/firebase/firestore/orders";
import { useAllUserProfiles } from "@/lib/firebase/firestore/users";
import { format } from 'date-fns';
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMemo } from "react";

const getStatusVariant = (status: Order['status']) => {
    switch (status) {
        case 'Processing': return 'secondary';
        case 'Shipped': return 'accent';
        case 'Delivered': return 'support';
        case 'Cancelled': return 'destructive';
        default: return 'default';
    }
}

export default function AdminOrdersPage() {
  const { data: orders, isLoading, error } = useAllOrders();
  const { data: users, isLoading: isLoadingUsers } = useAllUserProfiles();

  const usersById = useMemo(() => {
    if (!users) return {};
    return users.reduce((acc, user) => {
      acc[user.id!] = user;
      return acc;
    }, {} as Record<string, typeof users[0]>);
  }, [users]);


  const hasOrders = orders && orders.length > 0;
  const pageIsLoading = isLoading || isLoadingUsers;

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 bg-background border-b flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">All Orders</h1>
          <p className="text-muted-foreground">Manage all orders placed on the marketplace.</p>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        {pageIsLoading && (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )}
        {!pageIsLoading && error && (
            <div className="flex items-center justify-center h-full">
                <Card className="w-full max-w-lg text-center border-dashed shadow-none">
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
            </div>
        )}
        {!pageIsLoading && !hasOrders && !error && (
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-lg text-center border-dashed shadow-none">
              <CardHeader>
                <div className="mx-auto bg-secondary rounded-full w-16 h-16 flex items-center justify-center">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="font-headline">
                  No orders have been placed yet
                </CardTitle>
                <CardDescription className="mt-2">
                  When a customer places an order, it will appear here.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        )}
        {hasOrders && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <Link href={`/seller/orders/${order.id}`} className="hover:underline">
                            #{order.id?.slice(0, 7)}
                        </Link>
                      </TableCell>
                      <TableCell>{format(order.createdAt.toDate(), 'PPP')}</TableCell>
                      <TableCell>{order.customerInfo.name}</TableCell>
                      <TableCell>{usersById[order.sellerId]?.storeName || 'Unknown Seller'}</TableCell>
                      <TableCell className="text-right">₦{order.total.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusVariant(order.status) as any}>{order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/seller/orders/${order.id}`}>View Details</Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
