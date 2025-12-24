
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
import { MapPin, Plus, AlertCircle, RefreshCw, Truck, MessageCircle, Phone, Loader2 } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePaymentState } from '@/lib/payment-state';
import { verifyPaymentAndCreateOrder } from '@/lib/payment-actions';
import { applyDiscountCode } from '@/lib/discount-actions';
import { Tag, X } from 'lucide-react';
import { calculateShippingOptions, calculateFinalShippingPrice, type ShippingOption } from '@/lib/checkout-shipping-actions';
import { getShippingZones, type ShippingZone } from '@/lib/shipping-actions';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { saveGuestDeliveryInfo, loadGuestDeliveryInfo, clearGuestDeliveryInfo } from '@/lib/guest-session';
import { createAccountFromCheckout } from '@/lib/checkout-account-actions';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useFirebase } from '@/firebase/provider';
import { LogIn, UserPlus, X } from 'lucide-react';

export default function CheckoutPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { cartItems, totalPrice, clearCart } = useCart();
    const { user } = useUser();
    const { auth } = useFirebase();
    const { data: addresses } = useUserAddresses(user?.uid);
    const [isPending, startTransition] = useTransition();
    
    // Guest checkout and login state
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [showCreateAccountDialog, setShowCreateAccountDialog] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [createAccountData, setCreateAccountData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);
    const { 
        currentPayment, 
        createPaymentAttempt, 
        updatePaymentStatus,
        clearPaymentState 
    } = usePaymentState();

    // Get seller ID from cart items
    const sellerId = cartItems[0]?.sellerId;

    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
    const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
    const [discountError, setDiscountError] = useState('');

    // Shipping state
    const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);
    const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
    const [isLoadingShipping, setIsLoadingShipping] = useState(false);
    const [shippingCalculation, setShippingCalculation] = useState<any>(null);
    const [customerState, setCustomerState] = useState('');
    const [showContactSeller, setShowContactSeller] = useState(false);
    const [zones, setZones] = useState<ShippingZone[]>([]);

    const defaultAddress = addresses?.find(a => a.isDefault) || addresses?.[0];
    
    // Load guest delivery info from localStorage on mount
    useEffect(() => {
        const guestInfo = loadGuestDeliveryInfo();
        if (guestInfo && !user) {
            // Only use guest info if user is not logged in
            setFormState(prev => ({
                ...prev,
                firstName: prev.firstName || guestInfo.firstName,
                lastName: prev.lastName || guestInfo.lastName,
                email: prev.email || guestInfo.email,
                phone: prev.phone || guestInfo.phone,
                address: prev.address || guestInfo.address,
                state: prev.state || guestInfo.state,
            }));
            if (guestInfo.state) {
                setCustomerState(guestInfo.state);
            }
        }
    }, []);

    const [formState, setFormState] = useState({
        firstName: defaultAddress?.firstName || '',
        lastName: defaultAddress?.lastName || '',
        address: defaultAddress?.address || '',
        state: defaultAddress?.state || '',
        email: user?.email || '',
        phone: defaultAddress?.phone || '',
        selectedAddressId: defaultAddress?.id || '',
    });

    // Update form when default address changes or user logs in
    useEffect(() => {
        if (user && defaultAddress && !formState.selectedAddressId) {
            setFormState({
                firstName: defaultAddress.firstName || '',
                lastName: defaultAddress.lastName || '',
                address: defaultAddress.address || '',
                state: defaultAddress.state || '',
                email: user?.email || '',
                phone: defaultAddress.phone || '',
                selectedAddressId: defaultAddress.id || '',
            });
            setCustomerState(defaultAddress.state || '');
        } else if (user && user.email && !formState.email) {
            setFormState(prev => ({ ...prev, email: user.email || prev.email }));
        }
    }, [defaultAddress, user]);

    // Calculate shipping when state changes
    useEffect(() => {
        const calculateShipping = async () => {
            if (!sellerId || !customerState || !cartItems.length) {
                setShippingOptions([]);
                setSelectedShippingOption(null);
                return;
            }

            setIsLoadingShipping(true);
            try {
                const calculation = await calculateShippingOptions(sellerId, customerState);
                setShippingCalculation(calculation);
                setShippingOptions(calculation.options);
                
                // Auto-select first available option
                if (calculation.options.length > 0) {
                    setSelectedShippingOption(calculation.options[0]);
                }
            } catch (error) {
                console.error('Failed to calculate shipping:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to calculate shipping options',
                });
            } finally {
                setIsLoadingShipping(false);
            }
        };

        calculateShipping();
    }, [sellerId, customerState, cartItems.length, toast]);

    // Load zones for free shipping calculation
    useEffect(() => {
        const loadZones = async () => {
            if (!sellerId) return;
            try {
                const zonesData = await getShippingZones(sellerId);
                setZones(zonesData);
            } catch (error) {
                console.error('Failed to load zones:', error);
            }
        };
        loadZones();
    }, [sellerId]);

    const handleAddressSelect = (addressId: string) => {
        const address = addresses?.find(a => a.id === addressId);
        if (address) {
            setFormState({
                ...formState,
                firstName: address.firstName,
                lastName: address.lastName,
                phone: address.phone,
                address: address.address,
                state: address.state,
                selectedAddressId: addressId,
            });
            setCustomerState(address.state);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
        if (id === 'state') {
            setCustomerState(value);
        }
        
        // Save guest delivery info to localStorage (only if not logged in)
        if (!user) {
            const guestInfo = {
                firstName: id === 'firstName' ? value : formState.firstName,
                lastName: id === 'lastName' ? value : formState.lastName,
                email: id === 'email' ? value : formState.email,
                phone: id === 'phone' ? value : formState.phone,
                address: id === 'address' ? value : formState.address,
                state: id === 'state' ? value : formState.state,
            };
            saveGuestDeliveryInfo(guestInfo);
        }
    };
    
    // Handle login from checkout
    const handleLogin = async () => {
        if (!loginEmail || !loginPassword) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please enter both email and password.',
            });
            return;
        }
        
        if (!auth) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Authentication service is not available.',
            });
            return;
        }
        
        setIsLoggingIn(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
            const idToken = await userCredential.user.getIdToken(true);
            
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Login failed');
            }
            
            toast({
                title: 'Logged In!',
                description: 'Your delivery information will be auto-filled.',
            });
            
            setShowLoginDialog(false);
            setLoginEmail('');
            setLoginPassword('');
            
            // Reload page to get user data
            window.location.reload();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: error.message || 'Invalid email or password.',
            });
        } finally {
            setIsLoggingIn(false);
        }
    };
    
    // Handle account creation from checkout
    const handleCreateAccount = async () => {
        if (!createAccountData.email || !createAccountData.password || !createAccountData.confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please fill in all fields.',
            });
            return;
        }
        
        if (createAccountData.password !== createAccountData.confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Password Mismatch',
                description: 'Passwords do not match.',
            });
            return;
        }
        
        if (createAccountData.password.length < 6) {
            toast({
                variant: 'destructive',
                title: 'Invalid Password',
                description: 'Password must be at least 6 characters.',
            });
            return;
        }
        
        if (!auth) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Authentication service is not available.',
            });
            return;
        }
        
        setIsCreatingAccount(true);
        try {
            // Create account with checkout data
            await createAccountFromCheckout({
                email: createAccountData.email,
                password: createAccountData.password,
                firstName: formState.firstName,
                lastName: formState.lastName,
                phone: formState.phone,
            });
            
            // Now log in the user
            const userCredential = await signInWithEmailAndPassword(auth, createAccountData.email, createAccountData.password);
            const idToken = await userCredential.user.getIdToken(true);
            
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to create session');
            }
            
            toast({
                title: 'Account Created!',
                description: 'Your account has been created and you are now logged in.',
            });
            
            setShowCreateAccountDialog(false);
            setCreateAccountData({ email: '', password: '', confirmPassword: '' });
            clearGuestDeliveryInfo();
            
            // Reload page to get user data
            window.location.reload();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Account Creation Failed',
                description: error.message || 'Failed to create account. Please try again.',
            });
        } finally {
            setIsCreatingAccount(false);
        }
    };

    // Calculate shipping price (check free shipping threshold)
    const shippingPrice = selectedShippingOption 
        ? calculateFinalShippingPrice(selectedShippingOption, totalPrice, zones)
        : 0;

    const subtotal = totalPrice;
    const discountAmount = appliedDiscount?.amount || 0;
    const total = Math.max(0, subtotal + shippingPrice - discountAmount);
    
    const isFormValid = formState.firstName && formState.lastName && formState.address && formState.email && formState.phone && formState.state && selectedShippingOption;

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
                selectedShippingOption?.type === 'pickup' 
                    ? `PICKUP: ${selectedShippingOption.pickupAddress || shippingCalculation?.sellerPickupAddress || 'Store location'}`
                    : formState.address
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
                    deliveryAddress: selectedShippingOption?.type === 'pickup' 
                        ? `PICKUP: ${selectedShippingOption.pickupAddress || shippingCalculation?.sellerPickupAddress || 'Store location'}`
                        : formState.address,
                    customerInfo: {
                        name: `${formState.firstName} ${formState.lastName}`,
                        email: formState.email,
                        phone: formState.phone,
                        state: formState.state,
                    },
                    discountCode: appliedDiscount?.code,
                    shippingType: selectedShippingOption?.type,
                    shippingPrice: shippingPrice,
                });

                if (result.success) {
                    updatePaymentStatus(paymentAttempt.id, 'completed', undefined, result.orderId);
                    toast({
                        title: 'Order Placed!',
                        description: "Thank you for your purchase. Your payment was successful.",
                    });
                    clearCart();
                    clearPaymentState();
                    // Clear guest delivery info after successful order
                    if (!user) {
                        clearGuestDeliveryInfo();
                    }
                    // Redirect based on auth status
                    if (user) {
                        router.push('/profile');
                    } else {
                        // For guest users, redirect to home with success message
                        router.push('/?orderSuccess=true');
                    }
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
                    if (!user) {
                        clearGuestDeliveryInfo();
                    }
                    if (user) {
                        router.push('/profile');
                    } else {
                        router.push('/?orderSuccess=true');
                    }
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
            toast({ variant: 'destructive', title: 'Incomplete Information', description: 'Please fill out all delivery details and select a shipping option.' });
            return;
        }

        // Guest checkout is allowed - no auth check needed
        if (cartItems.length === 0) {
            toast({ variant: 'destructive', title: 'Empty Cart', description: 'Your cart is empty.' });
            return;
        }

        if (!selectedShippingOption) {
            toast({ variant: 'destructive', title: 'Shipping Required', description: 'Please select a shipping option.' });
            return;
        }
        
        // Save guest delivery info before proceeding
        if (!user) {
            saveGuestDeliveryInfo({
                firstName: formState.firstName,
                lastName: formState.lastName,
                email: formState.email,
                phone: formState.phone,
                address: formState.address,
                state: formState.state,
            });
        }
        
        initializePayment({onSuccess: onPaymentSuccess, onClose: onPaymentClose});
    };

    const handleApplyDiscount = async () => {
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
                orderTotal: subtotal + shippingPrice,
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
    };

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
            <h1 className="text-2xl sm:text-3xl font-bold font-headline mb-4 sm:mb-6">Checkout</h1>
            <form onSubmit={handlePlaceOrder}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg sm:text-xl">Delivery Information</CardTitle>
                                    {!user && (
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowLoginDialog(true)}
                                            >
                                                <LogIn className="w-4 h-4 mr-2" />
                                                Log In
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setCreateAccountData(prev => ({
                                                        ...prev,
                                                        email: formState.email,
                                                    }));
                                                    setShowCreateAccountDialog(true);
                                                }}
                                            >
                                                <UserPlus className="w-4 h-4 mr-2" />
                                                Create Account
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                {!user && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Log in to auto-fill your delivery information and track orders easily.
                                    </p>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4 p-4 sm:p-6">
                                {user && addresses && addresses.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Select Saved Address</Label>
                                        <Select value={formState.selectedAddressId} onValueChange={handleAddressSelect}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select an address" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {addresses.map((addr) => (
                                                    <SelectItem key={addr.id} value={addr.id || ''}>
                                                        {addr.label} - {addr.address}, {addr.state}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
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
                                        <Label htmlFor="state">State</Label>
                                        <Input id="state" placeholder="Lagos" value={formState.state} onChange={handleInputChange} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input id="email" type="email" placeholder="mary@example.com" value={formState.email} onChange={handleInputChange} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" type="tel" placeholder="+234..." value={formState.phone} onChange={handleInputChange} required/>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Shipping Options */}
                        {customerState && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                                        <Truck className="w-5 h-5" />
                                        Shipping Options
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 p-4 sm:p-6">
                                    {isLoadingShipping ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        </div>
                                    ) : shippingOptions.length === 0 ? (
                                        <Alert variant="destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle>Shipping Not Available</AlertTitle>
                                            <AlertDescription>
                                                {shippingCalculation?.message || `We don't currently ship to ${customerState}.`}
                                                {shippingCalculation?.sellerPickupAddress && (
                                                    <div className="mt-2">
                                                        <p className="font-medium">Pickup Available:</p>
                                                        <p className="text-sm">{shippingCalculation.sellerPickupAddress}</p>
                                                    </div>
                                                )}
                                                {shippingCalculation?.sellerPhone && (
                                                    <div className="mt-2 flex gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => window.open(`tel:${shippingCalculation.sellerPhone}`, '_blank')}
                                                        >
                                                            <Phone className="w-4 h-4 mr-2" />
                                                            Call Seller
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setShowContactSeller(true)}
                                                        >
                                                            <MessageCircle className="w-4 h-4 mr-2" />
                                                            Chat with Seller
                                                        </Button>
                                                    </div>
                                                )}
                                            </AlertDescription>
                                        </Alert>
                                    ) : (
                                        <>
                                            {shippingCalculation?.message && (
                                                <Alert>
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertTitle>Notice</AlertTitle>
                                                    <AlertDescription>
                                                        {shippingCalculation.message}
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                            <RadioGroup
                                                value={selectedShippingOption?.name || ''}
                                                onValueChange={(value) => {
                                                    const option = shippingOptions.find(o => o.name === value);
                                                    setSelectedShippingOption(option || null);
                                                }}
                                            >
                                                {shippingOptions.map((option) => (
                                                    <div key={option.name} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50">
                                                        <RadioGroupItem value={option.name} id={option.name} className="mt-1" />
                                                        <Label htmlFor={option.name} className="flex-1 cursor-pointer">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <div className="font-medium">{option.name}</div>
                                                                    <div className="text-sm text-muted-foreground">{option.description}</div>
                                                                    {option.pickupAddress && (
                                                                        <div className="text-sm text-muted-foreground mt-1">
                                                                            <MapPin className="w-3 h-3 inline mr-1" />
                                                                            {option.pickupAddress}
                                                                        </div>
                                                                    )}
                                                                    {option.estimatedDays && (
                                                                        <div className="text-sm text-muted-foreground">
                                                                            Estimated delivery: {option.estimatedDays} days
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="font-bold text-lg">
                                                                    {option.price === 0 ? 'Free' : `₦${option.price.toLocaleString()}`}
                                                                </div>
                                                            </div>
                                                        </Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}
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
                                            <p className="text-muted-foreground">
                                                {selectedShippingOption?.type === 'pickup' ? 'Pickup' : 'Shipping'}
                                            </p>
                                            <p className="font-semibold">
                                                {shippingPrice === 0 ? 'Free' : `₦${shippingPrice.toLocaleString()}`}
                                            </p>
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
                                                        onClick={handleApplyDiscount}
                                                        disabled={isApplyingDiscount || !discountCode.trim()}
                                                    >
                                                        {isApplyingDiscount ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            'Apply'
                                                        )}
                                                    </Button>
                                                </div>
                                                {discountError && (
                                                    <p className="text-sm text-red-600">{discountError}</p>
                                                )}
                                            </div>
                                        )}
                                        <Separator />
                                        <div className="flex justify-between font-bold text-lg">
                                            <p>Total</p>
                                            <p>₦{total.toLocaleString()}</p>
                                        </div>
                                        <Button 
                                            type="submit" 
                                            size="lg" 
                                            className="w-full mt-4 text-base sm:text-lg"
                                            disabled={!isFormValid || isPending}
                                        >
                                            {isPending ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                'Place Order'
                                            )}
                                        </Button>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground">Your cart is empty</p>
                                        <Link href="/products">
                                            <Button variant="outline" className="mt-4">
                                                Continue Shopping
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>

            {/* Contact Seller Dialog */}
            <Dialog open={showContactSeller} onOpenChange={setShowContactSeller}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Contact Seller</DialogTitle>
                        <DialogDescription>
                            You can contact the seller to arrange delivery or pickup
                        </DialogDescription>
                    </DialogContent>
                    <div className="space-y-4">
                        {shippingCalculation?.sellerPhone && (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => window.open(`tel:${shippingCalculation.sellerPhone}`, '_blank')}
                            >
                                <Phone className="w-4 h-4 mr-2" />
                                Call: {shippingCalculation.sellerPhone}
                            </Button>
                        )}
                        <p className="text-sm text-muted-foreground">
                            After placing your order, you can chat with the seller in the order chat to arrange delivery or pickup details.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Login Dialog */}
            <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Log In for Faster Checkout</DialogTitle>
                        <DialogDescription>
                            Log in to auto-fill your delivery information and track your orders.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <Input
                                id="login-email"
                                type="email"
                                placeholder="your@email.com"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && loginEmail && loginPassword) {
                                        handleLogin();
                                    }
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="login-password">Password</Label>
                            <Input
                                id="login-password"
                                type="password"
                                placeholder="Enter your password"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && loginEmail && loginPassword) {
                                        handleLogin();
                                    }
                                }}
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <Link href="/signup" className="text-sm text-primary hover:underline">
                                Don't have an account? Sign up
                            </Link>
                            <Link href="/login" className="text-sm text-muted-foreground hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowLoginDialog(false)}
                        >
                            Continue as Guest
                        </Button>
                        <Button
                            type="button"
                            onClick={handleLogin}
                            disabled={isLoggingIn || !loginEmail || !loginPassword}
                        >
                            {isLoggingIn ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                'Log In'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create Account Dialog */}
            <Dialog open={showCreateAccountDialog} onOpenChange={setShowCreateAccountDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Account</DialogTitle>
                        <DialogDescription>
                            Create an account to save your delivery information and track orders easily.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="create-email">Email</Label>
                            <Input
                                id="create-email"
                                type="email"
                                placeholder="your@email.com"
                                value={createAccountData.email}
                                onChange={(e) => setCreateAccountData(prev => ({ ...prev, email: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-password">Password</Label>
                            <Input
                                id="create-password"
                                type="password"
                                placeholder="At least 6 characters"
                                value={createAccountData.password}
                                onChange={(e) => setCreateAccountData(prev => ({ ...prev, password: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                placeholder="Confirm your password"
                                value={createAccountData.confirmPassword}
                                onChange={(e) => setCreateAccountData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && createAccountData.email && createAccountData.password && createAccountData.confirmPassword) {
                                        handleCreateAccount();
                                    }
                                }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Your delivery information will be saved to your account.
                        </p>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowCreateAccountDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCreateAccount}
                            disabled={isCreatingAccount || !createAccountData.email || !createAccountData.password || !createAccountData.confirmPassword}
                        >
                            {isCreatingAccount ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <CoPilotWidget />
        </div>
    );
}
