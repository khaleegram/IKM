'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search, Mail, Phone, MapPin, ShoppingBag, DollarSign, Crown, User, UserPlus, Filter } from "lucide-react";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useOrdersBySeller } from "@/lib/firebase/firestore/orders";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface CustomerData {
  customerId: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: Date | null;
  firstOrderDate: Date | null;
  segment: 'VIP' | 'Regular' | 'New';
  deliveryAddress?: string;
}

export default function CustomersPage() {
  const { user } = useUser();
  const { data: orders, isLoading } = useOrdersBySeller(user?.uid);
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');

  // Process orders to create customer database
  const customers = useMemo(() => {
    if (!orders) return [];

    const customerMap = new Map<string, CustomerData>();

    orders.forEach((order) => {
      const customerId = order.customerId;
      const existing = customerMap.get(customerId);

      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += order.total;
        if (order.createdAt) {
          const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
          if (!existing.lastOrderDate || orderDate > existing.lastOrderDate) {
            existing.lastOrderDate = orderDate;
          }
          if (!existing.firstOrderDate || orderDate < existing.firstOrderDate) {
            existing.firstOrderDate = orderDate;
          }
        }
      } else {
        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt || Date.now());
        customerMap.set(customerId, {
          customerId,
          name: order.customerInfo?.name || 'Unknown',
          email: order.customerInfo?.email || '',
          phone: order.customerInfo?.phone || '',
          totalOrders: 1,
          totalSpent: order.total,
          lastOrderDate: orderDate,
          firstOrderDate: orderDate,
          deliveryAddress: order.deliveryAddress,
        });
      }
    });

    // Calculate segments
    const now = new Date();
    const customerArray = Array.from(customerMap.values()).map((customer) => {
      const daysSinceFirstOrder = customer.firstOrderDate
        ? Math.floor((now.getTime() - customer.firstOrderDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const daysSinceLastOrder = customer.lastOrderDate
        ? Math.floor((now.getTime() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      let segment: 'VIP' | 'Regular' | 'New' = 'New';
      if (customer.totalSpent >= 50000 || customer.totalOrders >= 10) {
        segment = 'VIP';
      } else if (daysSinceFirstOrder > 30 && customer.totalOrders >= 2) {
        segment = 'Regular';
      } else if (daysSinceFirstOrder <= 30) {
        segment = 'New';
      }

      return { ...customer, segment };
    });

    return customerArray.sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (customer) =>
          customer.name.toLowerCase().includes(query) ||
          customer.email.toLowerCase().includes(query) ||
          customer.phone.includes(query)
      );
    }

    // Segment filter
    if (segmentFilter !== 'all') {
      filtered = filtered.filter((customer) => customer.segment === segmentFilter);
    }

    return filtered;
  }, [customers, searchQuery, segmentFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const vip = customers.filter((c) => c.segment === 'VIP').length;
    const regular = customers.filter((c) => c.segment === 'Regular').length;
    const newCustomers = customers.filter((c) => c.segment === 'New').length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

    return { vip, regular, newCustomers, totalRevenue, total: customers.length };
  }, [customers]);

  const getSegmentBadge = (segment: string) => {
    switch (segment) {
      case 'VIP':
        return <Badge className="bg-purple-500"><Crown className="w-3 h-3 mr-1" />VIP</Badge>;
      case 'Regular':
        return <Badge variant="default"><User className="w-3 h-3 mr-1" />Regular</Badge>;
      case 'New':
        return <Badge variant="secondary"><UserPlus className="w-3 h-3 mr-1" />New</Badge>;
      default:
        return <Badge variant="outline">{segment}</Badge>;
    }
  };

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
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage and segment your customer database</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Customers</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>VIP Customers</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-500" />
              {stats.vip}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Regular Customers</CardDescription>
            <CardTitle className="text-2xl">{stats.regular}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>New Customers</CardDescription>
            <CardTitle className="text-2xl">{stats.newCustomers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl">₦{stats.totalRevenue.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Database</CardTitle>
          <CardDescription>Search and filter your customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Segments</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
                <SelectItem value="Regular">Regular</SelectItem>
                <SelectItem value="New">New</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Segment</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.customerId}>
                      <TableCell>
                        <div className="font-medium">{customer.name}</div>
                        {customer.deliveryAddress && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {customer.deliveryAddress}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="text-sm flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="text-sm flex items-center gap-2">
                              <Phone className="w-3 h-3" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getSegmentBadge(customer.segment)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                          {customer.totalOrders}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-medium">
                          <DollarSign className="w-4 h-4" />
                          ₦{customer.totalSpent.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.lastOrderDate
                          ? format(customer.lastOrderDate, 'MMM d, yyyy')
                          : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredCustomers.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredCustomers.length} of {customers.length} customers
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

