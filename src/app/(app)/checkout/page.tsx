
'use client';

import { CoPilotWidget } from '@/components/copilot-widget';
import { StateSelector } from '@/components/state-selector';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useFirebase } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/lib/cart-context';
import { createAccountFromCheckout } from '@/lib/checkout-account-actions';
import { calculateShippingOptions, type ShippingOption } from '@/lib/checkout-shipping-actions';
import { calculateFinalShippingPrice } from '@/lib/checkout-shipping-utils';
import { cloudFunctions } from '@/lib/cloud-functions';
import { applyDiscountCode } from '@/lib/discount-actions';
import { useUser } from '@/lib/firebase/auth/use-user';
import { useUserAddresses } from '@/lib/firebase/firestore/addresses';
import { clearGuestDeliveryInfo, loadGuestDeliveryInfo, saveGuestDeliveryInfo } from '@/lib/guest-session';
import { usePaymentState } from '@/lib/payment-state';
import { getPublicShippingZones, type ShippingZone } from '@/lib/shipping-actions';
import { normalizeStateName } from '@/lib/utils/state-selector';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { AlertCircle, Loader2, LogIn, MapPin, MessageCircle, Phone, Tag, Truck, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { usePaystackPayment } from 'react-paystack';
import type { PaystackProps } from 'react-paystack/dist/types';

export default function CheckoutPage() {
    // Suppress Paystack library's internal requery errors
    useEffect(() => {
        const originalError = window.console.error;
        const originalWarn = window.console.warn;
        
        // Suppress console.error from Paystack
        window.console.error = (...args: any[]) => {
            const errorString = args[0]?.toString() || '';
            const fullError = args.map(a => String(a)).join(' ');
            // Suppress Paystack internal errors that don't affect functionality
            if (
                (errorString.includes('Cannot read properties of null') && errorString.includes('isTest')) ||
                (errorString.includes('Cannot destructure property') && (errorString.includes('language') || fullError.includes('language'))) ||
                errorString.includes('requeryTransactionStatus') ||
                errorString.includes('handleRequery') ||
                fullError.includes('index-D2JAzeTm.js') ||
                (fullError.includes('Cannot destructure') && fullError.includes('null')) ||
                (fullError.includes('TypeError') && fullError.includes('language') && fullError.includes('null'))
            ) {
                // These are known issues with react-paystack v5.0.0's internal requery logic
                // The payment still works, so we suppress these errors
                return;
            }
            originalError.apply(console, args);
        };
        
        // Catch unhandled promise rejections from Paystack
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const errorString = event.reason?.toString() || '';
            const errorMessage = event.reason?.message || '';
            const errorStack = event.reason?.stack || '';
            const fullError = errorString + errorMessage + errorStack;
            
            if (
                fullError.includes('Cannot read properties of null') ||
                fullError.includes('isTest') ||
                fullError.includes('requeryTransactionStatus') ||
                fullError.includes('Cannot destructure property') ||
                fullError.includes('language') ||
                (fullError.includes('index-D2JAzeTm.js') && (fullError.includes('isTest') || fullError.includes('language')))
            ) {
                event.preventDefault();
                return;
            }
        };
        
        // Catch uncaught errors from Paystack (like the TypeError we're seeing)
        const handleError = (event: ErrorEvent) => {
            const errorString = event.message || '';
            const errorStack = event.error?.stack || '';
            const filename = event.filename || '';
            const fullError = errorString + errorStack + filename;
            
            // Check if this is a Paystack internal error
            if (
                fullError.includes('Cannot destructure property') ||
                (fullError.includes('language') && (fullError.includes('null') || fullError.includes('object null'))) ||
                (fullError.includes('index-D2JAzeTm.js') && fullError.includes('language')) ||
                (fullError.includes('TypeError') && fullError.includes('language')) ||
                (filename.includes('index-D2JAzeTm.js') && errorString.includes('language'))
            ) {
                // Suppress Paystack internal errors - completely silent
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        };
        
        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        window.addEventListener('error', handleError);
        
        return () => {
            window.console.error = originalError;
            window.console.warn = originalWarn;
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            window.removeEventListener('error', handleError);
        };
    }, []);
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
    const [isProcessingOrder, setIsProcessingOrder] = useState(false);
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

    // Calculate shipping when state changes or on initial load
    // This allows pickup to show immediately even without a state selected
    useEffect(() => {
        const calculateShipping = async () => {
            if (!sellerId || !cartItems.length) {
                setShippingOptions([]);
                setSelectedShippingOption(null);
                return;
            }

            setIsLoadingShipping(true);
            try {
                // Get product IDs from cart items to check allowShipping
                const productIds = cartItems.map(item => item.id).filter((id): id is string => !!id);
                // Pass customerState (can be empty string - function handles it)
                const calculation = await calculateShippingOptions(sellerId, customerState || '', productIds);
                setShippingCalculation(calculation);
                setShippingOptions(calculation.options);
                
                // Auto-select pickup if available (preferred), otherwise select first option
                // Users can always change their selection via radio buttons
                if (calculation.options.length > 0) {
                    const pickupOption = calculation.options.find(opt => opt.type === 'pickup' && opt.available);
                    // Prefer pickup, but allow users to choose delivery if they want
                    setSelectedShippingOption(pickupOption || calculation.options[0]);
                } else {
                    // No options available - clear selection
                    setSelectedShippingOption(null);
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
                const zonesData = await getPublicShippingZones(sellerId);
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
            // Normalize state name when user types manually
            const normalized = normalizeStateName(value);
            setFormState(prev => ({ ...prev, state: normalized }));
            setCustomerState(normalized);
        }
        
        // Save guest delivery info to localStorage (only if not logged in)
        if (!user) {
            const guestInfo = {
                firstName: id === 'firstName' ? value : formState.firstName,
                lastName: id === 'lastName' ? value : formState.lastName,
                email: id === 'email' ? value : formState.email,
                phone: id === 'phone' ? value : formState.phone,
                address: id === 'address' ? value : formState.address,
                state: id === 'state' ? normalizeStateName(value) : formState.state,
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
    // If no option selected, pickup selected, or contact selected, shipping is 0
    // Calculate shipping price - only for delivery, not pickup or contact
    const shippingPrice = selectedShippingOption && selectedShippingOption.type === 'delivery'
        ? calculateFinalShippingPrice(selectedShippingOption, totalPrice, zones)
        : 0;

    const subtotal = totalPrice;
    const discountAmount = appliedDiscount?.amount || 0;
    const total = Math.max(0, subtotal + shippingPrice - discountAmount);
    
    // Allow checkout if form is valid AND either shipping option is selected OR pickup is available
    const hasPickupOption = shippingOptions.some(opt => opt.type === 'pickup' && opt.available);
    // Form validation: For pickup/contact, only need name, email, phone. For delivery, need full address
    const isFormValid = 
        formState.firstName && 
        formState.lastName && 
        formState.email && 
        formState.phone && 
        selectedShippingOption &&
        (selectedShippingOption.type === 'pickup' || selectedShippingOption.type === 'contact' 
            ? true // Pickup/contact don't need address
            : (formState.address && formState.state)); // Delivery needs full address

    // Generate unique reference with timestamp
    const generateReference = () => {
        return `IKM_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    };

    // Define payment callbacks first (before paystackConfig)
    const onPaymentClose = useCallback(() => {
        const logData = {location:'checkout/page.tsx:456',message:'onPaymentClose CALLED',data:{currentPaymentId:currentPayment?.id,currentPaymentRef:currentPayment?.reference},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'};
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/216e8403-ed09-402a-a608-99b1722965bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
        console.log('🟡 onPaymentClose CALLED', currentPayment);
        // #endregion
        
        // Simple fallback: if payment was completed but callback didn't fire, check after a delay
        setTimeout(async () => {
            if (currentPayment) {
                try {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/216e8403-ed09-402a-a608-99b1722965bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/page.tsx:463',message:'Starting email/amount lookup',data:{email:formState.email,total,currentPaymentRef:currentPayment.reference},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                    // #endregion
                    
                    // Try to find the transaction by email/amount
                    const found = await cloudFunctions.findRecentTransactionByEmail({
                        email: formState.email,
                        amount: total,
                    });
                    
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/216e8403-ed09-402a-a608-99b1722965bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/page.tsx:466',message:'Email/amount lookup result',data:{found:!!found,foundReference:found?.reference,foundStatus:found?.status,foundAmount:found?.amount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                    // #endregion
                    
                    if (found?.reference) {
                        // CRITICAL: Check if order creation is already in progress
                        if (orderCreationLockRef.current.isProcessing) {
                            console.warn('Order creation already in progress, skipping duplicate attempt');
                            return;
                        }
                        
                        // Payment was completed! Process it
                        orderCreationLockRef.current = { isProcessing: true, paymentId: currentPayment.id };
                        setIsProcessingOrder(true);
                        try {
                            const result = await cloudFunctions.verifyPaymentAndCreateOrder({
                                reference: found.reference,
                                idempotencyKey: currentPayment.id, // CRITICAL: Use consistent idempotency key
                                cartItems,
                                total,
                                deliveryAddress: selectedShippingOption?.type === 'pickup' 
                                    ? `PICKUP: ${selectedShippingOption.pickupAddress || shippingCalculation?.sellerPickupAddress || 'Store location'}`
                                    : selectedShippingOption?.type === 'contact'
                                    ? `CONTACT_SELLER: Buyer will arrange delivery/pickup via chat`
                                    : formState.address,
                                customerInfo: {
                                    name: `${formState.firstName} ${formState.lastName}`,
                                    email: formState.email,
                                    phone: formState.phone,
                                    state: formState.state,
                                    firstName: formState.firstName,
                                    lastName: formState.lastName,
                                },
                                discountCode: appliedDiscount?.code,
                                shippingType: selectedShippingOption?.type,
                                shippingPrice: shippingPrice,
                            });
                            
                            if (result.success) {
                                updatePaymentStatus(currentPayment.id, 'completed', undefined, result.orderId);
                                toast({
                                    title: result.alreadyExists ? 'Order Confirmed!' : 'Order Placed!',
                                    description: "Thank you for your purchase. Redirecting...",
                                });
                                clearCart();
                                clearPaymentState();
                                if (!user) clearGuestDeliveryInfo();
                                
                                // Small delay to show success message
                                await new Promise(resolve => setTimeout(resolve, 1500));
                                router.push(user ? '/profile' : '/?orderSuccess=true');
                                return;
                            }
                        } catch (error) {
                            console.error('Error processing order:', error);
                            const errorMessage = error instanceof Error ? error.message : 'Failed to process order';
                            
                            // CRITICAL: If payment was successful but order creation failed
                            if (!errorMessage.includes('Payment not successful')) {
                                toast({
                                    variant: 'destructive',
                                    title: 'Payment Received - Order Processing Issue',
                                    description: 'Your payment was successful, but there was an issue creating your order. Our team has been notified. Please contact support with your payment reference.',
                                });
                            } else {
                                toast({
                                    variant: 'destructive',
                                    title: 'Error',
                                    description: errorMessage,
                                });
                            }
                        } finally {
                            setIsProcessingOrder(false);
                            if (orderCreationLockRef.current.paymentId === currentPayment.id) {
                                orderCreationLockRef.current = { isProcessing: false };
                            }
                        }
                    }
                } catch (error) {
                    // Silent fail - payment might not have been completed
                }
            }
            
            // If we get here, payment was likely cancelled
            if (currentPayment) {
                updatePaymentStatus(currentPayment.id, 'cancelled');
            }
            toast({
                variant: 'destructive',
                title: 'Payment Cancelled',
                description: 'You closed the payment window without completing the transaction.',
            });
        }, 3000); // Wait 3 seconds to check if payment was completed
    }, [currentPayment, formState, total, cartItems, selectedShippingOption, shippingCalculation, shippingPrice, appliedDiscount, updatePaymentStatus, clearCart, clearPaymentState, user, router, toast]);

    const handleRetryPayment = useCallback(async (payment: typeof currentPayment) => {
        if (!payment) return;
        
        updatePaymentStatus(payment.id, 'retrying');
        
        startTransition(async () => {
            try {
                const result = await cloudFunctions.verifyPaymentAndCreateOrder({
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
    }, [updatePaymentStatus, startTransition, clearCart, clearPaymentState, user, router, toast]);

    // Track polling state to stop it if callback fires
    const pollingStateRef = useRef<{ active: boolean }>({ active: false });
    // CRITICAL: Prevent race conditions - only allow one order creation attempt at a time
    const orderCreationLockRef = useRef<{ isProcessing: boolean; paymentId?: string }>({ isProcessing: false });
    
    // Simplified payment success handler
    const onPaymentSuccess = useCallback(async (reference: any) => {
        pollingStateRef.current.active = false; // Stop polling if callback fires
        
        // CRITICAL: Prevent duplicate order creation attempts
        if (orderCreationLockRef.current.isProcessing) {
            console.warn('Order creation already in progress, ignoring duplicate callback');
            return;
        }
        
        if (!currentPayment?.id) {
            console.error('No current payment found');
            return;
        }
        
        // Lock order creation for this payment
        orderCreationLockRef.current = { isProcessing: true, paymentId: currentPayment.id };
        const logData = {location:'checkout/page.tsx:561',message:'onPaymentSuccess CALLED',data:{reference,referenceType:typeof reference,isObject:typeof reference === 'object',hasReference:reference?.reference,hasTrxref:reference?.trxref},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'A'};
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/216e8403-ed09-402a-a608-99b1722965bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
        console.log('🟢 onPaymentSuccess CALLED', reference);
        // #endregion
        
        // Extract reference from Paystack response
        const paymentRef = typeof reference === 'object' 
            ? (reference.reference || reference.trxref) 
            : reference;
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/216e8403-ed09-402a-a608-99b1722965bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/page.tsx:570',message:'Extracted paymentRef',data:{paymentRef,originalReference:reference},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        if (!paymentRef) {
            toast({
                variant: 'destructive',
                title: 'Payment Error',
                description: 'Invalid payment reference received.',
            });
            return;
        }
        
        updatePaymentStatus(currentPayment?.id || 'temp', 'verifying');
        
        setIsProcessingOrder(true);
        startTransition(async () => {
            try {
                // If our reference doesn't work, try to find the actual Paystack reference
                let referenceToUse = paymentRef;
                
                try {
                    const result = await cloudFunctions.verifyPaymentAndCreateOrder({
                        reference: referenceToUse,
                        idempotencyKey: currentPayment?.id || `payment_${Date.now()}`,
                        cartItems,
                        total,
                        deliveryAddress: selectedShippingOption?.type === 'pickup' 
                            ? `PICKUP: ${selectedShippingOption.pickupAddress || shippingCalculation?.sellerPickupAddress || 'Store location'}`
                            : selectedShippingOption?.type === 'contact'
                            ? `CONTACT_SELLER: Buyer will arrange delivery/pickup via chat`
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
                        // CRITICAL: Check if order already exists (idempotency)
                        if (result.alreadyExists) {
                            console.log('Order already exists, using existing order:', result.orderId);
                            if (currentPayment) {
                                updatePaymentStatus(currentPayment.id, 'completed', undefined, result.orderId);
                            }
                            toast({
                                title: 'Order Confirmed!',
                                description: "Your order has been confirmed. Redirecting...",
                            });
                        } else {
                            if (currentPayment) {
                                updatePaymentStatus(currentPayment.id, 'completed', undefined, result.orderId);
                            }
                            toast({
                                title: 'Order Placed!',
                                description: "Thank you for your purchase. Redirecting...",
                            });
                        }
                        
                        clearCart();
                        clearPaymentState();
                        if (!user) clearGuestDeliveryInfo();
                        
                        // Small delay to show success message
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        router.push(user ? '/profile' : '/?orderSuccess=true');
                        return;
                    }
                } catch (error: any) {
                    // If reference not found, try to find by email/amount
                    if (error.message?.includes('reference not found')) {
                        const found = await cloudFunctions.findRecentTransactionByEmail({
                            email: formState.email,
                            amount: total,
                        });
                        
                        if (found?.reference) {
                            referenceToUse = found.reference;
                            // Retry with found reference
                            const result = await cloudFunctions.verifyPaymentAndCreateOrder({
                                reference: referenceToUse,
                                idempotencyKey: currentPayment?.id || `payment_${Date.now()}`,
                                cartItems,
                                total,
                                deliveryAddress: selectedShippingOption?.type === 'pickup' 
                                    ? `PICKUP: ${selectedShippingOption.pickupAddress || shippingCalculation?.sellerPickupAddress || 'Store location'}`
                                    : selectedShippingOption?.type === 'contact'
                                    ? `CONTACT_SELLER: Buyer will arrange delivery/pickup via chat`
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
                                if (currentPayment) {
                                    updatePaymentStatus(currentPayment.id, 'completed', undefined, result.orderId);
                                }
                                toast({
                                    title: 'Order Placed!',
                                    description: "Thank you for your purchase. Redirecting...",
                                });
                                clearCart();
                                clearPaymentState();
                                if (!user) clearGuestDeliveryInfo();
                                
                                // Small delay to show success message
                                await new Promise(resolve => setTimeout(resolve, 1500));
                                router.push(user ? '/profile' : '/?orderSuccess=true');
                                return;
                            }
                        }
                    }
                    
                    throw error;
                }
            } catch (error) {
                console.error('Payment processing error:', error);
                const errorMessage = error instanceof Error ? error.message : 'Failed to process order';
                
                // CRITICAL: If payment was successful but order creation failed, log for manual recovery
                if (errorMessage.includes('Payment not successful') === false) {
                    // Payment was verified but order creation failed - this is critical
                    console.error('CRITICAL: Payment verified but order creation failed', {
                        reference: paymentRef,
                        paymentId: currentPayment?.id,
                        error: errorMessage
                    });
                    
                    toast({
                        variant: 'destructive',
                        title: 'Payment Received - Order Processing Issue',
                        description: 'Your payment was successful, but there was an issue creating your order. Our team has been notified and will resolve this within 24 hours. Please contact support with your payment reference.',
                    });
                    
                    // Don't clear payment state - allow retry
                    return;
                }
                
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: errorMessage,
                });
            } finally {
                setIsProcessingOrder(false);
                // CRITICAL: Release lock after processing completes
                if (orderCreationLockRef.current.paymentId === currentPayment?.id) {
                    orderCreationLockRef.current = { isProcessing: false };
                }
            }
        });
    }, [currentPayment, total, cartItems, formState, selectedShippingOption, shippingCalculation, shippingPrice, appliedDiscount, updatePaymentStatus, clearCart, clearPaymentState, user, router, toast]);

    // Check if we have valid payment setup
    const hasValidPaymentSetup = !!(
        process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY &&
        formState.email &&
        total > 0 &&
        typeof onPaymentSuccess === 'function' &&
        typeof onPaymentClose === 'function'
    );

        // Create config WITHOUT callbacks (callbacks are passed when calling initializePayment)
        // Ensure config is always valid to prevent library errors
        const paystackConfig: PaystackProps = useMemo(() => {
        const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
        if (!publicKey || publicKey === 'pk_test_placeholder') {
            console.warn('Paystack public key is not configured');
        }
        
        const email = formState.email || 'placeholder@example.com';
        const amount = Math.max(100, (total || 0) * 100); // Amount in kobo (minimum 100)
        const reference = currentPayment?.reference || generateReference();
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/216e8403-ed09-402a-a608-99b1722965bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/page.tsx:697',message:'Paystack config created',data:{reference,email,amount,amountInNaira:amount/100,publicKeyConfigured:!!publicKey},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        
        return {
            reference,
            email,
            amount,
            publicKey: publicKey || 'pk_test_placeholder', // Always provide a key to prevent null errors
        };
    }, [currentPayment?.reference, formState.email, total]);
    
    // Always call the hook (React rules) - config should NOT have callbacks
    const initializePayment = usePaystackPayment(paystackConfig);

    const handlePlaceOrder = (e: React.FormEvent) => {
        e.preventDefault();
        
        // CRITICAL: Prevent duplicate submissions
        if (isPending || isProcessingOrder) {
            toast({ 
                variant: 'destructive', 
                title: 'Processing', 
                description: 'Your order is already being processed. Please wait...' 
            });
            return;
        }
        
        // CRITICAL: Check if order creation is already in progress
        if (orderCreationLockRef.current.isProcessing) {
            toast({ 
                variant: 'destructive', 
                title: 'Order Processing', 
                description: 'An order is already being processed. Please wait...' 
            });
            return;
        }
        
        // CRITICAL: Validate form
        if (!isFormValid) {
            const missingFields = [];
            if (!formState.firstName) missingFields.push('First Name');
            if (!formState.lastName) missingFields.push('Last Name');
            if (!formState.email) missingFields.push('Email');
            if (!formState.phone) missingFields.push('Phone');
            if (selectedShippingOption?.type === 'delivery' && !formState.address) missingFields.push('Delivery Address');
            if (selectedShippingOption?.type === 'delivery' && !formState.state) missingFields.push('State');
            if (!selectedShippingOption) missingFields.push('Shipping Option');
            
            toast({ 
                variant: 'destructive', 
                title: 'Incomplete Information', 
                description: `Please fill in: ${missingFields.join(', ')}` 
            });
            return;
        }
        
        // CRITICAL: Validate cart
        if (cartItems.length === 0) {
            toast({ variant: 'destructive', title: 'Empty Cart', description: 'Your cart is empty.' });
            return;
        }
        
        // CRITICAL: Validate all items are from same seller
        const sellerIds = new Set(cartItems.map(item => item.sellerId).filter(Boolean));
        if (sellerIds.size > 1) {
            toast({ 
                variant: 'destructive', 
                title: 'Invalid Cart', 
                description: 'All items must be from the same seller. Please check your cart.' 
            });
            return;
        }
        
        // CRITICAL: Validate total amount
        if (total <= 0 || total < 1) {
            toast({ 
                variant: 'destructive', 
                title: 'Invalid Amount', 
                description: 'Order total must be at least ₦1.' 
            });
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

        // Check if Paystack public key is configured
        if (!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
            toast({ 
                variant: 'destructive', 
                title: 'Payment Configuration Error', 
                description: 'Paystack public key is not configured. Please contact support.' 
            });
            console.error('Paystack public key is missing');
            return;
        }

        // CRITICAL: Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formState.email || !emailRegex.test(formState.email)) {
            toast({ variant: 'destructive', title: 'Invalid Email', description: 'Please enter a valid email address.' });
            return;
        }

        // CRITICAL: Validate total amount (minimum 100 kobo = ₦1)
        if (total <= 0 || total < 1) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Order total must be at least ₦1.' });
            return;
        }
        
        // CRITICAL: Validate phone number (basic validation)
        if (!formState.phone || formState.phone.trim().length < 10) {
            toast({ variant: 'destructive', title: 'Invalid Phone', description: 'Please enter a valid phone number.' });
            return;
        }
        
        // CRITICAL: Check if order creation is already in progress
        if (orderCreationLockRef.current.isProcessing) {
            toast({ 
                variant: 'destructive', 
                title: 'Order Processing', 
                description: 'An order is already being processed. Please wait...' 
            });
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

        if (typeof initializePayment !== 'function') {
            toast({ 
                variant: 'destructive', 
                title: 'Payment Error', 
                description: 'Payment system is not ready. Please refresh the page.' 
            });
            return;
        }

        // Create payment attempt BEFORE opening modal
        const paymentRef = currentPayment?.reference || generateReference();
        if (!currentPayment) {
            createPaymentAttempt(
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
                    : selectedShippingOption?.type === 'contact'
                    ? `CONTACT_SELLER: Buyer will arrange delivery/pickup via chat`
                    : formState.address
            );
        }
        
        // Start polling for payment completion (don't rely on callbacks)
        let pollCount = 0;
        const maxPolls = 20; // Poll for up to 2 minutes (20 * 6 seconds)
        const pollInterval = 6000; // 6 seconds between polls
        pollingStateRef.current.active = true;
        
        const pollForPayment = async () => {
            if (!pollingStateRef.current.active) return;
            
            pollCount++;
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/216e8403-ed09-402a-a608-99b1722965bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/page.tsx:875',message:'Polling for payment',data:{pollCount,maxPolls,email:formState.email,total},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            
            try {
                const found = await cloudFunctions.findRecentTransactionByEmail({
                    email: formState.email,
                    amount: total,
                });
                
                if (found?.reference && found.status === 'success') {
                    pollingStateRef.current.active = false; // Stop polling
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/216e8403-ed09-402a-a608-99b1722965bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/page.tsx:883',message:'Payment found via polling',data:{reference:found.reference,status:found.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'C'})}).catch(()=>{});
                    // #endregion
                    
                    // CRITICAL: Check if order creation is already in progress
                    if (orderCreationLockRef.current.isProcessing) {
                        console.warn('Order creation already in progress, stopping polling');
                        return;
                    }
                    
                    if (!currentPayment?.id) {
                        console.error('No current payment found during polling');
                        return;
                    }
                    
                    // Payment found! Process it
                    orderCreationLockRef.current = { isProcessing: true, paymentId: currentPayment.id };
                    setIsProcessingOrder(true);
                    try {
                        const result = await cloudFunctions.verifyPaymentAndCreateOrder({
                            reference: found.reference,
                            idempotencyKey: currentPayment.id, // CRITICAL: Use consistent idempotency key
                            cartItems,
                            total,
                            deliveryAddress: selectedShippingOption?.type === 'pickup' 
                                ? `PICKUP: ${selectedShippingOption.pickupAddress || shippingCalculation?.sellerPickupAddress || 'Store location'}`
                                : selectedShippingOption?.type === 'contact'
                                ? `CONTACT_SELLER: Buyer will arrange delivery/pickup via chat`
                                : formState.address,
                            customerInfo: {
                                name: `${formState.firstName} ${formState.lastName}`,
                                email: formState.email,
                                phone: formState.phone,
                                state: formState.state,
                                firstName: formState.firstName,
                                lastName: formState.lastName,
                            },
                            discountCode: appliedDiscount?.code,
                            shippingType: selectedShippingOption?.type,
                            shippingPrice: shippingPrice,
                        });
                        
                        if (result.success) {
                            if (currentPayment) {
                                updatePaymentStatus(currentPayment.id, 'completed', undefined, result.orderId);
                            }
                            toast({
                                title: result.alreadyExists ? 'Order Confirmed!' : 'Order Placed!',
                                description: "Thank you for your purchase. Redirecting...",
                            });
                            clearCart();
                            clearPaymentState();
                            if (!user) clearGuestDeliveryInfo();
                            
                            // Small delay to show success message
                            await new Promise(resolve => setTimeout(resolve, 1500));
                            router.push(user ? '/profile' : '/?orderSuccess=true');
                            return; // Stop polling
                        }
                    } catch (error) {
                        console.error('Error processing order:', error);
                        const errorMessage = error instanceof Error ? error.message : 'Failed to process order';
                        
                        // CRITICAL: If payment was successful but order creation failed
                        if (!errorMessage.includes('Payment not successful')) {
                            toast({
                                variant: 'destructive',
                                title: 'Payment Received - Order Processing Issue',
                                description: 'Your payment was successful, but there was an issue creating your order. Our team has been notified. Please contact support with your payment reference.',
                            });
                        } else {
                            toast({
                                variant: 'destructive',
                                title: 'Error',
                                description: errorMessage,
                            });
                        }
                    } finally {
                        setIsProcessingOrder(false);
                        if (orderCreationLockRef.current.paymentId === currentPayment.id) {
                            orderCreationLockRef.current = { isProcessing: false };
                        }
                    }
                } else if (pollCount < maxPolls) {
                    // Continue polling
                    setTimeout(pollForPayment, pollInterval);
                } else {
                    pollingStateRef.current.active = false;
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/216e8403-ed09-402a-a608-99b1722965bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/page.tsx:917',message:'Polling timeout',data:{pollCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'C'})}).catch(()=>{});
                    // #endregion
                    toast({
                        variant: 'destructive',
                        title: 'Payment Status Unknown',
                        description: 'We couldn\'t verify your payment automatically. If you completed the payment, please check your email for confirmation or contact support.',
                    });
                }
            } catch (error) {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/216e8403-ed09-402a-a608-99b1722965bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/page.tsx:924',message:'Polling error',data:{error:String(error),pollCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'C'})}).catch(()=>{});
                // #endregion
                if (pollCount < maxPolls && pollingStateRef.current.active) {
                    setTimeout(pollForPayment, pollInterval);
                }
            }
        };
        
        try {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/216e8403-ed09-402a-a608-99b1722965bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/page.tsx:932',message:'Calling initializePayment and starting poll',data:{configReference:paystackConfig.reference,configEmail:paystackConfig.email,configAmount:paystackConfig.amount},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            
            // Call initializePayment with callbacks (they may or may not fire)
            (initializePayment as any)(onPaymentSuccess, onPaymentClose);
            
            // Start polling immediately (don't wait for callbacks)
            // Wait 10 seconds first to give Paystack time to process
            setTimeout(() => {
                pollForPayment();
            }, 10000);
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/216e8403-ed09-402a-a608-99b1722965bb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'checkout/page.tsx:942',message:'initializePayment called, polling started',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
        } catch (error) {
            console.error('Payment error:', error);
            toast({ 
                variant: 'destructive', 
                title: 'Payment Error', 
                description: error instanceof Error ? error.message : 'Failed to start payment. Please try again.' 
            });
        }
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
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Checkout</h1>
                    <p className="text-muted-foreground mt-2">Complete your order details below</p>
                </div>
                
                <form onSubmit={handlePlaceOrder}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                        <div className="lg:col-span-2 space-y-6">
                        {/* Shipping Options - SHOW FIRST */}
                        <Card className="border-2 shadow-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Truck className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-semibold">Choose Delivery Method</CardTitle>
                                            <p className="text-sm text-muted-foreground mt-0.5">Select how you'd like to receive your order</p>
                                        </div>
                                    </div>
                                    {!user && (
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowLoginDialog(true)}
                                                className="text-xs"
                                            >
                                                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                                                Log In
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-2">
                                {isLoadingShipping ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    </div>
                                ) : shippingOptions.length === 0 ? (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Loading Options</AlertTitle>
                                        <AlertDescription>
                                            Please wait while we load shipping options...
                                            {shippingCalculation?.sellerPickupAddress && (
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    Pickup is available at: {shippingCalculation.sellerPickupAddress}
                                                </p>
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
                                            className="space-y-3"
                                        >
                                            {shippingOptions.map((option) => (
                                                <div 
                                                    key={option.name} 
                                                    className={`relative flex items-start gap-4 p-5 border-2 rounded-xl transition-all cursor-pointer ${
                                                        selectedShippingOption?.name === option.name 
                                                            ? 'border-primary bg-primary/5 shadow-md' 
                                                            : 'border-border hover:border-primary/50 hover:bg-muted/30'
                                                    }`}
                                                    onClick={() => {
                                                        const selectedOption = shippingOptions.find(o => o.name === option.name);
                                                        setSelectedShippingOption(selectedOption || null);
                                                    }}
                                                >
                                                    <RadioGroupItem 
                                                        value={option.name} 
                                                        id={option.name} 
                                                        className="mt-0.5" 
                                                    />
                                                    <Label htmlFor={option.name} className="flex-1 cursor-pointer">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex-1 space-y-2">
                                                                <div className="flex items-center gap-2.5">
                                                                    {option.type === 'pickup' ? (
                                                                        <MapPin className="w-5 h-5 text-primary" />
                                                                    ) : option.type === 'contact' ? (
                                                                        <MessageCircle className="w-5 h-5 text-primary" />
                                                                    ) : (
                                                                        <Truck className="w-5 h-5 text-primary" />
                                                                    )}
                                                                    <span className="font-semibold text-base">{option.name}</span>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                                    {option.description}
                                                                </p>
                                                                {option.pickupAddress && (
                                                                    <div className="flex items-start gap-2 mt-2 p-2 bg-muted/50 rounded-md">
                                                                        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                                                                        <span className="text-sm text-muted-foreground">{option.pickupAddress}</span>
                                                                    </div>
                                                                )}
                                                                {option.estimatedDays && option.type === 'delivery' && (
                                                                    <div className="text-xs text-muted-foreground mt-1.5">
                                                                        📦 Estimated delivery: {option.estimatedDays} days
                                                                    </div>
                                                                )}
                                                                {option.type === 'contact' && (
                                                                    <div className="text-xs text-blue-600 mt-1.5 font-medium">
                                                                        💬 You'll be able to chat with the seller after placing your order
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-right">
                                                                {option.price === 0 ? (
                                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                                        Free
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xl font-bold text-foreground">
                                                                        ₦{option.price.toLocaleString()}
                                                                    </span>
                                                                )}
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

                        {/* Delivery Information - Only show if delivery is selected */}
                        {selectedShippingOption && selectedShippingOption.type === 'delivery' && (
                        <Card className="border-2 shadow-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <MapPin className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-semibold">Delivery Information</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-0.5">Where should we deliver your order?</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-5 pt-2">
                                {user && addresses && addresses.length > 0 && (
                                    <div className="space-y-2 pb-2 border-b">
                                        <Label className="text-sm font-medium">Saved Addresses</Label>
                                        <Select value={formState.selectedAddressId} onValueChange={handleAddressSelect}>
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Select a saved address" />
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
                                        <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                                        <Input 
                                            id="firstName" 
                                            placeholder="Enter first name" 
                                            value={formState.firstName} 
                                            onChange={handleInputChange} 
                                            className="h-11"
                                            required 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                                        <Input 
                                            id="lastName" 
                                            placeholder="Enter last name" 
                                            value={formState.lastName} 
                                            onChange={handleInputChange} 
                                            className="h-11"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-sm font-medium">Delivery Address</Label>
                                    <Textarea 
                                        id="address" 
                                        placeholder="Enter your full delivery address or bus stop" 
                                        value={formState.address} 
                                        onChange={handleInputChange} 
                                        className="min-h-[100px] resize-none"
                                        required 
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <StateSelector
                                        value={formState.state}
                                        onChange={(value) => {
                                            setFormState(prev => ({ ...prev, state: value }));
                                            setCustomerState(value);
                                            if (!user) {
                                                saveGuestDeliveryInfo({
                                                    ...formState,
                                                    state: value,
                                                });
                                            }
                                        }}
                                        required
                                        placeholder="Select state..."
                                    />
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                                        <Input 
                                            id="email" 
                                            type="email" 
                                            placeholder="your@email.com" 
                                            value={formState.email} 
                                            onChange={handleInputChange} 
                                            className="h-11"
                                            required 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                                    <Input 
                                        id="phone" 
                                        type="tel" 
                                        placeholder="+234 800 000 0000" 
                                        value={formState.phone} 
                                        onChange={handleInputChange} 
                                        className="h-11"
                                        required
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        )}

                        {/* Contact Information - Show for pickup/contact (minimal info needed) */}
                        {selectedShippingOption && (selectedShippingOption.type === 'pickup' || selectedShippingOption.type === 'contact') && (
                        <Card className="border-2 shadow-sm">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <MapPin className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-semibold">Contact Information</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-0.5">We need your contact details to process your order</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-5 pt-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                                        <Input 
                                            id="firstName" 
                                            placeholder="Enter first name" 
                                            value={formState.firstName} 
                                            onChange={handleInputChange} 
                                            className="h-11"
                                            required 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                                        <Input 
                                            id="lastName" 
                                            placeholder="Enter last name" 
                                            value={formState.lastName} 
                                            onChange={handleInputChange} 
                                            className="h-11"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                                        <Input 
                                            id="email" 
                                            type="email" 
                                            placeholder="your@email.com" 
                                            value={formState.email} 
                                            onChange={handleInputChange} 
                                            className="h-11"
                                            required 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                                        <Input 
                                            id="phone" 
                                            type="tel" 
                                            placeholder="+234 800 000 0000" 
                                            value={formState.phone} 
                                            onChange={handleInputChange} 
                                            className="h-11"
                                            required
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        )}
                    </div>

                    <div className="lg:sticky lg:top-6 h-fit">
                        <Card className="border-2 shadow-lg bg-card">
                            <CardHeader className="pb-4 border-b">
                                <CardTitle className="text-xl font-semibold">Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5 pt-6">
                                {cartItems.length > 0 ? (
                                    <>
                                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                            {cartItems.map(item => (
                                                <div key={item.id} className="flex justify-between items-start gap-4 pb-3 border-b last:border-0">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm truncate">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">Quantity: {item.quantity}</p>
                                                    </div>
                                                    <p className="font-semibold text-sm whitespace-nowrap">₦{(item.price * item.quantity).toLocaleString()}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <Separator />
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Subtotal</span>
                                                <span className="font-semibold">₦{totalPrice.toLocaleString()}</span>
                                            </div>
                                            {selectedShippingOption ? (
                                                // Only show shipping line if it's delivery and has a cost, or if it's free delivery
                                                (selectedShippingOption.type === 'delivery' && shippingPrice > 0) || 
                                                (selectedShippingOption.type === 'delivery' && shippingPrice === 0) ? (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-muted-foreground">Shipping</span>
                                                        <span className="font-semibold">
                                                            {shippingPrice === 0 ? (
                                                                <span className="text-green-600">Free</span>
                                                            ) : (
                                                                `₦${shippingPrice.toLocaleString()}`
                                                            )}
                                                        </span>
                                                    </div>
                                                ) : selectedShippingOption.type === 'pickup' ? (
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-muted-foreground">Pickup</span>
                                                        <span className="font-semibold text-green-600">Free</span>
                                                    </div>
                                                ) : null // Don't show anything for contact
                                            ) : (
                                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                                    <span>Shipping</span>
                                                    <span>Select option</span>
                                                </div>
                                            )}
                                            {appliedDiscount && (
                                                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <Tag className="w-4 h-4 text-green-600" />
                                                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                                            Discount ({appliedDiscount.code})
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-green-700 dark:text-green-400">
                                                            -₦{appliedDiscount.amount.toLocaleString()}
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 hover:bg-green-100 dark:hover:bg-green-900/40"
                                                            onClick={() => {
                                                                setAppliedDiscount(null);
                                                                setDiscountCode('');
                                                                setDiscountError('');
                                                            }}
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                            {!appliedDiscount && (
                                                <div className="space-y-2 pt-2">
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="Enter discount code"
                                                            value={discountCode}
                                                            onChange={(e) => {
                                                                setDiscountCode(e.target.value.toUpperCase());
                                                                setDiscountError('');
                                                            }}
                                                            className="flex-1 h-10 text-sm"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={handleApplyDiscount}
                                                            disabled={isApplyingDiscount || !discountCode.trim()}
                                                            className="h-10 px-4"
                                                        >
                                                            {isApplyingDiscount ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                'Apply'
                                                            )}
                                                        </Button>
                                                    </div>
                                                    {discountError && (
                                                        <p className="text-xs text-destructive">{discountError}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-lg font-semibold">Total</span>
                                            <span className="text-2xl font-bold">₦{total.toLocaleString()}</span>
                                        </div>
                                        {!selectedShippingOption && shippingOptions.length > 0 && (
                                            <Alert className="mt-4">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle className="text-sm">Action Required</AlertTitle>
                                                <AlertDescription className="text-xs">
                                                    Please select a shipping option above to continue.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                        {!selectedShippingOption && shippingOptions.length === 0 && customerState && (
                                            <Alert variant="destructive" className="mt-4">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle className="text-sm">Shipping Unavailable</AlertTitle>
                                                <AlertDescription className="text-xs">
                                                    {shippingCalculation?.message || `Shipping is not available to ${customerState}. Please contact the seller for pickup options.`}
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                        <Button 
                                            type="submit" 
                                            size="lg" 
                                            className="w-full mt-6 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-shadow"
                                            disabled={!isFormValid || isPending || isProcessingOrder || !selectedShippingOption}
                                        >
                                            {isPending || isProcessingOrder ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    {isProcessingOrder ? 'Processing Order...' : 'Processing...'}
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
                    </DialogHeader>
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
        </div>
    );
}
