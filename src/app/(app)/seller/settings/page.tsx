
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";
import { useFirebase } from "@/firebase";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useUserProfile, updateUserProfile, addDeliveryLocation, deleteDeliveryLocation, DeliveryLocation } from "@/lib/firebase/firestore/users";
import { useState, useEffect, useTransition } from "react";

export default function SellerSettingsPage() {
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const { data: userProfile, isLoading: isLoadingProfile } = useUserProfile(authUser?.uid);

    const [isPending, startTransition] = useTransition();
    const [storeName, setStoreName] = useState('');
    const [storeDescription, setStoreDescription] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [newLocation, setNewLocation] = useState('');


    useEffect(() => {
        if (userProfile) {
            setStoreName(userProfile.storeName || '');
            setStoreDescription(userProfile.storeDescription || '');
            setWhatsappNumber(userProfile.whatsappNumber || '');
        }
    }, [userProfile]);

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!authUser) return;

        startTransition(async () => {
            try {
                await updateUserProfile(authUser.uid, {
                    storeName,
                    storeDescription
                });
                toast({
                    title: "Settings Saved!",
                    description: `Your Store Profile settings have been updated.`,
                });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Update Failed', description: (error as Error).message });
            }
        });
    }
    
    const handleWhatsAppSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!authUser) return;

        startTransition(async () => {
            try {
                await updateUserProfile(authUser.uid, { whatsappNumber });
                toast({
                    title: "Settings Saved!",
                    description: `Your WhatsApp number has been updated.`,
                });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Update Failed', description: (error as Error).message });
            }
        });
    }

    const handleAddLocation = (e: React.FormEvent) => {
        e.preventDefault();
        if (!authUser || !newLocation.trim()) return;
        
        startTransition(async () => {
            try {
                await addDeliveryLocation(authUser.uid, { name: newLocation });
                setNewLocation('');
                toast({
                    title: "Location Added!",
                    description: `"${newLocation}" has been added to your delivery locations.`,
                });
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Failed to add location', description: (error as Error).message });
            }
        });
    }

    const handleDeleteLocation = (locationId: string) => {
        if (!authUser) return;

        startTransition(async () => {
            try {
                await deleteDeliveryLocation(authUser.uid, locationId);
                 toast({
                    title: "Location Removed",
                    description: `The location has been removed.`,
                });
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Failed to remove location', description: (error as Error).message });
            }
        });
    }

    if (isLoadingProfile) {
        return (
             <div className="flex items-center justify-center h-full">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        )
    }


    return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 bg-background border-b">
        <div>
          <h1 className="text-2xl font-bold font-headline">Store Settings</h1>
          <p className="text-muted-foreground">Manage your store's profile, integrations, and delivery options.</p>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        <form onSubmit={handleProfileSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Store Profile</CardTitle>
                    <CardDescription>This is how your store will appear to customers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="storeName">Store Name</Label>
                        <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="storeDescription">Store Description</Label>
                        <Textarea id="storeDescription" value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} rows={3} />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Changes'}</Button>
                </CardFooter>
            </Card>
        </form>

        <form onSubmit={handleWhatsAppSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>WhatsApp Integration</CardTitle>
                    <CardDescription>Connect your WhatsApp Business number to receive order notifications and allow customers to order via chat.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div>
                        <Label htmlFor="whatsappNumber">WhatsApp Business Number</Label>
                        <Input id="whatsappNumber" placeholder="+234..." type="tel" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save & Connect'}</Button>
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
                    {userProfile?.deliveryLocations?.map(location => (
                        <li key={location.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <span className="font-medium">{location.name}</span>
                             <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" onClick={() => handleDeleteLocation(location.id)} disabled={isPending}>
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </li>
                    ))}
                </ul>
                <form onSubmit={handleAddLocation} className="flex gap-2">
                    <Input placeholder="Enter new bus stop or location" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} />
                    <Button type="submit" disabled={isPending}>{isPending ? 'Adding...' : 'Add Location'}</Button>
                </form>
            </CardContent>
        </Card>

      </main>
    </div>
    )
}
