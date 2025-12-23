
'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Package, Plus, ShoppingCart, TrendingUp, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useProductsBySeller } from "@/lib/firebase/firestore/products";
import { useOrdersBySeller } from "@/lib/firebase/firestore/orders";
import { useStoreByUserId } from "@/lib/firebase/firestore/stores";
import { useUserProfile } from "@/lib/firebase/firestore/users";
import { StoreSetupProgress } from "@/components/store-setup-progress";
import { initializeStore } from "@/lib/store-actions";
import { createUserProfile } from "@/lib/user-actions";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from "recharts";
import { format, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SellerDashboardPage() {
  const { user: authUser } = useUser();
  const router = useRouter();
  const { data: store, isLoading: isLoadingStore } = useStoreByUserId(authUser?.uid);
  const { data: userProfile, isLoading: isLoadingProfile } = useUserProfile(authUser?.uid);
  const { data: products, isLoading: isLoadingProducts } = useProductsBySeller(authUser?.uid);
  const { data: orders, isLoading: isLoadingOrders } = useOrdersBySeller(authUser?.uid);

  // Initialize user profile and store if they don't exist
  useEffect(() => {
    if (!authUser?.uid || !authUser.email) return;
    if (isLoadingProfile || isLoadingStore) return;
    
    const initialize = async () => {
      try {
        // Create user profile if missing
        if (!userProfile && authUser.email) {
          await createUserProfile(authUser.uid, authUser.email);
        }
        
        // Create store if missing
        if (!store) {
          await initializeStore(authUser.uid);
          // The real-time listener should pick it up automatically
        }
      } catch (error) {
        // Silently handle initialization errors - they're expected in some cases
      }
    };
    
    // Only initialize if something is missing
    if (!userProfile || !store) {
      initialize();
    }
  }, [authUser?.uid, authUser?.email, isLoadingProfile, isLoadingStore, userProfile, store]);

  const isLoading = isLoadingStore || isLoadingProducts || isLoadingOrders;

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalSales = orders?.reduce((acc, order) => acc + (order.total || 0), 0) || 0;
    const totalOrders = orders?.length || 0;
    const totalProducts = products?.length || 0;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    // Low stock products (stock <= 5)
    const lowStockProducts = products?.filter(p => p.stock <= 5 && p.stock > 0) || [];
    const outOfStockProducts = products?.filter(p => p.stock === 0) || [];
    
    // Recent orders (last 5)
    const recentOrders = orders
      ?.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
        const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
        return bTime - aTime;
      })
      .slice(0, 5) || [];
    
    // Sales chart data (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayOrders = orders?.filter(order => {
        const orderDate = order.createdAt?.toDate?.();
        if (!orderDate) return false;
        return format(orderDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      }) || [];
      const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      return {
        date: format(date, 'MMM dd'),
        revenue: dayRevenue,
        orders: dayOrders.length,
      };
    });
    
    return {
      totalSales,
      totalOrders,
      totalProducts,
      averageOrderValue,
      lowStockProducts,
      outOfStockProducts,
      recentOrders,
      salesChartData: last7Days,
    };
  }, [orders, products]);


  return (
    <div className="flex flex-col h-full">
      <header className="p-3 sm:p-4 md:p-6 bg-background border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
              <h1 className="text-xl sm:text-2xl font-bold font-headline">{store?.storeName || "Seller Dashboard"}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Here's an overview of your store's performance.</p>
          </div>
          <Link href="/seller/products/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Product
              </Button>
          </Link>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {/* Store Setup Progress Card - Always show, with skeleton if loading */}
        {isLoadingStore ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-2 w-full mb-4" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <StoreSetupProgress store={store} />
        )}
        
        {/* Stats Grid */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-3 w-40" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="text-xl sm:text-2xl font-bold">₦{metrics.totalSales.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">from {metrics.totalOrders} orders</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="text-xl sm:text-2xl font-bold">{metrics.totalOrders}</div>
                  <p className="text-xs text-muted-foreground mt-1">All time orders</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Order</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="text-xl sm:text-2xl font-bold">₦{metrics.averageOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  <p className="text-xs text-muted-foreground mt-1">Per order</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="text-xl sm:text-2xl font-bold">{metrics.totalProducts}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics.lowStockProducts.length > 0 && (
                      <span className="text-destructive">{metrics.lowStockProducts.length} low stock</span>
                    )}
                    {metrics.lowStockProducts.length === 0 && metrics.outOfStockProducts.length === 0 && (
                      <span>Currently listed</span>
                    )}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Alerts */}
        {(metrics.lowStockProducts.length > 0 || metrics.outOfStockProducts.length > 0) && !isLoading && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Inventory Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {metrics.outOfStockProducts.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    <strong>{metrics.outOfStockProducts.length}</strong> product{metrics.outOfStockProducts.length > 1 ? 's' : ''} out of stock
                  </span>
                  <Link href="/seller/products">
                    <Button variant="outline" size="sm">Manage</Button>
                  </Link>
                </div>
              )}
              {metrics.lowStockProducts.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    <strong>{metrics.lowStockProducts.length}</strong> product{metrics.lowStockProducts.length > 1 ? 's' : ''} running low
                  </span>
                  <Link href="/seller/products">
                    <Button variant="outline" size="sm">Manage</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Charts and Recent Orders */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {/* Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>Revenue for the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <ChartContainer
                  config={{
                    revenue: {
                      label: "Revenue",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[200px]"
                >
                  <AreaChart data={metrics.salesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest customer orders</CardDescription>
                </div>
                <Link href="/seller/orders">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : metrics.recentOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {metrics.recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/seller/orders/${order.id}`}
                      className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">#{order.id?.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.customerInfo.name} • {format(order.createdAt?.toDate?.() || new Date(), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₦{order.total.toLocaleString()}</p>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
