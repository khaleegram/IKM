
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/lib/cart-context';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function CartPage() {
    const { cartItems, updateQuantity, removeFromCart, totalPrice } = useCart();
    
    // Shipping will be calculated on checkout page based on selected address and shipping option
    // Don't show shipping here - it will be calculated on checkout
    const total = totalPrice;

    const hasItems = cartItems.length > 0;

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
            <h1 className="text-2xl sm:text-3xl font-bold font-headline mb-4 sm:mb-6">Shopping Cart</h1>
            {hasItems ? (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardContent className="p-0">
                                <ul className="divide-y divide-border">
                                    {cartItems.map((item) => (
                                        <li key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center p-3 sm:p-4 gap-3 sm:gap-4">
                                            <Image
                                                src={item.imageUrl || `https://picsum.photos/seed/${item.id}/200/200`}
                                                alt={item.name}
                                                width={100}
                                                height={100}
                                                className="rounded-lg object-cover aspect-square w-full sm:w-24 h-24 shrink-0"
                                            />
                                            <div className="flex-grow w-full sm:w-auto">
                                                <p className="font-semibold text-sm sm:text-base">{item.name}</p>
                                                <p className="text-muted-foreground text-xs sm:text-sm mt-1">₦{item.price.toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                                                <div className="flex items-center gap-2">
                                                    <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => updateQuantity(item.id!, item.quantity - 1)}>
                                                        <Minus className="h-4 w-4" />
                                                    </Button>
                                                    <Input type="number" value={item.quantity} readOnly className="w-16 h-9 text-center" />
                                                    <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => updateQuantity(item.id!, item.quantity + 1)}>
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-sm sm:text-base">₦{(item.price * item.quantity).toLocaleString()}</p>
                                                    <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive h-9 w-9" onClick={() => removeFromCart(item.id!)}>
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                    <div>
                        <Card className="sticky top-4">
                            <CardHeader>
                                <CardTitle className="text-lg sm:text-xl">Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 p-4 sm:p-6">
                                <div className="flex justify-between">
                                    <p className="text-muted-foreground">Subtotal</p>
                                    <p className="font-semibold">₦{totalPrice.toLocaleString()}</p>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <p>Shipping</p>
                                    <p>Calculated at checkout</p>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <p>Subtotal</p>
                                    <p>₦{total.toLocaleString()}</p>
                                </div>
                                <p className="text-xs text-muted-foreground text-center">
                                    Shipping and total will be calculated on checkout
                                </p>
                                <Link href="/checkout" className="w-full">
                                    <Button size="lg" className="w-full mt-4 text-base sm:text-lg">
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
        </div>
    );
}
