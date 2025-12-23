'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, ShoppingCart, Users, Package, TrendingDown, MapPin } from "lucide-react";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useOrdersBySeller } from "@/lib/firebase/firestore/orders";
import { useProductsBySeller } from "@/lib/firebase/firestore/products";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AnalyticsPage() {
  const { user } = useUser();
  const { data: orders, isLoading: isLoadingOrders } = useOrdersBySeller(user?.uid);
  const { data: products, isLoading: isLoadingProducts } = useProductsBySeller(user?.uid);
  const [timeRange, setTimeRange] = useState('30'); // days

  const isLoading = isLoadingOrders || isLoadingProducts;

  // Calculate date range
  const dateRange = useMemo(() => {
    const days = parseInt(timeRange);
    const end = new Date();
    const start = subDays(end, days);
    return { start, end };
  }, [timeRange]);

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((order) => {
      if (!order.createdAt) return false;
      const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      return orderDate >= dateRange.start && orderDate <= dateRange.end;
    });
  }, [orders, dateRange]);

  // Revenue chart data
  const revenueData = useMemo(() => {
    const days = parseInt(timeRange);
    const data: { date: string; revenue: number; orders: number }[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'MMM d');
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayOrders = filteredOrders.filter((order) => {
        if (!order.createdAt) return false;
        const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });

      const revenue = dayOrders.reduce((sum, order) => sum + order.total, 0);
      data.push({
        date: dateStr,
        revenue,
        orders: dayOrders.length,
      });
    }

    return data;
  }, [filteredOrders, timeRange]);

  // Conversion data
  const conversionData = useMemo(() => {
    const totalVisitors = 1000; // Placeholder - would come from analytics
    const totalOrders = filteredOrders.length;
    const conversionRate = totalVisitors > 0 ? (totalOrders / totalVisitors) * 100 : 0;

    return {
      totalVisitors,
      totalOrders,
      conversionRate,
    };
  }, [filteredOrders]);

  // Product performance
  const productPerformance = useMemo(() => {
    if (!products || !filteredOrders) return [];

    const productMap = new Map<string, { name: string; sales: number; revenue: number }>();

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = productMap.get(item.productId || item.id || '');
        if (existing) {
          existing.sales += item.quantity;
          existing.revenue += item.price * item.quantity;
        } else {
          productMap.set(item.productId || item.id || '', {
            name: item.name,
            sales: item.quantity,
            revenue: item.price * item.quantity,
          });
        }
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [products, filteredOrders]);

  // Geographic data (from delivery addresses)
  const geographicData = useMemo(() => {
    const locationMap = new Map<string, number>();

    filteredOrders.forEach((order) => {
      if (order.deliveryAddress) {
        // Extract state/city from address (simplified)
        const parts = order.deliveryAddress.split(',');
        const location = parts[parts.length - 1]?.trim() || 'Unknown';
        locationMap.set(location, (locationMap.get(location) || 0) + 1);
      }
    });

    return Array.from(locationMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredOrders]);

  // Key metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalProducts = products?.length || 0;
    const uniqueCustomers = new Set(filteredOrders.map((o) => o.customerId)).size;

    // Calculate growth (compare first half vs second half of period)
    const midpoint = Math.floor(filteredOrders.length / 2);
    const firstHalfRevenue = filteredOrders.slice(0, midpoint).reduce((sum, order) => sum + order.total, 0);
    const secondHalfRevenue = filteredOrders.slice(midpoint).reduce((sum, order) => sum + order.total, 0);
    const revenueGrowth = firstHalfRevenue > 0 
      ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 
      : 0;

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      totalProducts,
      uniqueCustomers,
      revenueGrowth,
    };
  }, [filteredOrders, products]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into your store performance</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{metrics.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {metrics.revenueGrowth >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
              )}
              {Math.abs(metrics.revenueGrowth).toFixed(1)}% from previous period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: ₦{metrics.averageOrderValue.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.uniqueCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {conversionData.conversionRate.toFixed(2)}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active products
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Orders Over Time</CardTitle>
              <CardDescription>Daily revenue and order count</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                      name="Revenue (₦)"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.6}
                      name="Orders"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>Visitor to customer conversion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Visitors</span>
                    <span className="font-bold">{conversionData.totalVisitors.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Orders</span>
                    <span className="font-bold">{conversionData.totalOrders}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="font-bold text-lg">{conversionData.conversionRate.toFixed(2)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
                <CardDescription>Breakdown by order status</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Completed', value: filteredOrders.filter((o) => o.status === 'Completed').length },
                          { name: 'Processing', value: filteredOrders.filter((o) => o.status === 'Processing').length },
                          { name: 'Sent', value: filteredOrders.filter((o) => o.status === 'Sent').length },
                          { name: 'Received', value: filteredOrders.filter((o) => o.status === 'Received').length },
                          { name: 'Cancelled', value: filteredOrders.filter((o) => o.status === 'Cancelled').length },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[0, 1, 2, 3, 4].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Revenue</CardTitle>
              <CardDescription>Best performing products</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue (₦)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Orders by location</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={geographicData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="#82ca9d" name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

