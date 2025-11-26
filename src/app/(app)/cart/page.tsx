
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { CoPilotWidget } from '@/components/copilot-widget';

// Mock cart data
const cartItems = [
    { id: '1', name: 'Handmade Ankara Bag', price: 15000, image: '1', quantity: 1 },
    { id: '3', name: 'Custom Print T-Shirt', price: 12000, image: '3', quantity: 2 },
];


export default function CartPage() {
    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = 2500; // Mock shipping cost
    const total = subtotal + shipping;

    const hasItems = cartItems.length > 0;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
            <h1 className="text-3xl font-bold font-headline mb-6">Shopping Cart</h1>
            {hasItems ? (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardContent className="p-0">
                                <ul className="divide-y divide-border">
                                    {cartItems.map((item) => (
                                        <li key={item.id} className="flex items-center p-4 gap-4">
                                            <Image
                                                src={`https://picsum.photos/seed/${item.image}/200/200`}
                                                alt={item.name}
                                                width={100}
                                                height={100}
                                                className="rounded-lg object-cover aspect-square"
                                            />
                                            <div className="flex-grow">
                                                <p className="font-semibold">{item.name}</p>
                                                <p className="text-muted-foreground text-sm">₦{item.price.toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button size="icon" variant="outline" className="h-8 w-8">
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <Input type="number" value={item.quantity} readOnly className="w-14 h-8 text-center" />
                                                <Button size="icon" variant="outline" className="h-8 w-8">
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <p className="font-semibold w-24 text-right">₦{(item.price * item.quantity).toLocaleString()}</p>
                                            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive">
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <p className="text-muted-foreground">Subtotal</p>
                                    <p className="font-semibold">₦{subtotal.toLocaleString()}</p>
                                </div>
                                <div className="flex justify-between">
                                    <p className="text-muted-foreground">Shipping</p>
                                    <p className="font-semibold">₦{shipping.toLocaleString()}</p>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <p>Total</p>
                                    <p>₦{total.toLocaleString()}</p>
                                </div>
                                <Link href="/checkout" className="w-full">
                                    <Button size="lg" className="w-full mt-4">
                                        Proceed to Checkout
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg">
                    <ShoppingCart className="w-16 h-16 text-muted-foreground" />
                    <h2 className="mt-6 text-xl font-semibold">Your cart is empty</h2>
                    <p className="mt-2 text-muted-foreground">Looks like you haven't added anything to your cart yet.</p>
                    <Link href="/" className="mt-6">
                        <Button>Continue Shopping</Button>
                    </Link>
                </div>
            )}
            <CoPilotWidget />
        </div>
    );
}
