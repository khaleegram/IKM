
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

type DeliveryJob = {
  id: string;
  from: string;
  to: string;
  fee: number;
  mapImage: string;
};

const deliveryJobs: DeliveryJob[] = [
  {
    id: 'job1',
    from: 'Wuse Market, Zone 5',
    to: '123 Adetokunbo Ademola Cres, Wuse II',
    fee: 1500,
    mapImage: 'https://placehold.co/800x400.png',
  },
  {
    id: 'job2',
    from: 'Jabi Lake Mall',
    to: '456 Aminu Kano Cres, Wuse II',
    fee: 1800,
    mapImage: 'https://placehold.co/800x400.png',
  },
];


export default function RiderPage() {
    const [isOnline, setIsOnline] = useState(false);

  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 sm:p-6 bg-background border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src="https://placehold.co/100x100.png" alt="Rider Alex" data-ai-hint="person portrait" />
              <AvatarFallback>RA</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold font-headline">Rider: Alex Ray</h1>
              <p className="text-muted-foreground">Ready to hit the road and make deliveries.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 self-end sm:self-center">
            <Label htmlFor="online-status" className={`font-medium text-sm ${!isOnline ? 'text-foreground' : 'text-muted-foreground'}`}>Offline</Label>
            <Switch id="online-status" checked={isOnline} onCheckedChange={setIsOnline} />
            <Label htmlFor="online-status" className={`font-medium text-sm ${isOnline ? 'text-support' : 'text-muted-foreground'}`}>Online</Label>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        {isOnline ? (
            <div className="grid gap-6">
                <h2 className="text-lg font-semibold font-headline">New Delivery Requests</h2>
                {deliveryJobs.map((job) => (
                    <Card key={job.id} className="overflow-hidden">
                        <div className="relative h-40">
                             <Image
                                src={job.mapImage}
                                alt="Route map"
                                layout="fill"
                                objectFit="cover"
                                data-ai-hint="map city"
                            />
                        </div>
                        <CardContent className="p-4 space-y-4">
                             <div>
                                <p className="text-xs font-semibold uppercase text-muted-foreground">FROM:</p>
                                <p>{job.from}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase text-muted-foreground">TO:</p>
                                <p>{job.to}</p>
                            </div>
                             <div className="text-center py-2">
                                <p className="text-sm text-muted-foreground">Your Fee</p>
                                <p className="text-2xl font-bold text-primary">₦{job.fee.toLocaleString()}</p>
                            </div>
                             <div className="grid grid-cols-2 gap-3 pt-2">
                                <Button variant="outline" size="lg">Decline</Button>
                                <Link href={`/rider/active-delivery?jobId=${job.id}`} className="w-full">
                                    <Button variant="default" size="lg" className="w-full">Accept</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : (
             <Card className="text-center">
                <CardHeader>
                    <CardTitle className="font-headline">You are Offline</CardTitle>
                    <CardDescription>Toggle the switch above to go online and see new delivery requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="w-full aspect-video rounded-lg overflow-hidden flex items-center justify-center bg-muted">
                        <Image
                            src="https://placehold.co/800x600.png"
                            alt="Map illustration"
                            width={400}
                            height={300}
                            className="object-contain"
                            data-ai-hint="map waiting"
                        />
                    </div>
                </CardContent>
            </Card>
        )}
      </main>
    </div>
  );
}
