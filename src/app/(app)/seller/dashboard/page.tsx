
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Package, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useProductsBySeller } from "@/lib/firebase/firestore/products";
import { useOrdersBySeller } from "@/lib/firebase/firestore/orders";
import { useUserProfile } from "@/lib/firebase/firestore/users";

export default function SellerDashboardPage() {
  const { user: authUser } = useUser();
  const { data: userProfile, isLoading: isLoadingProfile } = useUserProfile(authUser?.uid);
  const { data: products, isLoading: isLoadingProducts } = useProductsBySeller(authUser?.uid);
  const { data: orders, isLoading: isLoadingOrders } = useOrdersBySeller(authUser?.uid);

  const isLoading = isLoadingProfile || isLoadingProducts || isLoadingOrders;

  const totalSales = orders?.reduce((acc, order) => acc + (order.total || 0), 0) || 0;
  const totalProducts = products?.length || 0;

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 bg-background border-b flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold font-headline">{userProfile?.storeName || "Seller Dashboard"}</h1>
            <p className="text-muted-foreground">Here's an overview of your store's performance.</p>
        </div>
        <Link href="/seller/products/new">
            <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add New Product
            </Button>
        </Link>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        {isLoading ? (
             <div className="flex items-center justify-center h-64">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₦{totalSales.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">from {orders?.length || 0} orders</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProducts}</div>
                        <p className="text-xs text-muted-foreground">Currently listed in your store</p>
                    </CardContent>
                </Card>
            </div>
        )}
      </main>
    </div>
  );
}
