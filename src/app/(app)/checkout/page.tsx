
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
import { useState, useTransition, useEffect } from 'react';
import { usePaystackPayment } from 'react-paystack';
import type { PaystackProps } from 'react-paystack/dist/types';
import { useUserAddresses } from '@/lib/firebase/firestore/addresses';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Plus, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePaymentState } from '@/lib/payment-state';
import { verifyPaymentAndCreateOrder } from '@/lib/payment-actions';
import { applyDiscountCode } from '@/lib/discount-actions';
import { Tag, X } from 'lucide-react';

export default function CheckoutPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { cartItems, totalPrice, clearCart } = useCart();
    const { user } = useUser();
    const { data: addresses } = useUserAddresses(user?.uid);
    const [isPending, startTransition] = useTransition();
    const { 
        currentPayment, 
        createPaymentAttempt, 
        updatePaymentStatus,
        clearPaymentState 
    } = usePaymentState();

    const shipping = cartItems.length > 0 ? 2500 : 0;
    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
    const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
    const [discountError, setDiscountError] = useState('');

    const subtotal = totalPrice + shipping;
    const discountAmount = appliedDiscount?.amount || 0;
    const total = Math.max(0, subtotal - discountAmount);

    const defaultAddress = addresses?.find(a => a.isDefault) || addresses?.[0];

    const [formState, setFormState] = useState({
        firstName: defaultAddress?.firstName || '',
        lastName: defaultAddress?.lastName || '',
        address: defaultAddress?.address || '',
        email: user?.email || '',
        phone: defaultAddress?.phone || '',
        selectedAddressId: defaultAddress?.id || '',
    });

    // Update form when default address changes
    useEffect(() => {
        if (defaultAddress && !formState.selectedAddressId) {
            setFormState({
                firstName: defaultAddress.firstName || '',
                lastName: defaultAddress.lastName || '',
                address: defaultAddress.address || '',
                email: user?.email || '',
                phone: defaultAddress.phone || '',
                selectedAddressId: defaultAddress.id || '',
            });
        }
    }, [defaultAddress, user?.email]);

    const handleAddressSelect = (addressId: string) => {
        const address = addresses?.find(a => a.id === addressId);
        if (address) {
            setFormState({
                ...formState,
                firstName: address.firstName,
                lastName: address.lastName,
                phone: address.phone,
                address: address.address,
                selectedAddressId: addressId,
            });
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
    };
    
    const isFormValid = formState.firstName && formState.lastName && formState.address && formState.email && formState.phone;

    // Generate unique reference with timestamp
    const generateReference = () => {
        return `IKM_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    };

    const paystackConfig: PaystackProps = {
        reference: currentPayment?.reference || generateReference(),
        email: formState.email,
        amount: Math.max(100, total * 100), // Paystack amount is in kobo (minimum 100 kobo = ₦1)
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    };
    
    const initializePayment = usePaystackPayment(paystackConfig);

    const onPaymentSuccess = async (reference: any) => {
        const paymentRef = reference.reference || reference;
        
        // Create or update payment attempt
        let paymentAttempt = currentPayment;
        if (!paymentAttempt || paymentAttempt.reference !== paymentRef) {
            paymentAttempt = createPaymentAttempt(
                paymentRef,
                total,
                cartItems,
                {
                    name: `${formState.firstName} ${formState.lastName}`,
                    email: formState.email,
                    phone: formState.phone
                },
                formState.address
            );
        }

        updatePaymentStatus(paymentAttempt.id, 'verifying');

        startTransition(async () => {
            try {
                // Use server action for better error handling
                const result = await verifyPaymentAndCreateOrder({
                    reference: paymentRef,
                    idempotencyKey: paymentAttempt.id,
                    cartItems,
                    total,
                    deliveryAddress: formState.address,
                    customerInfo: {
                        name: `${formState.firstName} ${formState.lastName}`,
                        email: formState.email,
                        phone: formState.phone
                    },
                    discountCode: appliedDiscount?.code,
                });

                if (result.success) {
                    updatePaymentStatus(paymentAttempt.id, 'completed', undefined, result.orderId);
                    toast({
                        title: 'Order Placed!',
                        description: "Thank you for your purchase. Your payment was successful.",
                    });
                    clearCart();
                    clearPaymentState();
                    router.push('/profile');
                } else {
                    throw new Error(result.message || 'Payment verification failed.');
                }

            } catch (error) {
                const errorMessage = (error as Error).message;
                updatePaymentStatus(paymentAttempt.id, 'failed', errorMessage);
                
                toast({ 
                    variant: 'destructive', 
                    title: 'Payment Verification Failed', 
                    description: errorMessage,
                    action: (
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRetryPayment(paymentAttempt)}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry
                        </Button>
                    )
                });
            }
        });
    };

    const handleRetryPayment = async (payment: typeof currentPayment) => {
        if (!payment) return;
        
        updatePaymentStatus(payment.id, 'retrying');
        
        startTransition(async () => {
            try {
                const result = await verifyPaymentAndCreateOrder({
                    reference: payment.reference,
                    idempotencyKey: payment.id,
                    cartItems: payment.cartItems,
                    total: payment.amount,
                    deliveryAddress: payment.deliveryAddress,
                    customerInfo: payment.customerInfo,
                });

                if (result.success) {
                    updatePaymentStatus(payment.id, 'completed', undefined, result.orderId);
                    toast({
                        title: 'Payment Recovered!',
                        description: 'Your order has been successfully created.',
                    });
                    clearCart();
                    clearPaymentState();
                    router.push('/profile');
                }
            } catch (error) {
                updatePaymentStatus(payment.id, 'failed', (error as Error).message);
                toast({
                    variant: 'destructive',
                    title: 'Retry Failed',
                    description: (error as Error).message,
                });
            }
        });
    };

    const onPaymentClose = () => {
        if (currentPayment) {
            updatePaymentStatus(currentPayment.id, 'cancelled');
        }
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
        <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
            <h1 className="text-2xl sm:text-3xl font-bold font-headline mb-4 sm:mb-6">Checkout</h1>
            <form onSubmit={handlePlaceOrder}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg sm:text-xl">Delivery Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 p-4 sm:p-6">
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
                        <Card className="sticky top-4">
                            <CardHeader>
                                <CardTitle className="text-lg sm:text-xl">Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 p-4 sm:p-6">
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
                                        {appliedDiscount && (
                                            <div className="flex justify-between text-green-600">
                                                <div className="flex items-center gap-2">
                                                    <Tag className="w-4 h-4" />
                                                    <p>Discount ({appliedDiscount.code})</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold">-₦{appliedDiscount.amount.toLocaleString()}</p>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() => {
                                                            setAppliedDiscount(null);
                                                            setDiscountCode('');
                                                            setDiscountError('');
                                                        }}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        {!appliedDiscount && (
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Discount code"
                                                        value={discountCode}
                                                        onChange={(e) => {
                                                            setDiscountCode(e.target.value.toUpperCase());
                                                            setDiscountError('');
                                                        }}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={async () => {
                                                            if (!discountCode.trim()) return;
                                                            setIsApplyingDiscount(true);
                                                            setDiscountError('');
                                                            try {
                                                                const sellerId = cartItems[0]?.sellerId;
                                                                if (!sellerId) {
                                                                    throw new Error('Unable to determine seller');
                                                                }
                                                                const result = await applyDiscountCode({
                                                                    code: discountCode,
                                                                    orderTotal: subtotal,
                                                                    sellerId,
                                                                });
                                                                setAppliedDiscount({
                                                                    code: result.discountCode,
                                                                    amount: result.discountAmount,
                                                                });
                                                                toast({
                                                                    title: 'Discount Applied',
                                                                    description: `You saved ₦${result.discountAmount.toLocaleString()}!`,
                                                                });
                                                            } catch (error) {
                                                                setDiscountError(error instanceof Error ? error.message : 'Invalid discount code');
                                                                toast({
                                                                    variant: 'destructive',
                                                                    title: 'Discount Code Error',
                                                                    description: error instanceof Error ? error.message : 'Invalid discount code',
                                                                });
                                                            } finally {
                                                                setIsApplyingDiscount(false);
                                                            }
                                                        }}
                                                        disabled={isApplyingDiscount || !discountCode.trim()}
                                                    >
                                                        {isApplyingDiscount ? 'Applying...' : 'Apply'}
                                                    </Button>
                                                </div>
                                                {discountError && (
                                                    <p className="text-sm text-red-500">{discountError}</p>
                                                )}
                                            </div>
                                        )}
                                        <Separator />
                                        <div className="flex justify-between font-bold text-lg">
                                            <p>Total</p>
                                            <p>₦{total.toLocaleString()}</p>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-muted-foreground text-center">Your cart is empty.</p>
                                )}
                                <Button size="lg" type="submit" className="w-full mt-4 text-base sm:text-lg" disabled={isPending || cartItems.length === 0 || !isFormValid}>
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
