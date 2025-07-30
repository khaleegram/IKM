
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

const VisaLogo = () => <svg width="40" height="25" viewBox="0 0 40 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M29.82.02H25.35a.86.86 0 00-.83.6l-4.73 11.22-1.7-3.8A1.23 1.23 0 0017.16 7.4l-4.25-7.3a.56.56 0 00-.5-.3H8.3a.56.56 0 00-.5.3L0 23.99c0 .3.2.5.5.5h4.6c.3 0 .4-.19.5-.4l2.4-5.9 1.12 2.65a.86.86 0 00.84.6h4.56c.3 0 .4-.2.5-.4l6.38-14.88 2.5 6.32a.5.5 0 00.5.4h4.08c.3 0 .5-.2.5-.4l2.2-7.07a.5.5 0 00-.48-.65zm-11.26 9.3L16.2 3.4l2.5 13.6-2.5-7.7zM6.54 20.39L9.7 12l2.3 5.4-5.45 2.99zM.88 23.59l6.16-14.4 3.3 5.8-6.18 9-3.28-.4zM26.4 7.4l-1.3-3.2 2.7-4.2h3.12l-4.52 7.4z" fill="#1A1F71"/></svg>
const MastercardLogo = () => <svg width="40" height="25" viewBox="0 0 40 25" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12.5" cy="12.5" r="12.5" fill="#EB001B"/><circle cx="27.5" cy="12.5" r="12.5" fill="#F79E1B"/><path d="M20 20.14a12.5 12.5 0 010-15.28 12.5 12.5 0 000 15.28z" fill="#FF5F00"/></svg>
const VerveLogo = () => <svg width="40" height="25" viewBox="0 0 40 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M38.6 15.5H27.1c-1.3 0-2.3-1-2.3-2.3v-1.4c0-1.3 1-2.3 2.3-2.3h12.8c.4 0 .7.3.7.7v4.6c0 .4-.3.7-.7.7a.69.69 0 01-.6-.7zm-11.4-4.6h11.4v-2.1H27.2c-.4 0-.7.3-.7.7v.7c0 .4.3.7.7.7zM14.2 12.5l-2.4 3c-3-3.8-5-6.5-5.2-6.8a1.3 1.3 0 00-2-.3L1.2 12a.7.7 0 00.6 1.1h1.5l1.6-2c2 2.5 4 5 4.5 5.7.5.6 1.1.6 1.6 0l1.7-2.1a.7.7 0 00-.5-1.2h-1.2v-.1l1.6-1.9z" fill="#000"/></svg>

const riders = [
  { id: 'r1', name: 'Jide Okoro', rating: 4.8, fee: 1500, image: 'https://placehold.co/100x100.png' },
  { id: 'r2', name: 'Amina Bello', rating: 4.9, fee: 1200, image: 'https://placehold.co/100x100.png' },
  { id: 'r3', name: 'Chinedu Eze', rating: 4.7, fee: 1800, image: 'https://placehold.co/100x100.png' },
];

const subtotal = 25000;

export default function CheckoutPage() {
  const { toast } = useToast();
  const [deliveryMethod, setDeliveryMethod] = useState('seller');
  const [selectedRider, setSelectedRider] = useState<typeof riders[0] | null>(null);

  const deliveryFee = deliveryMethod === 'rider' && selectedRider ? selectedRider.fee : 0;
  const totalAmount = subtotal + deliveryFee;

  const handlePlaceOrder = () => {
    toast({
        title: "🎉 Order Placed!",
        description: "Your order has been received and is being processed.",
        duration: 5000,
    })
  }

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 border-b flex items-center">
        <Link href="/buyer/cart">
          <Button variant="ghost" size="icon">
            <ArrowLeft />
          </Button>
        </Link>
        <h1 className="text-xl font-bold font-headline ml-2 sm:ml-4">Checkout</h1>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            {/* Section 1: Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-xl">1. Ship To</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullname">Full Name</Label>
                  <Input id="fullname" placeholder="Enter your full name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="Enter your phone number" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Delivery Address</Label>
                  <Input id="address" placeholder="Enter your delivery address" />
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox id="save-address" />
                  <Label htmlFor="save-address" className="text-sm font-normal">Save this address for future orders</Label>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Delivery Method */}
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-xl">2. Choose Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod} className="space-y-4">
                  <div>
                    <RadioGroupItem value="seller" id="seller-arranged" className="peer sr-only" />
                    <Label htmlFor="seller-arranged" className="flex flex-col p-4 border rounded-md cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5">
                      <span className="font-semibold">Seller-Arranged Delivery</span>
                      <span className="text-xs text-muted-foreground">Contact seller directly for fee and arrangements</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="rider" id="ikm-rider" className="peer sr-only" />
                    <Label htmlFor="ikm-rider" className="flex flex-col p-4 border rounded-md cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5">
                      <span className="font-semibold">Book an IKM Rider</span>
                      <span className="text-xs text-muted-foreground">Select a verified rider for fast delivery</span>
                    </Label>
                    {deliveryMethod === 'rider' && (
                        <div className="mt-4 space-y-3 pl-2">
                            {riders.map(rider => (
                                <div key={rider.id} onClick={() => setSelectedRider(rider)} className={`flex items-center gap-4 p-3 border rounded-lg cursor-pointer ${selectedRider?.id === rider.id ? 'border-primary bg-primary/10' : ''}`}>
                                    <Avatar>
                                        <AvatarImage src={rider.image} alt={rider.name} data-ai-hint="person portrait" />
                                        <AvatarFallback>{rider.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow">
                                        <p className="font-medium">{rider.name}</p>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Star className="w-3 h-3 fill-accent text-accent" /> {rider.rating}
                                        </div>
                                    </div>
                                    <p className="font-semibold text-primary">₦{rider.fee.toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    )}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Section 3: Payment Method */}
             <Card>
              <CardHeader>
                <CardTitle className="font-headline text-xl">3. Payment</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="p-4 border rounded-md bg-muted/20">
                    <p className="font-semibold">Pay Securely via Paystack/Flutterwave</p>
                    <div className="flex items-center gap-4 mt-3">
                        <VisaLogo />
                        <MastercardLogo />
                        <VerveLogo />
                    </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 lg:sticky top-6">
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
                  <span>{deliveryFee > 0 ? `₦${deliveryFee.toLocaleString()}` : '—'}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Amount</span>
                  <span>₦{totalAmount.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
            <Button size="lg" className="w-full mt-6" onClick={handlePlaceOrder}>Place Order & Pay</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
