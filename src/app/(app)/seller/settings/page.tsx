'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
// Removed useFirebase - all writes now go through server actions
import { useUser } from "@/lib/firebase/auth/use-user";
import { useStoreByUserId } from "@/lib/firebase/firestore/stores";
import { useUserProfile, DeliveryLocation } from "@/lib/firebase/firestore/users";
import { updateUserProfileAction, addDeliveryLocationAction, deleteDeliveryLocationAction } from "@/lib/user-actions";
import { useState, useEffect, useTransition } from "react";
import React from "react";
import { NIGERIAN_STATES, getLGAsForState } from "@/lib/data/nigerian-locations";
import { BUSINESS_CATEGORIES, getCategoryById } from "@/lib/data/business-categories";
import Image from "next/image";
import { updateStoreSettings } from "@/lib/store-actions";

export default function SellerSettingsPage() {
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const { data: store, isLoading: isLoadingStore } = useStoreByUserId(authUser?.uid);
    const { data: userProfile, isLoading: isLoadingProfile } = useUserProfile(authUser?.uid);

    const [isPending, startTransition] = useTransition();
    
    // Basic store info
    const [storeName, setStoreName] = useState('');
    const [storeDescription, setStoreDescription] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [newLocation, setNewLocation] = useState('');

    // Store images
    const [storeLogo, setStoreLogo] = useState<File | null>(null);
    const [storeBanner, setStoreBanner] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    // Location
    const [selectedState, setSelectedState] = useState('');
    const [selectedLGA, setSelectedLGA] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');

    // Business type
    const [businessType, setBusinessType] = useState('');

    // Policies
    const [shippingPolicy, setShippingPolicy] = useState('');
    const [returnsPolicy, setReturnsPolicy] = useState('');
    const [refundsPolicy, setRefundsPolicy] = useState('');
    const [privacyPolicy, setPrivacyPolicy] = useState('');

    // Social media links
    const [facebookUrl, setFacebookUrl] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [twitterUrl, setTwitterUrl] = useState('');
    const [tiktokUrl, setTiktokUrl] = useState('');

    // Store hours
    const [storeHours, setStoreHours] = useState({
        monday: '',
        tuesday: '',
        wednesday: '',
        thursday: '',
        friday: '',
        saturday: '',
        sunday: '',
    });

    // Contact info
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [website, setWebsite] = useState('');

    // Store theme
    const [primaryColor, setPrimaryColor] = useState('');
    const [secondaryColor, setSecondaryColor] = useState('');
    const [fontFamily, setFontFamily] = useState('');

    // SEO settings
    const [metaTitle, setMetaTitle] = useState('');
    const [metaDescription, setMetaDescription] = useState('');
    const [metaKeywords, setMetaKeywords] = useState('');

    const availableLGAs = selectedState ? getLGAsForState(selectedState) : [];

    // Load store data into form - always sync with latest store data
    useEffect(() => {
        if (store) {
            console.log('📋 Loading store into settings form:', {
                storeId: store.id,
                storeName: store.storeName,
                hasDescription: !!store.storeDescription,
                hasLocation: !!store.storeLocation,
                hasBusinessType: !!store.businessType,
                hasLogo: !!store.storeLogoUrl,
                hasBanner: !!store.storeBannerUrl,
            });
            
            // Always update form fields with latest data
            setStoreName(store.storeName || '');
            setStoreDescription(store.storeDescription || '');
            
            // Location
            if (store.storeLocation) {
                setSelectedState(store.storeLocation.state || '');
                setSelectedLGA(store.storeLocation.lga || '');
                setCity(store.storeLocation.city || '');
                setAddress(store.storeLocation.address || '');
            } else {
                // Clear location if not set
                setSelectedState('');
                setSelectedLGA('');
                setCity('');
                setAddress('');
            }
            
            // Business type
            setBusinessType(store.businessType || '');
            
            // Policies
            if (store.storePolicies) {
                setShippingPolicy(store.storePolicies.shipping || '');
                setReturnsPolicy(store.storePolicies.returns || '');
                setRefundsPolicy(store.storePolicies.refunds || '');
                setPrivacyPolicy(store.storePolicies.privacy || '');
            } else {
                // Clear policies if not set
                setShippingPolicy('');
                setReturnsPolicy('');
                setRefundsPolicy('');
                setPrivacyPolicy('');
            }

            // Social media links
            setFacebookUrl(store.facebookUrl || '');
            setInstagramUrl(store.instagramUrl || '');
            setTwitterUrl(store.twitterUrl || '');
            setTiktokUrl(store.tiktokUrl || '');

            // Store hours
            if (store.storeHours) {
                setStoreHours({
                    monday: store.storeHours.monday || '',
                    tuesday: store.storeHours.tuesday || '',
                    wednesday: store.storeHours.wednesday || '',
                    thursday: store.storeHours.thursday || '',
                    friday: store.storeHours.friday || '',
                    saturday: store.storeHours.saturday || '',
                    sunday: store.storeHours.sunday || '',
                });
            }

            // Contact info
            setEmail(store.email || '');
            setPhone(store.phone || '');
            setWebsite(store.website || '');

            // Store theme
            setPrimaryColor(store.primaryColor || '');
            setSecondaryColor(store.secondaryColor || '');
            setFontFamily(store.fontFamily || '');

            // SEO settings
            setMetaTitle(store.metaTitle || '');
            setMetaDescription(store.metaDescription || '');
            setMetaKeywords(store.metaKeywords || '');
            
            // Images preview - always show existing images
            if (store.storeLogoUrl) {
                setLogoPreview(store.storeLogoUrl);
            } else {
                setLogoPreview(null);
            }
            if (store.storeBannerUrl) {
                setBannerPreview(store.storeBannerUrl);
            } else {
                setBannerPreview(null);
            }
        } else if (!isLoadingStore) {
            // Clear form if no profile (user not logged in or profile doesn't exist)
            setStoreName('');
            setStoreDescription('');
            setWhatsappNumber('');
            setSelectedState('');
            setSelectedLGA('');
            setCity('');
            setAddress('');
            setBusinessType('');
            setShippingPolicy('');
            setReturnsPolicy('');
            setRefundsPolicy('');
            setPrivacyPolicy('');
            setLogoPreview(null);
            setBannerPreview(null);
        }
    }, [store, isLoadingStore]);

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

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!authUser) return;

        startTransition(async () => {
            try {
                await updateUserProfileAction(authUser.uid, {
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
                await updateUserProfileAction(authUser.uid, { whatsappNumber });
                toast({
                    title: "Settings Saved!",
                    description: `Your WhatsApp number has been updated.`,
                });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Update Failed', description: (error as Error).message });
            }
        });
    }

    const handleSocialMediaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authUser) return;

        startTransition(async () => {
            try {
                const formData = new FormData();
                if (facebookUrl) formData.append('facebookUrl', facebookUrl);
                if (instagramUrl) formData.append('instagramUrl', instagramUrl);
                if (twitterUrl) formData.append('twitterUrl', twitterUrl);
                if (tiktokUrl) formData.append('tiktokUrl', tiktokUrl);

                await updateStoreSettings(authUser.uid, formData);
                toast({
                    title: "Social Media Links Saved!",
                    description: "Your social media links have been updated successfully.",
                });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Update Failed', description: (error as Error).message });
            }
        });
    }

    const handleStoreHoursSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authUser) return;

        startTransition(async () => {
            try {
                const formData = new FormData();
                // Append each day's hours
                Object.entries(storeHours).forEach(([day, hours]) => {
                    formData.append(`storeHours[${day}]`, hours);
                });

                await updateStoreSettings(authUser.uid, formData);
                toast({
                    title: "Store Hours Saved!",
                    description: "Your store hours have been updated successfully.",
                });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Update Failed', description: (error as Error).message });
            }
        });
    }

    const handleContactInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authUser) return;

        startTransition(async () => {
            try {
                const formData = new FormData();
                if (email) formData.append('email', email);
                if (phone) formData.append('phone', phone);
                if (website) formData.append('website', website);

                await updateStoreSettings(authUser.uid, formData);
                toast({
                    title: "Contact Info Saved!",
                    description: "Your contact information has been updated successfully.",
                });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Update Failed', description: (error as Error).message });
            }
        });
    }

    const handleThemeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authUser) return;

        startTransition(async () => {
            try {
                const formData = new FormData();
                if (primaryColor) formData.append('primaryColor', primaryColor);
                if (secondaryColor) formData.append('secondaryColor', secondaryColor);
                if (fontFamily) formData.append('fontFamily', fontFamily);

                await updateStoreSettings(authUser.uid, formData);
                toast({
                    title: "Theme Saved!",
                    description: "Your store theme has been updated successfully.",
                });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Update Failed', description: (error as Error).message });
            }
        });
    }

    const handleSEOSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authUser) return;

        startTransition(async () => {
            try {
                const formData = new FormData();
                if (metaTitle) formData.append('metaTitle', metaTitle);
                if (metaDescription) formData.append('metaDescription', metaDescription);
                if (metaKeywords) formData.append('metaKeywords', metaKeywords);

                await updateStoreSettings(authUser.uid, formData);
                toast({
                    title: "SEO Settings Saved!",
                    description: "Your SEO settings have been updated successfully.",
                });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Update Failed', description: (error as Error).message });
            }
        });
    }

    // Handler for store images
    const handleImagesSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authUser) return;

        startTransition(async () => {
            try {
                const formData = new FormData();
                if (storeLogo && storeLogo.size > 0) {
                    formData.append('storeLogo', storeLogo);
                }
                if (storeBanner && storeBanner.size > 0) {
                    formData.append('storeBanner', storeBanner);
                }

                if (formData.has('storeLogo') || formData.has('storeBanner')) {
                    await updateStoreSettings(authUser.uid, formData);
                    toast({
                        title: "Images Saved!",
                        description: "Your store images have been updated successfully.",
                    });
                    // Clear file inputs after successful save
                    setStoreLogo(null);
                    setStoreBanner(null);
                } else {
                    toast({
                        variant: 'default',
                        title: "No Changes",
                        description: "Please select an image to upload.",
                    });
                }
            } catch (error) {
                console.error('Error saving images:', error);
                toast({ variant: 'destructive', title: 'Update Failed', description: (error as Error).message });
            }
        });
    };

    // Handler for location
    const handleLocationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authUser) return;

        startTransition(async () => {
            try {
                const formData = new FormData();
                if (selectedState && selectedState.trim()) formData.append('state', selectedState.trim());
                if (selectedLGA && selectedLGA.trim()) formData.append('lga', selectedLGA.trim());
                if (city && city.trim()) formData.append('city', city.trim());
                if (address !== undefined) formData.append('address', address?.trim() || '');

                if (formData.has('state') || formData.has('lga') || formData.has('city') || formData.has('address')) {
                    await updateStoreSettings(authUser.uid, formData);
                    toast({
                        title: "Location Saved!",
                        description: "Your store location has been updated successfully.",
                    });
                } else {
                    toast({
                        variant: 'default',
                        title: "No Changes",
                        description: "Please fill in at least one location field.",
                    });
                }
            } catch (error) {
                console.error('Error saving location:', error);
                toast({ variant: 'destructive', title: 'Update Failed', description: (error as Error).message });
            }
        });
    };

    // Handler for business category
    const handleBusinessTypeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authUser) return;

        startTransition(async () => {
            try {
                if (!businessType || !businessType.trim()) {
                    toast({
                        variant: 'default',
                        title: "No Selection",
                        description: "Please select a business category.",
                    });
                    return;
                }

                const formData = new FormData();
                formData.append('businessType', businessType.trim());

                await updateStoreSettings(authUser.uid, formData);
                toast({
                    title: "Category Saved!",
                    description: "Your business category has been updated successfully.",
                });
            } catch (error) {
                console.error('Error saving business type:', error);
                toast({ variant: 'destructive', title: 'Update Failed', description: (error as Error).message });
            }
        });
    };

    // Handler for store policies
    const handlePoliciesSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authUser) return;

        startTransition(async () => {
            try {
                const formData = new FormData();
                // Policies are optional, so we send them even if empty
                formData.append('shippingPolicy', shippingPolicy || '');
                formData.append('returnsPolicy', returnsPolicy || '');
                formData.append('refundsPolicy', refundsPolicy || '');
                formData.append('privacyPolicy', privacyPolicy || '');

                await updateStoreSettings(authUser.uid, formData);
                toast({
                    title: "Policies Saved!",
                    description: "Your store policies have been updated successfully.",
                });
            } catch (error) {
                console.error('Error saving policies:', error);
                toast({ variant: 'destructive', title: 'Update Failed', description: (error as Error).message });
            }
        });
    };

    const handleAddLocation = (e: React.FormEvent) => {
        e.preventDefault();
        if (!authUser || !newLocation.trim()) return;
        
        startTransition(async () => {
            try {
                await addDeliveryLocationAction(authUser.uid, newLocation);
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
                await deleteDeliveryLocationAction(authUser.uid, locationId);
                 toast({
                    title: "Location Removed",
                    description: `The location has been removed.`,
                });
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Failed to remove location', description: (error as Error).message });
            }
        });
    }

    return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 bg-background border-b">
        <div>
          <h1 className="text-2xl font-bold font-headline">Store Settings</h1>
          <p className="text-muted-foreground">Manage your store's profile, integrations, and delivery options.</p>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {(isLoadingStore || isLoadingProfile) ? (
          <>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-32" />
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
        {/* Store Profile - Basic Info */}
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
                    <Button type="submit" disabled={isPending}>{isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}</Button>
                </CardFooter>
            </Card>
        </form>

        {/* Store Images */}
        <form onSubmit={handleImagesSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Store Images</CardTitle>
                    <CardDescription>Upload your store logo and banner to make your store stand out.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Store Logo</Label>
                        <div className="flex items-center gap-4 mt-2">
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
                        <Label>Store Banner</Label>
                        <div className="space-y-2 mt-2">
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
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Images'}
                    </Button>
                </CardFooter>
            </Card>
        </form>

        {/* Location */}
        <form onSubmit={handleLocationSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Store Location</CardTitle>
                    <CardDescription>Tell customers where your store is located.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="state">State</Label>
                        <Select value={selectedState} onValueChange={(value) => {
                            setSelectedState(value);
                            setSelectedLGA('');
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
                        <Label htmlFor="lga">Local Government Area (LGA)</Label>
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
                        <Label htmlFor="city">City/Town</Label>
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
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Location'}
                    </Button>
                </CardFooter>
            </Card>
        </form>

        {/* Business Type */}
        <form onSubmit={handleBusinessTypeSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Business Category</CardTitle>
                    <CardDescription>What type of business do you run?</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select value={businessType} onValueChange={setBusinessType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select your business category" />
                        </SelectTrigger>
                        <SelectContent>
                            {BUSINESS_CATEGORIES.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {businessType && getCategoryById(businessType) && (
                        <p className="text-sm text-muted-foreground mt-2">
                            {getCategoryById(businessType)?.description}
                        </p>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Category'}
                    </Button>
                </CardFooter>
            </Card>
        </form>

        {/* Store Policies */}
        <form onSubmit={handlePoliciesSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Store Policies</CardTitle>
                    <CardDescription>Set up your store policies to build trust with customers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save All Store Settings'}
                    </Button>
                </CardFooter>
            </Card>
        </form>

        {/* WhatsApp Integration */}
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
                    <Button type="submit" disabled={isPending}>{isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save & Connect'}</Button>
                </CardFooter>
            </Card>
        </form>

        {/* Social Media Links */}
        <form onSubmit={handleSocialMediaSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Social Media Links</CardTitle>
                    <CardDescription>Add your social media profiles to help customers find and connect with you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="facebookUrl">Facebook URL</Label>
                        <Input 
                            id="facebookUrl" 
                            type="url" 
                            placeholder="https://facebook.com/yourpage" 
                            value={facebookUrl} 
                            onChange={(e) => setFacebookUrl(e.target.value)} 
                        />
                    </div>
                    <div>
                        <Label htmlFor="instagramUrl">Instagram URL</Label>
                        <Input 
                            id="instagramUrl" 
                            type="url" 
                            placeholder="https://instagram.com/yourhandle" 
                            value={instagramUrl} 
                            onChange={(e) => setInstagramUrl(e.target.value)} 
                        />
                    </div>
                    <div>
                        <Label htmlFor="twitterUrl">Twitter/X URL</Label>
                        <Input 
                            id="twitterUrl" 
                            type="url" 
                            placeholder="https://twitter.com/yourhandle" 
                            value={twitterUrl} 
                            onChange={(e) => setTwitterUrl(e.target.value)} 
                        />
                    </div>
                    <div>
                        <Label htmlFor="tiktokUrl">TikTok URL</Label>
                        <Input 
                            id="tiktokUrl" 
                            type="url" 
                            placeholder="https://tiktok.com/@yourhandle" 
                            value={tiktokUrl} 
                            onChange={(e) => setTiktokUrl(e.target.value)} 
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Links'}
                    </Button>
                </CardFooter>
            </Card>
        </form>

        {/* Store Hours */}
        <form onSubmit={handleStoreHoursSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Store Hours</CardTitle>
                    <CardDescription>Set your store operating hours to let customers know when you're available.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                        <div key={day} className="flex items-center gap-3">
                            <Label className="w-24 capitalize">{day}</Label>
                            <Input
                                placeholder="e.g., 9:00 AM - 6:00 PM or Closed"
                                value={storeHours[day as keyof typeof storeHours]}
                                onChange={(e) => setStoreHours(prev => ({ ...prev, [day]: e.target.value }))}
                            />
                        </div>
                    ))}
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Hours'}
                    </Button>
                </CardFooter>
            </Card>
        </form>

        {/* Contact Information */}
        <form onSubmit={handleContactInfoSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>Add additional contact information for your store.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input 
                            id="email" 
                            type="email" 
                            placeholder="store@example.com" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                        />
                    </div>
                    <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                            id="phone" 
                            type="tel" 
                            placeholder="+234..." 
                            value={phone} 
                            onChange={(e) => setPhone(e.target.value)} 
                        />
                    </div>
                    <div>
                        <Label htmlFor="website">Website</Label>
                        <Input 
                            id="website" 
                            type="url" 
                            placeholder="https://yourwebsite.com" 
                            value={website} 
                            onChange={(e) => setWebsite(e.target.value)} 
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Contact Info'}
                    </Button>
                </CardFooter>
            </Card>
        </form>

        {/* Store Theme */}
        <form onSubmit={handleThemeSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Store Theme</CardTitle>
                    <CardDescription>Customize your store's appearance with colors and fonts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="primaryColor">Primary Color</Label>
                            <div className="flex gap-2 mt-1">
                                <Input 
                                    id="primaryColor" 
                                    type="color" 
                                    value={primaryColor || '#000000'} 
                                    onChange={(e) => setPrimaryColor(e.target.value)} 
                                    className="w-20 h-10"
                                />
                                <Input 
                                    type="text" 
                                    placeholder="#000000" 
                                    value={primaryColor} 
                                    onChange={(e) => setPrimaryColor(e.target.value)} 
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="secondaryColor">Secondary Color</Label>
                            <div className="flex gap-2 mt-1">
                                <Input 
                                    id="secondaryColor" 
                                    type="color" 
                                    value={secondaryColor || '#666666'} 
                                    onChange={(e) => setSecondaryColor(e.target.value)} 
                                    className="w-20 h-10"
                                />
                                <Input 
                                    type="text" 
                                    placeholder="#666666" 
                                    value={secondaryColor} 
                                    onChange={(e) => setSecondaryColor(e.target.value)} 
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="fontFamily">Font Family</Label>
                        <Select value={fontFamily} onValueChange={setFontFamily}>
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select font" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Inter">Inter</SelectItem>
                                <SelectItem value="Roboto">Roboto</SelectItem>
                                <SelectItem value="Open Sans">Open Sans</SelectItem>
                                <SelectItem value="Poppins">Poppins</SelectItem>
                                <SelectItem value="Montserrat">Montserrat</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Theme'}
                    </Button>
                </CardFooter>
            </Card>
        </form>

        {/* SEO Settings */}
        <form onSubmit={handleSEOSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>SEO Settings</CardTitle>
                    <CardDescription>Optimize your store for search engines with meta tags and descriptions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="metaTitle">Meta Title</Label>
                        <Input 
                            id="metaTitle" 
                            placeholder="Your Store - Best Products Online" 
                            value={metaTitle} 
                            onChange={(e) => setMetaTitle(e.target.value)} 
                            maxLength={60}
                        />
                        <p className="text-xs text-muted-foreground mt-1">{metaTitle.length}/60 characters</p>
                    </div>
                    <div>
                        <Label htmlFor="metaDescription">Meta Description</Label>
                        <Textarea 
                            id="metaDescription" 
                            placeholder="Describe your store and what makes it unique..." 
                            value={metaDescription} 
                            onChange={(e) => setMetaDescription(e.target.value)} 
                            rows={3}
                            maxLength={160}
                        />
                        <p className="text-xs text-muted-foreground mt-1">{metaDescription.length}/160 characters</p>
                    </div>
                    <div>
                        <Label htmlFor="metaKeywords">Meta Keywords</Label>
                        <Input 
                            id="metaKeywords" 
                            placeholder="product, store, online, shopping" 
                            value={metaKeywords} 
                            onChange={(e) => setMetaKeywords(e.target.value)} 
                        />
                        <p className="text-xs text-muted-foreground mt-1">Separate keywords with commas</p>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save SEO Settings'}
                    </Button>
                </CardFooter>
            </Card>
        </form>

        {/* Delivery Locations */}
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
                     {(!userProfile?.deliveryLocations || userProfile.deliveryLocations.length === 0) && (
                        <p className="text-sm text-center text-muted-foreground py-4">You haven't added any delivery locations yet.</p>
                     )}
                </ul>
                <form onSubmit={handleAddLocation} className="flex gap-2 pt-4 border-t">
                    <Input placeholder="Enter new bus stop or location" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} />
                    <Button type="submit" disabled={isPending}>{isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</> : 'Add Location'}</Button>
                </form>
            </CardContent>
        </Card>
          </>
        )}
      </main>
    </div>
    )
}
