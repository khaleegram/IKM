
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
import { useCart } from '@/lib/cart-context';
import { useUser } from '@/lib/firebase/auth/use-user';
import { createOrder, Order } from '@/lib/firebase/firestore/orders';
import { useState, useTransition } from 'react';

export default function CheckoutPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { cartItems, totalPrice, clearCart } = useCart();
    const { user } = useUser();
    const [isPending, startTransition] = useTransition();

    // In a real app, shipping would be calculated based on address, etc.
    const shipping = cartItems.length > 0 ? 2500 : 0;
    const total = totalPrice + shipping;

    const [formState, setFormState] = useState({
        firstName: '',
        lastName: '',
        address: '',
        email: '',
        phone: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
    };

    const handlePlaceOrder = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user) {
            toast({ variant: 'destructive', title: 'Not Authenticated', description: 'Please log in to place an order.' });
            router.push('/login');
            return;
        }

        if (cartItems.length === 0) {
             toast({ variant: 'destructive', title: 'Empty Cart', description: 'Your cart is empty.' });
            return;
        }

        startTransition(async () => {
             // In a real multi-seller marketplace, you would group items by seller and create separate orders.
             // For this MVP, we assume all items come from the first item's seller.
            const sellerId = cartItems[0].sellerId;
            
            const orderData: Omit<Order, 'id' | 'createdAt'> = {
                customerId: user.uid,
                sellerId: sellerId,
                items: cartItems.map(({ id, name, price, quantity, sellerId }) => ({ id, name, price, quantity, sellerId })),
                total: total,
                status: 'Processing',
                deliveryAddress: formState.address,
                customerInfo: {
                    name: `${formState.firstName} ${formState.lastName}`,
                    email: formState.email,
                    phone: formState.phone
                }
            };
            
            try {
                await createOrder(orderData);
                toast({
                    title: 'Order Placed!',
                    description: "Thank you for your purchase. You'll receive a confirmation email shortly.",
                });
                clearCart();
                router.push('/');
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Order Failed', description: (error as Error).message });
            }
        });
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
                                        <Input id="firstName" placeholder="Mary" value={formState.firstName} onChange={handleInputChange} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input id="lastName" placeholder="Jane" value={formState.lastName} onChange={handleInputChange} required/>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Delivery Address</Label>
                                    <Textarea id="address" placeholder="Enter your full delivery address or bus stop" value={formState.address} onChange={handleInputChange} required />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input id="email" type="email" placeholder="mary@example.com" value={formState.email} onChange={handleInputChange} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input id="phone" type="tel" placeholder="+234..." value={formState.phone} onChange={handleInputChange} required/>
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
                                {cartItems.length > 0 ? (
                                    <>
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
                                            <p className="font-semibold">₦{totalPrice.toLocaleString()}</p>
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
                                    </>
                                ) : (
                                    <p className="text-muted-foreground text-center">Your cart is empty.</p>
                                )}
                                <Button size="lg" type="submit" className="w-full mt-4" disabled={isPending || cartItems.length === 0}>
                                    {isPending ? 'Placing Order...' : 'Place Order'}
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
