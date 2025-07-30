
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Mock data, in a real app you'd fetch this based on params.id
const orderData = {
  id: 'IKM54321',
  date: '30-Jul-2025',
  seller: "The Artisan Shop",
  buyerName: 'Bolu Adekunle',
  deliveryAddress: '123 Adetokunbo Ademola Cres, Wuse II, Abuja, Nigeria',
  items: [
    { id: 1, name: 'Handmade Leather Boots', quantity: 1, price: 18500 },
    { id: 2, name: 'Woven Straw Hat', quantity: 1, price: 8000 },
  ],
  deliveryFee: 2500,
  riderName: 'Jide Okoro',
  vatRate: 0.075,
  paymentMethod: 'Visa',
  paymentCard: '**** 4242',
};

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();

    const subtotal = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const vatAmount = subtotal * orderData.vatRate;
    const totalPaid = subtotal + orderData.deliveryFee + vatAmount;

    return (
        <div className="flex flex-col h-full bg-muted/40">
        <header className="p-4 sm:p-6 bg-background border-b flex items-center gap-4 sticky top-0 z-10">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-grow">
            <h1 className="text-xl font-bold font-headline">Order Details</h1>
            </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between gap-2">
                        <div>
                            <CardTitle className="font-headline text-lg sm:text-xl">Order ID: {orderData.id}</CardTitle>
                            <p className="text-sm text-muted-foreground">Placed on {orderData.date}</p>
                        </div>
                        <Button variant="ghost" size="icon">
                            <Download className="h-5 w-5"/>
                            <span className="sr-only">Download Invoice</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                            <h3 className="font-semibold text-muted-foreground">Sold By</h3>
                            <p>{orderData.seller}</p>
                        </div>
                         <div className="space-y-1">
                            <h3 className="font-semibold text-muted-foreground">Shipped To</h3>
                            <p>{orderData.buyerName}</p>
                            <p className="text-muted-foreground">{orderData.deliveryAddress}</p>
                        </div>
                    </div>
                    
                    <Separator />

                    <div>
                        <h3 className="font-semibold text-muted-foreground mb-3">Items</h3>
                        <ul className="space-y-3">
                            {orderData.items.map(item => (
                                <li key={item.id} className="flex justify-between items-start text-sm">
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-muted-foreground">Qty: {item.quantity} x ₦{item.price.toLocaleString()}</p>
                                    </div>
                                    <p className="font-medium text-right">₦{(item.quantity * item.price).toLocaleString()}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <Separator />

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <p className="text-muted-foreground">Subtotal</p>
                            <p>₦{subtotal.toLocaleString()}</p>
                        </div>
                         <div className="flex justify-between">
                            <p className="text-muted-foreground">Delivery Fee (via {orderData.riderName})</p>
                            <p>₦{orderData.deliveryFee.toLocaleString()}</p>
                        </div>
                         <div className="flex justify-between">
                            <p className="text-muted-foreground">VAT ({(orderData.vatRate * 100).toFixed(1)}%)</p>
                            <p>₦{vatAmount.toLocaleString()}</p>
                        </div>
                        <Separator />
                         <div className="flex justify-between font-bold text-base">
                            <p>Total Paid</p>
                            <p>₦{totalPaid.toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <Separator />

                    <div className="text-sm">
                         <h3 className="font-semibold text-muted-foreground mb-1">Payment</h3>
                         <p>Paid with {orderData.paymentMethod} ending in {orderData.paymentCard}</p>
                    </div>


                </CardContent>
                <CardFooter className="p-4 sm:p-6 bg-muted/50 flex-col sm:flex-row gap-3">
                    <Button variant="outline" className="w-full sm:w-auto">
                        <HelpCircle className="mr-2" /> Get Help With Order
                    </Button>
                    <Button className="w-full sm:w-auto ml-auto" variant="secondary">Rate this transaction</Button>
                </CardFooter>
            </Card>
            </div>
        </main>
        </div>
    );
}
