'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, DollarSign, Percent, Coins, Settings as SettingsIcon } from 'lucide-react';
import { getPlatformSettings, updatePlatformSettings } from '@/lib/platform-settings-actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  
  const [settings, setSettings] = useState({
    platformCommissionRate: 0.05,
    minimumPayoutAmount: 1000,
    platformFee: 0,
    currency: 'NGN',
  });
  
  const [originalSettings, setOriginalSettings] = useState(settings);

  useEffect(() => {
    startTransition(async () => {
      try {
        const data = await getPlatformSettings();
        setSettings({
          platformCommissionRate: data.platformCommissionRate || 0.05,
          minimumPayoutAmount: data.minimumPayoutAmount || 1000,
          platformFee: data.platformFee || 0,
          currency: data.currency || 'NGN',
        });
        setOriginalSettings({
          platformCommissionRate: data.platformCommissionRate || 0.05,
          minimumPayoutAmount: data.minimumPayoutAmount || 1000,
          platformFee: data.platformFee || 0,
          currency: data.currency || 'NGN',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: (error as Error).message,
        });
      } finally {
        setIsLoading(false);
      }
    });
  }, [toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate commission rate (0-100%)
    if (settings.platformCommissionRate < 0 || settings.platformCommissionRate > 1) {
      toast({
        variant: 'destructive',
        title: 'Invalid Commission Rate',
        description: 'Commission rate must be between 0% and 100% (0 to 1).',
      });
      return;
    }
    
    // Validate minimum payout
    if (settings.minimumPayoutAmount < 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Minimum Payout',
        description: 'Minimum payout amount must be 0 or greater.',
      });
      return;
    }

    startTransition(async () => {
      try {
        await updatePlatformSettings(settings);
        setOriginalSettings(settings);
        toast({
          title: 'Settings Updated',
          description: 'Platform settings have been successfully updated.',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: (error as Error).message,
        });
      }
    });
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-headline flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8" />
          Platform Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage platform revenue, commission rates, and payout settings
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          Changes to commission rates will only affect new orders. Existing orders will use the commission rate that was active when they were created.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 sm:space-y-6">
          {/* Commission Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Commission Rate
              </CardTitle>
              <CardDescription>
                The percentage of each order that goes to the platform as commission
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="commissionRate">
                  Commission Rate (as decimal, e.g., 0.05 for 5%)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="commissionRate"
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    value={settings.platformCommissionRate}
                    onChange={(e) => setSettings({
                      ...settings,
                      platformCommissionRate: parseFloat(e.target.value) || 0,
                    })}
                    className="flex-1"
                    required
                  />
                  <span className="text-muted-foreground whitespace-nowrap">
                    ({((settings.platformCommissionRate || 0) * 100).toFixed(2)}%)
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Current: {(settings.platformCommissionRate * 100).toFixed(2)}% commission on all orders
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Minimum Payout */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Minimum Payout Amount
              </CardTitle>
              <CardDescription>
                The minimum amount sellers must accumulate before requesting a payout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="minimumPayout">Minimum Payout Amount (₦)</Label>
                <Input
                  id="minimumPayout"
                  type="number"
                  min="0"
                  step="100"
                  value={settings.minimumPayoutAmount}
                  onChange={(e) => setSettings({
                    ...settings,
                    minimumPayoutAmount: parseFloat(e.target.value) || 0,
                  })}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Sellers must have at least ₦{settings.minimumPayoutAmount.toLocaleString()} in available balance to request a payout
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Platform Fee (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Platform Fee (Optional)
              </CardTitle>
              <CardDescription>
                An additional flat fee charged per transaction (separate from commission)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platformFee">Platform Fee (₦)</Label>
                <Input
                  id="platformFee"
                  type="number"
                  min="0"
                  step="10"
                  value={settings.platformFee}
                  onChange={(e) => setSettings({
                    ...settings,
                    platformFee: parseFloat(e.target.value) || 0,
                  })}
                />
                <p className="text-sm text-muted-foreground">
                  {settings.platformFee > 0 
                    ? `A flat fee of ₦${settings.platformFee.toLocaleString()} will be charged per transaction`
                    : 'No additional platform fee is currently set'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Currency */}
          <Card>
            <CardHeader>
              <CardTitle>Currency</CardTitle>
              <CardDescription>
                The default currency for the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency Code</Label>
                <Input
                  id="currency"
                  type="text"
                  value={settings.currency}
                  onChange={(e) => setSettings({
                    ...settings,
                    currency: e.target.value.toUpperCase(),
                  })}
                  maxLength={3}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  ISO 4217 currency code (e.g., NGN for Nigerian Naira)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSettings(originalSettings)}
              disabled={!hasChanges || isPending}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={!hasChanges || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

