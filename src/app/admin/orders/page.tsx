
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, FileWarning, Loader2, MoreHorizontal, Download, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const usersById = useMemo(() => {
    if (!users) return {};
    return users.reduce((acc, user) => {
      acc[user.id!] = user;
      return acc;
    }, {} as Record<string, typeof users[0]>);
  }, [users]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(order => {
      const matchesSearch = !searchTerm || 
        order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      const matchesDate = (!startDate && !endDate) || (() => {
        if (!order.createdAt) return true;
        const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
        if (startDate && orderDate < new Date(startDate)) return false;
        if (endDate && orderDate > new Date(endDate + 'T23:59:59')) return false;
        return true;
      })();
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchTerm, statusFilter, startDate, endDate]);

  const hasOrders = filteredOrders && filteredOrders.length > 0;
  const pageIsLoading = isLoading || isLoadingUsers;

  const handleExportCSV = () => {
    if (!filteredOrders) return;

    const headers = ['Order ID', 'Date', 'Customer', 'Seller', 'Total', 'Status'];
    const rows = filteredOrders.map(order => [
      order.id || '',
      order.createdAt ? format(order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt), 'yyyy-MM-dd') : '',
      order.customerInfo?.name || '',
      usersById[order.sellerId]?.storeName || 'Unknown',
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

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 bg-background border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold font-headline">All Orders</h1>
            <p className="text-muted-foreground">Manage all orders placed on the marketplace.</p>
          </div>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="all">All Statuses</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {pageIsLoading && (
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
        {!pageIsLoading && filteredOrders.length === 0 && !error && (
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-lg text-center border-dashed shadow-none">
              <CardHeader>
                <div className="mx-auto bg-secondary rounded-full w-16 h-16 flex items-center justify-center">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="font-headline">
                  {searchTerm || statusFilter !== 'all' || startDate || endDate
                    ? 'No orders match your filters'
                    : 'No orders have been placed yet'}
                </CardTitle>
                <CardDescription className="mt-2">
                  {searchTerm || statusFilter !== 'all' || startDate || endDate
                    ? 'Try adjusting your search or filter criteria.'
                    : 'When a customer places an order, it will appear here.'}
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
                  {filteredOrders.map((order) => (
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
