'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/firebase/auth/use-user';
import { useUserProfile } from '@/lib/firebase/firestore/users';
import { useToast } from '@/hooks/use-toast';
import { completeStoreSetup } from '@/lib/store-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, Check, Store, MapPin, Briefcase, FileText } from 'lucide-react';
import { NIGERIAN_STATES, getLGAsForState } from '@/lib/data/nigerian-locations';
import { BUSINESS_CATEGORIES } from '@/lib/data/business-categories';
import Image from 'next/image';

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const { data: userProfile, isLoading: isLoadingProfile } = useUserProfile(user?.uid);
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(1);

  // Optional: Show a message if onboarding is already completed, but don't force redirect
  // Users can still access this page to update their store setup

  // Step 1: Store Basics
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');

  // Step 2: Store Images
  const [storeLogo, setStoreLogo] = useState<File | null>(null);
  const [storeBanner, setStoreBanner] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Step 3: Location
  const [selectedState, setSelectedState] = useState('');
  const [selectedLGA, setSelectedLGA] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  // Step 4: Business Type
  const [businessType, setBusinessType] = useState('');

  // Step 5: Policies
  const [shippingPolicy, setShippingPolicy] = useState('');
  const [returnsPolicy, setReturnsPolicy] = useState('');
  const [refundsPolicy, setRefundsPolicy] = useState('');
  const [privacyPolicy, setPrivacyPolicy] = useState('');

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

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStoreBanner(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return storeName.trim().length > 0 && storeDescription.trim().length >= 10;
      case 2:
        return true; // Images are optional
      case 3:
        return selectedState && selectedLGA && city.trim().length > 0;
      case 4:
        return businessType.length > 0;
      case 5:
        return true; // Policies are optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to complete setup.',
      });
      return;
    }

    if (!canProceed()) {
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
        if (storeLogo) formData.append('storeLogo', storeLogo);
        if (storeBanner) formData.append('storeBanner', storeBanner);
        formData.append('state', selectedState);
        formData.append('lga', selectedLGA);
        formData.append('city', city);
        if (address) formData.append('address', address);
        formData.append('businessType', businessType);
        if (shippingPolicy) formData.append('shippingPolicy', shippingPolicy);
        if (returnsPolicy) formData.append('returnsPolicy', returnsPolicy);
        if (refundsPolicy) formData.append('refundsPolicy', refundsPolicy);
        if (privacyPolicy) formData.append('privacyPolicy', privacyPolicy);

        const result = await completeStoreSetup(user.uid, formData);

        console.log('✅ Onboarding complete, result:', result);

        toast({
          title: 'Store Setup Complete!',
          description: 'Your store is now ready. Welcome to IKM Marketplace!',
        });

        // Small delay to ensure Firestore listener picks up the changes
        await new Promise(resolve => setTimeout(resolve, 500));

        router.push('/seller/dashboard');
        router.refresh(); // Force refresh to ensure latest data
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Setup Failed',
          description: (error as Error).message,
        });
      }
    });
  };

  const stepIcons = [
    { icon: Store, label: 'Store Basics' },
    { icon: Upload, label: 'Store Images' },
    { icon: MapPin, label: 'Location' },
    { icon: Briefcase, label: 'Business Type' },
    { icon: FileText, label: 'Policies' },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-xl sm:text-2xl font-headline">Set Up Your Store</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Step {currentStep} of {TOTAL_STEPS}: {stepIcons[currentStep - 1]?.label}
              </CardDescription>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {Math.round((currentStep / TOTAL_STEPS) * 100)}% Complete
            </div>
          </div>
          <Progress value={(currentStep / TOTAL_STEPS) * 100} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {/* Step 1: Store Basics */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="storeName">Store Name *</Label>
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g., Ahmad's Fashion Store"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Choose a memorable name for your store
                </p>
              </div>
              <div>
                <Label htmlFor="storeDescription">Store Description *</Label>
                <Textarea
                  id="storeDescription"
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  placeholder="Tell customers about your store, what you sell, and what makes you special..."
                  rows={5}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 10 characters. Describe your store to attract customers.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Store Images */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <Label>Store Logo (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Upload a square logo for your store. Recommended: 400x400px
                </p>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="flex-1"
                  />
                  {logoPreview && (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
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
              <div>
                <Label>Store Banner (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Upload a banner image for your store page. Recommended: 1200x300px
                </p>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                  />
                  {bannerPreview && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                      <Image
                        src={bannerPreview}
                        alt="Banner preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="state">State *</Label>
                <Select value={selectedState} onValueChange={(value) => {
                  setSelectedState(value);
                  setSelectedLGA(''); // Reset LGA when state changes
                }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your state" />
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
                <Label htmlFor="lga">Local Government Area (LGA) *</Label>
                <Select 
                  value={selectedLGA} 
                  onValueChange={setSelectedLGA}
                  disabled={!selectedState}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={selectedState ? "Select your LGA" : "Select state first"} />
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
              <div>
                <Label htmlFor="city">City/Town *</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., Kano, Kaduna, Maiduguri"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="address">Street Address (Optional)</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Your store address or landmark"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Step 4: Business Type */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <Label>What type of business do you run? *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {BUSINESS_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setBusinessType(category.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      businessType === category.id
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <div className="font-semibold">{category.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {category.description}
                    </div>
                    {businessType === category.id && (
                      <Check className="h-5 w-5 text-primary mt-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Policies */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Set up your store policies. These help build trust with customers. All fields are optional.
              </p>
              <div>
                <Label htmlFor="shippingPolicy">Shipping Policy</Label>
                <Textarea
                  id="shippingPolicy"
                  value={shippingPolicy}
                  onChange={(e) => setShippingPolicy(e.target.value)}
                  placeholder="How do you handle shipping? Delivery times, costs, etc."
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="returnsPolicy">Returns Policy</Label>
                <Textarea
                  id="returnsPolicy"
                  value={returnsPolicy}
                  onChange={(e) => setReturnsPolicy(e.target.value)}
                  placeholder="What is your returns policy?"
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="refundsPolicy">Refunds Policy</Label>
                <Textarea
                  id="refundsPolicy"
                  value={refundsPolicy}
                  onChange={(e) => setRefundsPolicy(e.target.value)}
                  placeholder="How do you handle refunds?"
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="privacyPolicy">Privacy Policy</Label>
                <Textarea
                  id="privacyPolicy"
                  value={privacyPolicy}
                  onChange={(e) => setPrivacyPolicy(e.target.value)}
                  placeholder="How do you protect customer data?"
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || isPending}
              >
                Back
              </Button>
              {currentStep === 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/seller/dashboard')}
                  disabled={isPending}
                >
                  Skip for Now
                </Button>
              )}
            </div>
            {currentStep < TOTAL_STEPS ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed() || isPending}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceed() || isPending}
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
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

