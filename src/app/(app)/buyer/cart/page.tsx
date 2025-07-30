
'use client';

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const cartItems = [
  {
    id: 1,
    name: "Classic Leather Watch",
    price: 18500,
    image: "https://placehold.co/100x100.png",
    hint: "watch",
    quantity: 1,
  },
  {
    id: 2,
    name: "Wireless Headphones",
    price: 6500,
    image: "https://placehold.co/100x100.png",
    hint: "headphones",
    quantity: 1,
  },
];

export default function ShoppingCartPage() {

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal; // Assuming delivery is calculated later

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Link href="/buyer">
            <Button variant="ghost" size="icon">
                <ArrowLeft />
            </Button>
            </Link>
            <h1 className="text-xl font-bold font-headline">My Cart</h1>
        </div>
        <Button variant="ghost" size="icon">
            <ShoppingCart />
        </Button>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <Card>
                        <CardContent className="p-0">
                           <ul className="divide-y divide-border">
                             {cartItems.map(item => (
                                <li key={item.id} className="flex items-center gap-4 p-4">
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        width={80}
                                        height={80}
                                        className="rounded-md object-cover"
                                        data-ai-hint={item.hint}
                                    />
                                    <div className="flex-grow">
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-sm text-primary">₦{item.price.toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2 border rounded-md">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="w-8 text-center">{item.quantity}</span>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                                        <Trash2 className="h-5 w-5"/>
                                    </Button>
                                </li>
                             ))}
                           </ul>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>₦{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Delivery Fee</span>
                                <span>Calculated at checkout</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>₦{total.toLocaleString()}</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                           <Link href="/buyer/checkout" className="w-full">
                                <Button size="lg" className="w-full">Proceed to Checkout</Button>
                           </Link>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
