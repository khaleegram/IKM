
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

export default function SellerSettingsPage() {
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent, section: string) => {
        e.preventDefault();
        toast({
            title: "Settings Saved!",
            description: `Your ${section} settings have been updated.`,
        });
    }

    const deliveryLocations = [
        { id: 1, name: "Jabi Park, Abuja" },
        { id: 2, name: "Tashan Bama, Kano" },
        { id: 3, name: "Ojota Bus Stop, Lagos" },
    ];

    return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 bg-background border-b">
        <div>
          <h1 className="text-2xl font-bold font-headline">Store Settings</h1>
          <p className="text-muted-foreground">Manage your store's profile, integrations, and delivery options.</p>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        <form onSubmit={(e) => handleSubmit(e, 'Store Profile')}>
            <Card>
                <CardHeader>
                    <CardTitle>Store Profile</CardTitle>
                    <CardDescription>This is how your store will appear to customers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="storeName">Store Name</Label>
                        <Input id="storeName" defaultValue="Mary's Store" />
                    </div>
                    <div>
                        <Label htmlFor="storeDescription">Store Description</Label>
                        <Textarea id="storeDescription" defaultValue="Handmade Crafts & Apparel" rows={3} />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit">Save Changes</Button>
                </CardFooter>
            </Card>
        </form>

        <form onSubmit={(e) => handleSubmit(e, 'WhatsApp')}>
            <Card>
                <CardHeader>
                    <CardTitle>WhatsApp Integration</CardTitle>
                    <CardDescription>Connect your WhatsApp Business number to receive order notifications and allow customers to order via chat.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div>
                        <Label htmlFor="whatsappNumber">WhatsApp Business Number</Label>
                        <Input id="whatsappNumber" placeholder="+234..." type="tel" />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit">Save & Connect</Button>
                </CardFooter>
            </Card>
        </form>

        <Card>
            <CardHeader>
                <CardTitle>Delivery Locations</CardTitle>
                <CardDescription>Add the bus stops or pickup points you deliver to. This helps customers know where they can receive their orders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <ul className="space-y-3">
                    {deliveryLocations.map(location => (
                        <li key={location.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <span className="font-medium">{location.name}</span>
                             <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </li>
                    ))}
                </ul>
                <form onSubmit={(e) => handleSubmit(e, 'New Location')} className="flex gap-2">
                    <Input placeholder="Enter new bus stop or location" />
                    <Button type="submit">Add Location</Button>
                </form>
            </CardContent>
        </Card>

      </main>
    </div>
    )
}
