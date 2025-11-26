
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Loader2, ArrowLeft, MoreHorizontal, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useOrder, updateOrderStatus, Order } from "@/lib/firebase/firestore/orders";
import { useToast } from "@/hooks/use-toast";
import { notFound, useParams, useRouter } from "next/navigation";
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useFirebase } from "@/firebase";

const getStatusVariant = (status: Order['status']) => {
    switch (status) {
        case 'Processing': return 'secondary';
        case 'Shipped': return 'accent';
        case 'Delivered': return 'support';
        case 'Cancelled': return 'destructive';
        default: return 'default';
    }
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { firestore } = useFirebase();
  const { data: order, isLoading, error } = useOrder(orderId);
  const { toast } = useToast();

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
        await updateOrderStatus(firestore, orderId, status);
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


  return (
    <div className="flex flex-col h-full">
        <header className="p-4 sm:p-6 bg-background border-b flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Order #{order.id.slice(0, 7)}</h1>
                    <p className="text-muted-foreground">
                        Placed on {format(order.createdAt.toDate(), 'PPP')}
                    </p>
                </div>
            </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                    Print Invoice
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusUpdate('Processing')}>Mark as Processing</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate('Shipped')}>Mark as Shipped</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate('Delivered')}>Mark as Delivered</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleStatusUpdate('Cancelled')}>Cancel Order</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Order Items</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                                {order.items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                        <TableCell className="text-right">₦{item.price.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">₦{(item.price * item.quantity).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                         <CardTitle>Delivery Information</CardTitle>
                         <Truck className="w-5 h-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="font-semibold text-lg">{order.customerInfo.name}</p>
                        <p className="text-muted-foreground">{order.deliveryAddress}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
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
                        <div className="flex justify-between font-semibold">
                            <span>Subtotal</span>
                            <span>₦{(order.total - 2500).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                            <span>Shipping</span>
                            <span>₦{2500 .toLocaleString()}</span>
                        </div>
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
        </main>
    </div>
  )
}
