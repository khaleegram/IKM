
'use client';

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
import { useState, useTransition } from 'react';
import { usePaystackPayment } from 'react-paystack';
import type { PaystackProps } from 'react-paystack/dist/types';

export default function CheckoutPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { cartItems, totalPrice, clearCart } = useCart();
    const { user } = useUser();
    const [isPending, startTransition] = useTransition();

    const shipping = cartItems.length > 0 ? 2500 : 0;
    const total = totalPrice + shipping;

    const [formState, setFormState] = useState({
        firstName: '',
        lastName: '',
        address: '',
        email: user?.email || '',
        phone: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
    };
    
    const isFormValid = formState.firstName && formState.lastName && formState.address && formState.email && formState.phone;

    const paystackConfig: PaystackProps = {
        reference: new Date().getTime().toString(),
        email: formState.email,
        amount: total * 100, // Paystack amount is in kobo
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    };
    
    const initializePayment = usePaystackPayment(paystackConfig);

    const onPaymentSuccess = (reference: any) => {
        startTransition(async () => {
            try {
                const response = await fetch('/api/verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        reference: reference.reference,
                        cartItems,
                        total,
                        deliveryAddress: formState.address,
                        customerInfo: {
                            name: `${formState.firstName} ${formState.lastName}`,
                            email: formState.email,
                            phone: formState.phone
                        }
                    }),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Payment verification failed.');
                }

                toast({
                    title: 'Order Placed!',
                    description: "Thank you for your purchase. Your payment was successful.",
                });
                clearCart();
                router.push('/');

            } catch (error) {
                toast({ variant: 'destructive', title: 'Order Failed', description: (error as Error).message });
            }
        });
    };

    const onPaymentClose = () => {
        toast({
            variant: 'destructive',
            title: 'Payment Cancelled',
            description: 'You closed the payment window without completing the transaction.',
        });
    };

    const handlePlaceOrder = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isFormValid) {
            toast({ variant: 'destructive', title: 'Incomplete Information', description: 'Please fill out all delivery details.' });
            return;
        }

        if (!user) {
            toast({ variant: 'destructive', title: 'Not Authenticated', description: 'Please log in to place an order.' });
            router.push('/login');
            return;
        }

        if (cartItems.length === 0) {
            toast({ variant: 'destructive', title: 'Empty Cart', description: 'Your cart is empty.' });
            return;
        }
        
        initializePayment({onSuccess: onPaymentSuccess, onClose: onPaymentClose});
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
                                <Button size="lg" type="submit" className="w-full mt-4" disabled={isPending || cartItems.length === 0 || !isFormValid}>
                                    {isPending ? 'Verifying Payment...' : `Confirm and Pay ₦${total.toLocaleString()}`}
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
