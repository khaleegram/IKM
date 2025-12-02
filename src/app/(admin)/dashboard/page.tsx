
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import React from 'react';

// This new component will be responsible for fetching and displaying stats.
// This isolates data fetching from the main page component.
function DashboardStats() {
  const { data: users, isLoading: isLoadingUsers, error: errorUsers } = useAllUserProfiles();
  const { data: products, isLoading: isLoadingProducts, error: errorProducts } = useAllProducts();
  const { data: orders, isLoading: isLoadingOrders, error: errorOrders } = useAllOrders();

  const isLoading = isLoadingUsers || isLoadingProducts || isLoadingOrders;
  const combinedError = errorUsers || errorProducts || errorOrders;

  // Safely calculate totals
  const totalRevenue = orders ? orders.reduce((acc, order) => acc + (order?.total || 0), 0) : 0;
  const totalOrders = orders ? orders.length : 0;
  const totalUsers = users ? users.length : 0;
  const totalProducts = products ? products.length : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading dashboard data...</p>
      </div>
    );
  }

  if (combinedError) {
    return (
        <Card className="w-full text-center border-dashed shadow-none">
            <CardHeader>
                <div className="mx-auto bg-destructive/10 rounded-full w-16 h-16 flex items-center justify-center">
                    <FileWarning className="w-8 h-8 text-destructive" />
                </div>
            </CardHeader>
            <CardContent>
                <CardTitle className="font-headline text-destructive">A Data Fetching Error Occurred</CardTitle>
                <CardDescription className="mt-2 max-w-lg mx-auto">
                    Could not load all dashboard data, which might be due to Firestore security rules. The error was: <br />
                    <pre className="mt-2 p-2 bg-muted rounded-md text-left text-xs break-all whitespace-pre-wrap">{combinedError.message}</pre>
                </CardDescription>
            </CardContent>
        </Card>
    );
  }

  return (
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
                    <div className="text-2xl font-bold">{totalUsers}</div>
                    <p className="text-xs text-muted-foreground">Sellers & Customers</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalProducts}</div>
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
                        {(users || []).map((user) => (
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
                 {(users?.length || 0) === 0 && (
                    <div className="text-center p-8 text-muted-foreground">
                        No users have signed up yet.
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}


// The main page component is now very simple.
// It renders the shell and the child component that does the work.
// This prevents the whole page from 404-ing if data fetching fails.
export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 bg-background border-b">
        <div>
            <h1 className="text-2xl font-bold font-headline">Admin Dashboard</h1>
            <p className="text-muted-foreground">Overall view of the IKM Marketplace.</p>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <DashboardStats />
      </main>
    </div>
  );
}
