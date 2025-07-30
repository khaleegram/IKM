
"use client";

import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function RiderPage() {
  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 sm:p-6 bg-background border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src="https://placehold.co/100x100.png" alt="Rider Alex" />
              <AvatarFallback>RA</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold font-headline">Rider: Alex Ray</h1>
              <p className="text-muted-foreground">Ready to hit the road and make deliveries.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 self-end sm:self-center">
            <Label htmlFor="online-status" className="font-medium text-sm">Offline</Label>
            <Switch id="online-status" />
            <Label htmlFor="online-status" className="font-medium text-green-600 text-sm">Online</Label>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Co-Pilot Route Suggestion</CardTitle>
              <CardDescription>Your next optimal delivery route is ready.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3">
                  <h3 className="font-semibold">Next Pickup:</h3>
                  <p>The Grind Coffee House</p>
                  <p className="text-sm text-muted-foreground">123 Cafe Lane</p>
                  <h3 className="font-semibold mt-4">Destination:</h3>
                  <p>Jane Doe</p>
                  <p className="text-sm text-muted-foreground">456 Apartment Ave</p>
                  <p className="mt-4 text-sm">Estimated Time: <span className="font-bold text-primary">12 mins</span></p>
                  <p className="text-sm">Distance: <span className="font-bold text-primary">2.1 miles</span></p>
                </div>
                <div className="w-full md:w-2/3 rounded-lg overflow-hidden aspect-video md:aspect-auto">
                    <Image
                        src="https://placehold.co/800x600.png"
                        alt="Mini-map of route"
                        width={800}
                        height={600}
                        className="object-cover w-full h-full"
                        data-ai-hint="map city"
                    />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
