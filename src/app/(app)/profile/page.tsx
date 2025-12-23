
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
import { Package, FileWarning, Loader2, Eye, X, Search, Filter, CheckCircle, Upload, AlertTriangle } from "lucide-react";
import { updateOrderStatus } from "@/lib/order-actions";
import { markOrderAsReceived } from "@/lib/order-delivery-actions";
import { OpenDisputeDialog } from "@/components/open-dispute-dialog";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useOrdersByCustomer, Order } from "@/lib/firebase/firestore/orders";
import { format } from 'date-fns';
import Link from "next/link";
import { OrderTracking } from "@/components/order-tracking";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { useState, useTransition, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

const getStatusVariant = (status: Order['status']) => {
    switch (status) {
        case 'Processing': return 'secondary';
        case 'Sent': return 'accent';
        case 'Received': return 'support';
        case 'Completed': return 'support';
        case 'Cancelled': return 'destructive';
        case 'Disputed': return 'destructive';
        default: return 'default';
    }
}

export default function ProfilePage() {
  const { user } = useUser();
  const { data: orders, isLoading, error } = useOrdersByCustomer(user?.uid);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCancelling, startCancelTransition] = useTransition();
  const [isMarkingReceived, startMarkReceivedTransition] = useTransition();
  const [showMarkReceivedDialog, setShowMarkReceivedDialog] = useState(false);
  const [receivedPhotoUrl, setReceivedPhotoUrl] = useState<string | null>(null);
  const [orderToMarkReceived, setOrderToMarkReceived] = useState<Order | null>(null);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [orderToDispute, setOrderToDispute] = useState<Order | null>(null);
  const { toast } = useToast();
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'week' | 'month' | 'year'>('all');

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    let filtered = orders;
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.id?.toLowerCase().includes(term) ||
        order.items.some(item => item.name.toLowerCase().includes(term))
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (dateRange) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(order => {
        const orderDate = order.createdAt.toDate();
        return orderDate >= cutoffDate;
      });
    }
    
    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      const aDate = a.createdAt.toDate().getTime();
      const bDate = b.createdAt.toDate().getTime();
      return bDate - aDate;
    });
  }, [orders, searchTerm, statusFilter, dateRange]);

  const hasOrders = filteredOrders && filteredOrders.length > 0;

  const handleCancelOrder = (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    startCancelTransition(async () => {
      try {
        await updateOrderStatus(orderId, 'Cancelled');
        toast({
          title: "Order Cancelled",
          description: "Your order has been cancelled successfully.",
        });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Cancellation Failed', description: (error as Error).message });
      }
    });
  };

  const handleMarkAsReceived = (order: Order) => {
    setOrderToMarkReceived(order);
    setShowMarkReceivedDialog(true);
  };

  const confirmMarkAsReceived = () => {
    if (!orderToMarkReceived?.id) return;

    startMarkReceivedTransition(async () => {
      try {
        await markOrderAsReceived({
          orderId: orderToMarkReceived.id!,
          photoUrl: receivedPhotoUrl || undefined,
        });
        toast({
          title: "Order Marked as Received",
          description: "Thank you for confirming! Funds have been released to the seller.",
        });
        setShowMarkReceivedDialog(false);
        setReceivedPhotoUrl(null);
        setOrderToMarkReceived(null);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed",
          description: (error as Error).message,
        });
      }
    });
  };

  const handleReceivedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'order-received-photos');

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const { url } = await response.json();
      setReceivedPhotoUrl(url);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: (error as Error).message,
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
      <header className="mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline">My Orders</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View your order history and track their status.
          </p>
        </div>
      </header>
      
      {/* Filters and Search */}
      {orders && orders.length > 0 && (
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by order ID or product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Shipped">Shipped</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Received">Received</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Disputed">Disputed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchTerm || statusFilter !== 'all' || dateRange !== 'all') && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
          )}
        </div>
      )}
      
      <main>
        {isLoading && (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )}
        {!isLoading && error && (
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
        )}
        {!isLoading && !hasOrders && !error && orders && orders.length === 0 && (
          <Card className="w-full text-center border-dashed shadow-none">
            <CardHeader>
              <div className="mx-auto bg-secondary rounded-full w-16 h-16 flex items-center justify-center">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="font-headline">
                You haven't placed any orders yet
              </CardTitle>
              <CardDescription className="mt-2">
                Once you make a purchase, your orders will appear here.
              </CardDescription>
              <Link href="/" className="mt-4 inline-block">
                <Button>Start Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        )}
        {!isLoading && !error && orders && orders.length > 0 && filteredOrders.length === 0 && (
          <Card className="w-full text-center border-dashed shadow-none">
            <CardContent className="p-8">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <CardTitle className="font-headline">No orders match your filters</CardTitle>
              <CardDescription className="mt-2">
                Try adjusting your search or filter criteria.
              </CardDescription>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setDateRange('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
        {hasOrders && (
          <>
            {/* Mobile Card View */}
            <div className="block md:hidden space-y-3">
              {filteredOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={`/profile/orders/${order.id}`} className="font-semibold text-sm hover:underline">
                            #{order.id?.slice(0, 7)}
                          </Link>
                          <Badge variant={getStatusVariant(order.status) as any} className="text-xs">{order.status}</Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                              className="h-6 px-2"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {order.status === 'Sent' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsReceived(order)}
                                  disabled={isMarkingReceived}
                                  className="h-6 px-2 text-support hover:text-support"
                                  title="Mark as Received"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setOrderToDispute(order);
                                    setShowDisputeDialog(true);
                                  }}
                                  className="h-6 px-2 text-destructive hover:text-destructive"
                                  title="Open Dispute"
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            {order.status === 'Processing' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelOrder(order.id!)}
                                disabled={isCancelling}
                                className="h-6 px-2 text-destructive hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{format(order.createdAt.toDate(), 'MMM dd, yyyy')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">₦{order.total.toLocaleString()}</p>
                      </div>
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
                          <TableCell>{format(order.createdAt.toDate(), 'PPP')}</TableCell>
                          <TableCell className="text-right">₦{order.total.toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={getStatusVariant(order.status) as any}>{order.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Track
                              </Button>
                              {order.status === 'Sent' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMarkAsReceived(order)}
                                    disabled={isMarkingReceived}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark as Received
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setOrderToDispute(order);
                                      setShowDisputeDialog(true);
                                    }}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Open Dispute
                                  </Button>
                                </>
                              )}
                              {order.status === 'Processing' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelOrder(order.id!)}
                                  disabled={isCancelling}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              )}
                              <Link href={`/profile/orders/${order.id}`}>
                                <Button variant="ghost" size="sm">Details</Button>
                              </Link>
                            </div>
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

        {/* Order Tracking Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Tracking</DialogTitle>
              <DialogDescription>
                Track your order status and delivery information
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && <OrderTracking order={selectedOrder} />}
          </DialogContent>
        </Dialog>

        {/* Mark as Received Dialog */}
        <Dialog open={showMarkReceivedDialog} onOpenChange={setShowMarkReceivedDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Order as Received</DialogTitle>
              <DialogDescription>
                Confirm that you have received the item. You can optionally upload a photo of the received item.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {receivedPhotoUrl && (
                <div className="relative">
                  <Image
                    src={receivedPhotoUrl}
                    alt="Received item photo"
                    width={300}
                    height={300}
                    className="rounded"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => setReceivedPhotoUrl(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleReceivedImageUpload}
                  className="hidden"
                  id="received-photo-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('received-photo-upload')?.click()}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {receivedPhotoUrl ? 'Change Photo' : 'Upload Photo (Optional)'}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMarkReceivedDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmMarkAsReceived} disabled={isMarkingReceived}>
                {isMarkingReceived ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Received
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Open Dispute Dialog */}
        {orderToDispute && (
          <OpenDisputeDialog
            order={orderToDispute}
            open={showDisputeDialog}
            onOpenChange={(open) => {
              setShowDisputeDialog(open);
              if (!open) setOrderToDispute(null);
            }}
          />
        )}
      </main>
    </div>
  );
}
