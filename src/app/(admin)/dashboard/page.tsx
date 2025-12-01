
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Users, DollarSign, Loader2, FileWarning } from "lucide-react";
import { useAllUserProfiles } from "@/lib/firebase/firestore/users";
import { useAllProducts } from "@/lib/firebase/firestore/products";
import { useAllOrders } from "@/lib/firebase/firestore/orders";
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AdminDashboardPage() {
  const { data: users, isLoading: isLoadingUsers, error: errorUsers } = useAllUserProfiles();
  const { data: products, isLoading: isLoadingProducts, error: errorProducts } = useAllProducts();
  const { data: orders, isLoading: isLoadingOrders, error: errorOrders } = useAllOrders();

  const isLoading = isLoadingUsers || isLoadingProducts || isLoadingOrders;
  const error = errorUsers || errorProducts || errorOrders;

  const totalRevenue = orders ? orders.reduce((acc, order) => acc + (order.total || 0), 0) : 0;
  const totalOrders = orders ? orders.length : 0;

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 bg-background border-b">
        <div>
            <h1 className="text-2xl font-bold font-headline">Admin Dashboard</h1>
            <p className="text-muted-foreground">Overall view of the IKM Marketplace.</p>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        {isLoading ? (
             <div className="flex items-center justify-center h-64">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        ) : error ? (
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
        ) : (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">from {totalOrders} orders</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{users.length}</div>
                            <p className="text-xs text-muted-foreground">Sellers & Customers</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{products.length}</div>
                             <p className="text-xs text-muted-foreground">Listed across all stores</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Users</CardTitle>
                        <CardDescription>A list of all users registered on the platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Store Name</TableHead>
                                <TableHead>Email</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{user.displayName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.storeName || 'N/A'}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        )}
      </main>
    </div>
  );
}
