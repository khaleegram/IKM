'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Eye, Save, Loader2 } from "lucide-react";
import { useStoreByUserId } from "@/lib/firebase/firestore/stores";
import { useUser } from "@/lib/firebase/auth/use-user";
import { updateStorefrontSettings } from "@/lib/storefront-actions";
import { useToast } from "@/hooks/use-toast";

export default function StorefrontPage() {
  const { user } = useUser();
  const { data: store } = useStoreByUserId(user?.uid);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [secondaryColor, setSecondaryColor] = useState('#666666');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [layout, setLayout] = useState<'grid' | 'list' | 'masonry'>('grid');

  // Update state when store data loads
  useEffect(() => {
    if (store) {
      setPrimaryColor(store.primaryColor || '#000000');
      setSecondaryColor(store.secondaryColor || '#666666');
      setFontFamily(store.fontFamily || 'Inter');
      setLayout((store.storeLayout || store.layout || 'grid') as 'grid' | 'list' | 'masonry');
    }
  }, [store]);

  const handleSave = () => {
    if (!user?.uid) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not authenticated' });
      return;
    }

    startTransition(async () => {
      try {
        await updateStorefrontSettings(user.uid, {
          primaryColor,
          secondaryColor,
          fontFamily,
          storeLayout: layout,
        });
        toast({ title: 'Success', description: 'Storefront settings saved successfully! Your store will update shortly.' });
      } catch (error) {
        toast({ 
          variant: 'destructive', 
          title: 'Error', 
          description: error instanceof Error ? error.message : 'Failed to save settings' 
        });
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Storefront Designer</h1>
          <p className="text-muted-foreground">Customize your store's appearance and branding</p>
        </div>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Design Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Design Settings</CardTitle>
            <CardDescription>Customize colors and typography</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#000000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Secondary Color</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#666666"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Font Family</Label>
              <select
                className="w-full p-2 border rounded"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Poppins">Poppins</option>
                <option value="Montserrat">Montserrat</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Live Preview
            </CardTitle>
            <CardDescription>See how your store looks</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border rounded-lg p-6 space-y-4"
              style={{
                backgroundColor: '#ffffff',
                color: primaryColor,
                fontFamily: fontFamily,
              }}
            >
              <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                {store?.storeName || 'Your Store Name'}
              </div>
              <div className="text-sm" style={{ color: secondaryColor }}>
                {store?.storeDescription || 'Your store description'}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="border rounded p-4">
                  <div className="h-32 bg-gray-200 rounded mb-2"></div>
                  <div className="text-sm font-medium">Product Name</div>
                  <div className="text-sm font-bold" style={{ color: primaryColor }}>
                    ₦5,000
                  </div>
                </div>
                <div className="border rounded p-4">
                  <div className="h-32 bg-gray-200 rounded mb-2"></div>
                  <div className="text-sm font-medium">Product Name</div>
                  <div className="text-sm font-bold" style={{ color: primaryColor }}>
                    ₦5,000
                  </div>
                </div>
              </div>
              <Button
                className="w-full"
                style={{
                  backgroundColor: primaryColor,
                  color: '#ffffff',
                }}
              >
                Add to Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Layout Options */}
      <Card>
        <CardHeader>
          <CardTitle>Layout Options</CardTitle>
          <CardDescription>Choose your store layout</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                layout === 'grid' ? 'border-primary bg-primary/5' : 'hover:border-primary'
              }`}
              onClick={() => setLayout('grid')}
            >
              <div className="h-32 bg-gray-100 rounded mb-2"></div>
              <div className="font-medium">Grid Layout</div>
              <div className="text-sm text-muted-foreground">Products in a grid</div>
            </div>
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                layout === 'list' ? 'border-primary bg-primary/5' : 'hover:border-primary'
              }`}
              onClick={() => setLayout('list')}
            >
              <div className="h-32 bg-gray-100 rounded mb-2"></div>
              <div className="font-medium">List Layout</div>
              <div className="text-sm text-muted-foreground">Products in a list</div>
            </div>
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                layout === 'masonry' ? 'border-primary bg-primary/5' : 'hover:border-primary'
              }`}
              onClick={() => setLayout('masonry')}
            >
              <div className="h-32 bg-gray-100 rounded mb-2"></div>
              <div className="font-medium">Masonry Layout</div>
              <div className="text-sm text-muted-foreground">Pinterest-style</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

