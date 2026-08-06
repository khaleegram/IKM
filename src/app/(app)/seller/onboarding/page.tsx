'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { NIGERIAN_STATES, getLGAsForState } from '@/lib/data/nigerian-locations';
import { useUser } from '@/lib/firebase/auth/use-user';
import { completeStoreSetup } from '@/lib/store-actions';
import { Loader2, Sparkles, Store } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export default function OnboardingPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [storeType, setStoreType] = useState<'retail' | 'artisan' | null>(null);
  const [step, setStep] = useState<'select' | 'setup' | 'logo'>('select');

  // Store setup fields
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedLGA, setSelectedLGA] = useState('');
  const [city, setCity] = useState('');
  const [storeLogo, setStoreLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const availableLGAs = selectedState ? getLGAsForState(selectedState) : [];

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStoreLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const canProceedSetup = () => {
    return (
      storeName.trim().length > 0 &&
      storeDescription.trim().length >= 10 &&
      selectedState &&
      selectedLGA &&
      city.trim().length > 0
    );
  };

  const handleCompleteSetup = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to complete setup.',
      });
      return;
    }

    if (!canProceedSetup()) {
      toast({
        variant: 'destructive',
        title: 'Incomplete Information',
        description: 'Please complete all required fields.',
      });
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('storeName', storeName);
        formData.append('storeDescription', storeDescription);
        formData.append('state', selectedState);
        formData.append('lga', selectedLGA);
        formData.append('city', city);
        formData.append('storeType', storeType!);
        formData.append('businessType', 'general'); // Default, can be changed later
        if (storeLogo) formData.append('storeLogo', storeLogo);

        await completeStoreSetup(user.uid, formData);

        toast({
          title: 'Store Setup Complete!',
          description: 'Your store is now ready. Welcome to IKM Marketplace!',
        });

        await new Promise(resolve => setTimeout(resolve, 500));
        router.push('/seller/dashboard');
        router.refresh();
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Setup Failed',
          description: (error as Error).message,
        });
      }
    });
  };

  // Step 1: Store Type Selection
  if (step === 'select') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl sm:text-3xl font-headline">
              Choose Your Store Type
            </CardTitle>
            <CardDescription className="text-base">
              Select the type that best fits your business. You can change this later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Retail Store Option */}
              <button
                type="button"
                onClick={() => {
                  setStoreType('retail');
                  setStep('setup');
                }}
                className={`p-6 rounded-lg border-2 text-left transition-all hover:border-primary/50 ${
                  storeType === 'retail'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-3 rounded-lg ${storeType === 'retail' ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Store className={`h-6 w-6 ${storeType === 'retail' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="font-semibold text-lg">Retail Store</div>
                </div>
                <p className="text-sm text-muted-foreground">
                  For shops selling multiple products with inventory management. Perfect for online stores, fashion boutiques, electronics shops, etc.
                </p>
              </button>

              {/* Artisan Store Option */}
              <button
                type="button"
                onClick={() => {
                  setStoreType('artisan');
                  setStep('setup');
                }}
                className={`p-6 rounded-lg border-2 text-left transition-all hover:border-primary/50 ${
                  storeType === 'artisan'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-3 rounded-lg ${storeType === 'artisan' ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Sparkles className={`h-6 w-6 ${storeType === 'artisan' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="font-semibold text-lg">Artisan/Creator Store</div>
                </div>
                <p className="text-sm text-muted-foreground">
                  For creators selling handmade items or custom packages. Perfect for artisans, bakers, crafters, custom service providers.
                </p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Quick Setup (Name, Description, Location - All on one page)
  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl sm:text-2xl font-headline">
              {storeType === 'artisan' ? 'Set Up Your Creator Store' : 'Set Up Your Store'}
            </CardTitle>
            <CardDescription>
              Just the essentials. You can add more details later in settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {/* Store Name */}
            <div>
              <Label htmlFor="storeName">Store Name *</Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder={storeType === 'artisan' ? "e.g., Sarah's Handmade Crafts" : "e.g., Ahmad's Fashion Store"}
                className="mt-1"
              />
            </div>

            {/* Store Description */}
            <div>
              <Label htmlFor="storeDescription">What do you sell? *</Label>
              <Textarea
                id="storeDescription"
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                placeholder={storeType === 'artisan' ? "Briefly describe your handmade items or services..." : "Briefly describe what you sell..."}
                rows={3}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 10 characters. Keep it simple!
              </p>
            </div>

            {/* Location - Compact */}
            <div className="space-y-4">
              <Label>Where are you located? *</Label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state" className="text-xs">State</Label>
                  <Select 
                    value={selectedState} 
                    onValueChange={(value) => {
                      setSelectedState(value);
                      setSelectedLGA('');
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {NIGERIAN_STATES.map((state) => (
                        <SelectItem key={state.code} value={state.name}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="lga" className="text-xs">LGA</Label>
                  <Select 
                    value={selectedLGA} 
                    onValueChange={setSelectedLGA}
                    disabled={!selectedState}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={selectedState ? "Select LGA" : "Select state first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLGAs.map((lga) => (
                        <SelectItem key={lga} value={lga}>
                          {lga}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="city" className="text-xs">City/Town</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., Kano, Kaduna"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('select')}
                disabled={isPending}
              >
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCompleteSetup}
                  disabled={!canProceedSetup() || isPending}
                >
                  Skip Logo
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep('logo')}
                  disabled={!canProceedSetup() || isPending}
                >
                  Next: Add Logo (Optional)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 3: Optional Logo Upload
  if (step === 'logo') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl sm:text-2xl font-headline">
              Add Your Store Logo (Optional)
            </CardTitle>
            <CardDescription>
              A logo helps customers recognize your store. You can skip this and add it later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div>
              <Label>Store Logo</Label>
              <div className="mt-2 space-y-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
                {logoPreview && (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('setup')}
                disabled={isPending}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleCompleteSetup}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting Up...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
