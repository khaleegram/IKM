
'use client';

import Link from 'next/link';
import { ArrowLeft, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

// Mock user data, in a real app this would come from a context or API call
const user = {
  name: 'Bolu Adekunle',
  email: 'bolu.adekunle@example.com',
  phone: '08012345678',
  avatar: 'https://placehold.co/150x150.png',
  role: 'Seller', // Can be 'Buyer', 'Seller', or 'Rider'
  storeName: 'The Artisan Shop',
  storeBio: 'Curating the finest handmade goods from across the continent.',
  vehicleType: 'Motorcycle',
  licensePlate: 'ABC-123DE',
};

export default function EditProfilePage() {
  const { toast } = useToast();

  const handleSaveChanges = () => {
    toast({
        title: "✅ Profile Updated",
        description: "Your changes have been saved successfully.",
        duration: 5000,
    })
  }

  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 sm:p-6 bg-background border-b flex items-center gap-4">
        <Link href="/profile">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold font-headline">Edit Profile</h1>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          <Card>
            <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person portrait" />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Button size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8 border-2 border-background">
                            <Camera className="h-4 w-4" />
                            <span className="sr-only">Change photo</span>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 mt-8">
                    <div className="space-y-2">
                        <Label htmlFor="fullname">Full Name</Label>
                        <Input id="fullname" defaultValue={user.name} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" type="tel" defaultValue={user.phone} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" defaultValue={user.email} disabled />
                    </div>
                </div>
            </CardContent>
          </Card>

          {user.role === 'Seller' && (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-lg">Seller Profile</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6">
                 <div className="space-y-2">
                    <Label htmlFor="store-name">Store Name</Label>
                    <Input id="store-name" defaultValue={user.storeName} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="store-bio">Store Bio</Label>
                    <Textarea id="store-bio" defaultValue={user.storeBio} rows={4} />
                </div>
              </CardContent>
            </Card>
          )}

           {user.role === 'Rider' && (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-lg">Rider Profile</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6">
                 <div className="space-y-2">
                    <Label htmlFor="vehicle-type">Vehicle Type</Label>
                    <Input id="vehicle-type" defaultValue={user.vehicleType} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="license-plate">License Plate</Label>
                    <Input id="license-plate" defaultValue={user.licensePlate} />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="pt-4">
            <Button size="lg" className="w-full" onClick={handleSaveChanges}>
                Save Changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
