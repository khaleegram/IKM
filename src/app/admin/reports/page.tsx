'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart2, 
  Download, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Calendar,
  FileText,
  Loader2
} from 'lucide-react';
import { useAllOrders } from '@/lib/firebase/firestore/orders';
import { useAllUserProfiles } from '@/lib/firebase/firestore/users';
import { useAllProducts } from '@/lib/firebase/firestore/products';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

export default function AdminReportsPage() {
  const { toast } = useToast();
  const { data: orders, isLoading: isLoadingOrders } = useAllOrders();
  const { data: users, isLoading: isLoadingUsers } = useAllUserProfiles();
  const { data: products, isLoading: isLoadingProducts } = useAllProducts();
  const [timeRange, setTimeRange] = useState('30');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const isLoading = isLoadingOrders || isLoadingUsers || isLoadingProducts;

  // Calculate date range
  const dateRange = useMemo(() => {
    if (timeRange === 'custom') {
      return {
        start: startOfDay(new Date(startDate)),
        end: endOfDay(new Date(endDate)),
      };
    }
    const days = parseInt(timeRange);
    const end = new Date();
    const start = subDays(end, days);
    return { start, end };
  }, [timeRange, startDate, endDate]);

  // Filter data by date range
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
    const days = timeRange === 'custom' 
      ? Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
      : parseInt(timeRange);
    
    const data: { date: string; revenue: number; orders: number }[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(dateRange.end, i);
      const dateStr = format(date, 'MMM d');
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayOrders = filteredOrders.filter((order) => {
        if (!order.createdAt) return false;
        const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });

      const revenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      data.push({
        date: dateStr,
        revenue,
        orders: dayOrders.length,
      });
    }

    return data;
  }, [filteredOrders, timeRange, dateRange]);

  // User growth data
  const userGrowthData = useMemo(() => {
    if (!users) return [];
    const days = timeRange === 'custom' 
      ? Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
      : parseInt(timeRange);
    
    const data: { date: string; users: number; cumulative: number }[] = [];
    let cumulative = 0;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(dateRange.end, i);
      const dateStr = format(date, 'MMM d');
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayUsers = users.filter((user) => {
        if (!user.createdAt) return false;
        const userDate = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
        return userDate >= dayStart && userDate <= dayEnd;
      });

      cumulative += dayUsers.length;
      data.push({
        date: dateStr,
        users: dayUsers.length,
        cumulative,
      });
    }

    return data;
  }, [users, timeRange, dateRange]);

  // Product performance
  const productPerformance = useMemo(() => {
    if (!products || !filteredOrders) return [];
    
    const productSales: Record<string, { name: string; sales: number; revenue: number }> = {};
    
    filteredOrders.forEach((order) => {
      order.items?.forEach((item: any) => {
        const productId = item.productId;
        const product = products.find(p => p.id === productId);
        if (product) {
          if (!productSales[productId]) {
            productSales[productId] = {
              name: product.name,
              sales: 0,
              revenue: 0,
            };
          }
          productSales[productId].sales += item.quantity || 1;
          productSales[productId].revenue += (item.price || 0) * (item.quantity || 1);
        }
      });
    });

    return Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [products, filteredOrders]);

  // Calculate totals
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = filteredOrders.length;
  const totalUsers = users?.length || 0;
  const totalProducts = products?.length || 0;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const handleExportCSV = () => {
    // Export orders to CSV
    const headers = ['Order ID', 'Date', 'Customer', 'Total', 'Status'];
    const rows = filteredOrders.map(order => [
      order.id || '',
      order.createdAt ? format(order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt), 'yyyy-MM-dd') : '',
      order.customerInfo?.name || '',
      (order.total || 0).toString(),
      order.status || '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Orders exported to CSV',
    });
  };

  const handleExportPDF = () => {
    toast({
      title: 'PDF Export',
      description: 'PDF export feature coming soon',
    });
  };

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 bg-background border-b">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
              <BarChart2 className="h-6 w-6" />
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground">Comprehensive analytics and reporting for the platform</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handleExportPDF} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label>Time Range</Label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {timeRange === 'custom' && (
                <>
                  <div className="flex-1">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {totalOrders} orders
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                Avg: ₦{averageOrderValue.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                All registered users
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                All listed products
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>Revenue and order volume over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="orders" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New user registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="#8884d8" />
                    <Line type="monotone" dataKey="cumulative" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Product Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best performing products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : productPerformance.length === 0 ? (
              <p className="text-muted-foreground text-center p-4">No product sales data available</p>
            ) : (
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" />
                    <Bar dataKey="sales" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

