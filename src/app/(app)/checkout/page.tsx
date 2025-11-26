
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { CoPilotWidget } from '@/components/copilot-widget';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// Mock cart data
const cartItems = [
    { id: '1', name: 'Handmade Ankara Bag', price: 15000, quantity: 1 },
    { id: '3', name: 'Custom Print T-Shirt', price: 12000, quantity: 2 },
];

export default function CheckoutPage() {
    const router = useRouter();
    const { toast } = useToast();

    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = 2500; // Mock shipping cost
    const total = subtotal + shipping;

    const handlePlaceOrder = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: 'Order Placed!',
            description: "Thank you for your purchase. You'll receive a confirmation email shortly.",
        });
        router.push('/');
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
            <h1 className="text-3xl font-bold font-headline mb-6">Checkout</h1>
            <form onSubmit={handlePlaceOrder}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Delivery Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input id="firstName" placeholder="Mary" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input id="lastName" placeholder="Jane" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Delivery Address</Label>
                                    <Textarea id="address" placeholder="Enter your full delivery address or bus stop" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input id="email" type="email" placeholder="mary@example.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input id="phone" type="tel" placeholder="+234..." />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    This is a simulation. In a real application, a payment gateway like Paystack or Flutterwave would be integrated here.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-3">
                                    {cartItems.map(item => (
                                        <li key={item.id} className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold">{item.name}</p>
                                                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="font-medium">₦{(item.price * item.quantity).toLocaleString()}</p>
                                        </li>
                                    ))}
                                </ul>
                                <Separator />
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
                                <Button size="lg" type="submit" className="w-full mt-4">
                                    Place Order
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
            <CoPilotWidget />
        </div>
    );
}
