
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type DeliveryStep = 'pickup' | 'dropoff';

export default function ActiveDeliveryPage() {
  const router = useRouter();
  const [step, setStep] = useState<DeliveryStep>('pickup');

  const handlePrimaryAction = () => {
    if (step === 'pickup') {
      setStep('dropoff');
    } else {
      // In a real app, this would likely submit the final confirmation
      // and navigate to a completed screen or back to the dashboard.
      router.push('/rider');
    }
  };

  const primaryButtonText = step === 'pickup' ? 'Confirm Pickup' : 'Confirm Delivery';
  const taskText = step === 'pickup' ? 'Step 1: Proceed to Pickup Location' : 'Step 2: Proceed to Drop-off Location';

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 flex items-center justify-between border-b">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-lg font-bold font-headline">Active Delivery</h1>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 flex flex-col">
        {/* Map View */}
        <div className="relative flex-grow bg-muted">
          <Image
            src="https://placehold.co/800x600.png"
            alt="Live map view"
            layout="fill"
            objectFit="cover"
            data-ai-hint="map navigation"
          />
        </div>

        {/* Cockpit Controls */}
        <div className="p-4 space-y-4 border-t-4 border-primary bg-background">
          <div className="text-center p-3 rounded-lg bg-primary/10">
            <h2 className="font-bold text-lg font-headline text-primary">{taskText}</h2>
          </div>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">FROM (SELLER)</p>
                <div className="flex items-center justify-between">
                  <p>Wuse Market, Zone 5, Abuja</p>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">TO (BUYER)</p>
                <div className="flex items-center justify-between">
                  <p>123 Adetokunbo Ademola Cres, Wuse II</p>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button variant="link" size="sm" className="w-full text-muted-foreground">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Report an Issue
          </Button>
        </div>
      </div>

      <footer className="p-4 border-t bg-background">
        <Button size="lg" className="w-full h-14 text-lg" onClick={handlePrimaryAction}>
          {primaryButtonText}
        </Button>
      </footer>
    </div>
  );
}
