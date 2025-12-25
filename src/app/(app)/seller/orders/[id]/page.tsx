
'use client';

import { OrderChat } from "@/components/order-chat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Order, useOrder } from "@/lib/firebase/firestore/orders";
import { updateOrderStatus } from "@/lib/order-actions";
import { markOrderAsSent } from "@/lib/order-delivery-actions";
import { format } from 'date-fns';
import { ArrowLeft, Loader2, MoreHorizontal, Send, Truck, Upload, X } from "lucide-react";
import Image from "next/image";
import { notFound, useParams, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { data: order, isLoading, error } = useOrder(orderId);
  const { toast } = useToast();
  const [showMarkSentDialog, setShowMarkSentDialog] = useState(false);
  const [sentPhotoUrl, setSentPhotoUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    notFound();
  }
  
  const handleStatusUpdate = async (status: Order['status']) => {
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

  const handleMarkAsSent = () => {
    startTransition(async () => {
      try {
        await markOrderAsSent({
          orderId,
          photoUrl: sentPhotoUrl || undefined,
        });
        toast({
          title: "Order Marked as Sent",
          description: "The customer has been notified.",
        });
        setShowMarkSentDialog(false);
        setSentPhotoUrl(null);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed",
          description: (error as Error).message,
        });
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'order-sent-photos');

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const { url } = await response.json();
        setSentPhotoUrl(url);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: (error as Error).message,
        });
      }
    });
  };


  return (
    <div className="flex flex-col h-full">
        <header className="p-3 sm:p-4 md:p-6 bg-background border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <div>
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold font-headline">Order #{order.id?.slice(0, 7) || orderId.slice(0, 7)}</h1>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            Placed on {format(order.createdAt.toDate(), 'PPP')}
                        </p>
                    </div>
                </div>
                 <div className="flex items-center gap-2 flex-wrap">
                    {order.status === 'Processing' && (
                      <Button 
                        onClick={() => setShowMarkSentDialog(true)}
                        size="sm"
                        className="flex-1 sm:flex-initial"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Mark as Sent
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
                        Print Invoice
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-9 w-9">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {order.status !== 'Cancelled' && order.status !== 'Completed' && (
                              <DropdownMenuItem className="text-destructive" onClick={() => handleStatusUpdate('Cancelled')}>Cancel Order</DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>

        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="md:col-span-2 space-y-4 sm:space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg sm:text-xl">Order Items</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 sm:p-6">
                            {/* Mobile Card View */}
                            <div className="block md:hidden divide-y">
                                {order.items.map((item, index) => (
                                    <div key={item.id || `item-${index}`} className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{item.name}</p>
                                                <p className="text-xs text-muted-foreground mt-1">Qty: {item.quantity}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">₦{(item.price * item.quantity).toLocaleString()}</p>
                                                <p className="text-xs text-muted-foreground">₦{item.price.toLocaleString()} each</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead className="text-center">Quantity</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {order.items.map((item, index) => (
                                            <TableRow key={item.id || `item-${index}`}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                <TableCell className="text-right">₦{item.price.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">₦{(item.price * item.quantity).toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                             <CardTitle className="text-lg sm:text-xl">Delivery Information</CardTitle>
                             <Truck className="w-5 h-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="font-semibold text-base sm:text-lg">{order.customerInfo.name}</p>
                            <p className="text-sm sm:text-base text-muted-foreground mt-1">{order.deliveryAddress}</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4 sm:space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Status</span>
                            <Badge variant={getStatusVariant(order.status) as any}>{order.status}</Badge>
                        </div>
                        <Separator />
                        {/* Calculate subtotal: total - shipping price (if shipping was charged) */}
                        {(() => {
                            const shippingPrice = order.shippingPrice || 0;
                            const subtotal = order.total - shippingPrice;
                            const shippingType = order.shippingType || 'delivery';
                            
                            return (
                                <>
                                    <div className="flex justify-between font-semibold">
                                        <span>Subtotal</span>
                                        <span>₦{subtotal.toLocaleString()}</span>
                                    </div>
                                    {/* Only show shipping if it was actually charged (not pickup/contact) */}
                                    {shippingType === 'delivery' && shippingPrice > 0 && (
                                        <div className="flex justify-between font-semibold">
                                            <span>Shipping</span>
                                            <span>₦{shippingPrice.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {shippingType === 'pickup' && (
                                        <div className="flex justify-between font-semibold text-green-600">
                                            <span>Pickup</span>
                                            <span>Free</span>
                                        </div>
                                    )}
                                    {(shippingType === 'contact' || (shippingType as string) === 'contact') && (
                                        <div className="flex justify-between font-semibold text-muted-foreground">
                                            <span>Arrangement</span>
                                            <span>Contact Seller</span>
                                        </div>
                                    )}
                                    {shippingType === 'delivery' && shippingPrice === 0 && (
                                        <div className="flex justify-between font-semibold text-green-600">
                                            <span>Shipping</span>
                                            <span>Free</span>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>₦{order.total.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Customer Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p className="font-medium">{order.customerInfo.name}</p>
                        <p className="text-muted-foreground">{order.customerInfo.email}</p>
                        <p className="text-muted-foreground">{order.customerInfo.phone}</p>
                    </CardContent>
                    </Card>
                </div>
            </div>

            {/* Order Chat */}
            <Card className="mt-4 sm:mt-6">
              <CardHeader>
                <CardTitle>Order Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderChat 
                  orderId={orderId}
                  sellerId={order.sellerId}
                  customerId={order.customerId}
                />
              </CardContent>
            </Card>
        </main>
        {/* Mark as Sent Dialog */}
        <Dialog open={showMarkSentDialog} onOpenChange={setShowMarkSentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Order as Sent</DialogTitle>
              <DialogDescription>
                Confirm that you have sent the item. You can optionally upload a photo of the packaged item.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {sentPhotoUrl && (
                <div className="relative">
                  <Image
                    src={sentPhotoUrl}
                    alt="Package photo"
                    width={300}
                    height={300}
                    className="rounded"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => setSentPhotoUrl(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="sent-photo-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('sent-photo-upload')?.click()}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {sentPhotoUrl ? 'Change Photo' : 'Upload Photo (Optional)'}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMarkSentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleMarkAsSent} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Marking...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Mark as Sent
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  )
}
