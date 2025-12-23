
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
import { Package, MoreHorizontal, FileWarning, Search, Filter, Calendar, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useOrdersBySeller, Order } from "@/lib/firebase/firestore/orders";
import { updateOrderStatus } from "@/lib/order-actions";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";

const getStatusVariant = (status: Order['status']) => {
    switch (status) {
        case 'Processing': return 'secondary';
        case 'Shipped': return 'accent';
        case 'Delivered': return 'support';
        case 'Cancelled': return 'destructive';
        default: return 'default';
    }
}

export default function OrdersPage() {
  const { user } = useUser();
  const { data: orders, isLoading, error } = useOrdersBySeller(user?.uid);
  const { toast } = useToast();

  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    return orders.filter(order => {
      // Search filter (order ID, customer name, email)
      const matchesSearch = !searchTerm || 
        order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerInfo.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      // Date filter
      let matchesDate = true;
      if (dateFilter !== 'all' && order.createdAt) {
        const orderDate = order.createdAt.toDate();
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case 'today':
            matchesDate = daysDiff === 0;
            break;
          case 'week':
            matchesDate = daysDiff <= 7;
            break;
          case 'month':
            matchesDate = daysDiff <= 30;
            break;
          default:
            matchesDate = true;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchTerm, statusFilter, dateFilter]);

  // Calculate analytics
  const analytics = useMemo(() => {
    if (!filteredOrders) return null;
    
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const statusCounts = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      statusCounts,
    };
  }, [filteredOrders]);

  const handleStatusUpdate = async (orderId: string, status: Order['status']) => {
    try {
        await updateOrderStatus(orderId, status);
        toast({
            title: "Order Updated",
            description: `Order has been marked as ${status}.`
        })
    } catch(err) {
        toast({
            variant: "destructive",
            title: "Update failed",
            description: (err as Error).message,
        })
    }
  }

  const hasOrders = filteredOrders && filteredOrders.length > 0;

  return (
    <div className="flex flex-col h-full">
      <header className="p-3 sm:p-4 md:p-6 bg-background border-b">
        <div className="mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-headline">Orders</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              View and manage customer orders.
            </p>
          </div>
        </div>
        
        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-muted-foreground">Total Revenue</div>
                <div className="text-lg sm:text-2xl font-bold mt-1">₦{analytics.totalRevenue.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-muted-foreground">Total Orders</div>
                <div className="text-lg sm:text-2xl font-bold mt-1">{analytics.totalOrders}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-muted-foreground">Avg Order Value</div>
                <div className="text-lg sm:text-2xl font-bold mt-1">₦{Math.round(analytics.avgOrderValue).toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-muted-foreground">Processing</div>
                <div className="text-lg sm:text-2xl font-bold mt-1">{analytics.statusCounts['Processing'] || 0}</div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by order ID, customer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Processing">Processing</SelectItem>
              <SelectItem value="Shipped">Shipped</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        {isLoading && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        {!isLoading && error && (
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
        {!isLoading && !hasOrders && !error && (
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-lg text-center border-dashed shadow-none">
              <CardHeader>
                <div className="mx-auto bg-secondary rounded-full w-16 h-16 flex items-center justify-center">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="font-headline">
                  {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                    ? 'No orders match your filters' 
                    : 'You have no orders yet'}
                </CardTitle>
                <CardDescription className="mt-2">
                  {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'When a customer places an order, it will appear here.'}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        )}
        {hasOrders && (
          <>
            {/* Mobile Card View */}
            <div className="block md:hidden space-y-3">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">#{order.id?.slice(0, 7)}</p>
                          <Badge variant={getStatusVariant(order.status) as any} className="text-xs">{order.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{order.customerInfo.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{format(order.createdAt.toDate(), 'MMM dd, yyyy')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">₦{order.total.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3 border-t">
                      <Link href={`/seller/orders/${order.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">View Details</Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStatusUpdate(order.id!, 'Processing')}>Mark as Processing</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(order.id!, 'Shipped')}>Mark as Shipped</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(order.id!, 'Delivered')}>Mark as Delivered</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleStatusUpdate(order.id!, 'Cancelled')}>Cancel Order</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Desktop Table View */}
            <Card className="hidden md:block">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id?.slice(0, 7)}</TableCell>
                          <TableCell>{order.customerInfo.name}</TableCell>
                          <TableCell>{format(order.createdAt.toDate(), 'PPP')}</TableCell>
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
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(order.id!, 'Processing')}>Mark as Processing</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(order.id!, 'Shipped')}>Mark as Shipped</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusUpdate(order.id!, 'Delivered')}>Mark as Delivered</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleStatusUpdate(order.id!, 'Cancelled')}>Cancel Order</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                           </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
