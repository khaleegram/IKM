'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { ProductDeliveryMethods } from '@/lib/firebase/firestore/products';

interface SimpleDeliverySettingsProps {
  deliveryFeePaidBy?: 'seller' | 'buyer';
  deliveryMethods?: ProductDeliveryMethods;
  hasShippingZones: boolean;
  onDeliveryFeePaidByChange: (value: 'seller' | 'buyer') => void;
  onDeliveryMethodsChange: (methods: ProductDeliveryMethods) => void;
}

export function SimpleDeliverySettings({
  deliveryFeePaidBy = 'buyer',
  deliveryMethods,
  hasShippingZones,
  onDeliveryFeePaidByChange,
  onDeliveryMethodsChange,
}: SimpleDeliverySettingsProps) {
  const updateDeliveryMethod = (key: keyof ProductDeliveryMethods, value: any) => {
    onDeliveryMethodsChange({
      ...deliveryMethods,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Delivery Fee Payment</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Who will pay for delivery fees?
        </p>
        <RadioGroup
          value={deliveryFeePaidBy}
          onValueChange={(value) => onDeliveryFeePaidByChange(value as 'seller' | 'buyer')}
        >
          <div className="flex items-center space-x-2 p-3 border rounded-lg">
            <RadioGroupItem value="seller" id="seller-pays" />
            <Label htmlFor="seller-pays" className="cursor-pointer flex-1">
              <div className="font-medium">Seller Pays</div>
              <div className="text-xs text-muted-foreground">
                You handle delivery costs. No fees charged on checkout.
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-3 border rounded-lg">
            <RadioGroupItem value="buyer" id="buyer-pays" />
            <Label htmlFor="buyer-pays" className="cursor-pointer flex-1">
              <div className="font-medium">Buyer Pays</div>
              <div className="text-xs text-muted-foreground">
                Delivery fees added to checkout and charged via Paystack.
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <Separator />

      <div>
        <Label className="text-base font-semibold">Available Delivery Methods</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Select which delivery methods you offer for this product
        </p>

        {/* Within City (Local) */}
        <Card className="mb-3">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="local-dispatch"
                checked={deliveryMethods?.localDispatch?.enabled || false}
                onCheckedChange={(checked) => {
                  updateDeliveryMethod('localDispatch', {
                    enabled: checked,
                  });
                }}
              />
              <Label htmlFor="local-dispatch" className="font-medium cursor-pointer flex-1">
                Within City (Local Delivery)
              </Label>
            </div>
          </CardHeader>
          {deliveryMethods?.localDispatch?.enabled && (
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                No price input required. Seller handles delivery directly. No fees charged on checkout.
              </p>
            </CardContent>
          )}
        </Card>

        {/* Waybill (Inter-state) */}
        <Card className="mb-3">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="waybill"
                checked={deliveryMethods?.waybill?.enabled || false}
                onCheckedChange={(checked) => {
                  updateDeliveryMethod('waybill', {
                    enabled: checked,
                  });
                }}
              />
              <Label htmlFor="waybill" className="font-medium cursor-pointer flex-1">
                Waybill (Inter-state)
              </Label>
            </div>
          </CardHeader>
          {deliveryMethods?.waybill?.enabled && (
            <CardContent className="pt-0 space-y-3">
              {hasShippingZones ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <span>✓</span>
                  <span>Using your shipping zones</span>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>Please set up shipping zones first</span>
                    <Link href="/seller/shipping">
                      <Button variant="outline" size="sm">
                        Go to Shipping Settings
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          )}
        </Card>

        {/* Customer Pickup */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pickup"
                checked={deliveryMethods?.pickup?.enabled || false}
                onCheckedChange={(checked) => {
                  updateDeliveryMethod('pickup', {
                    enabled: checked,
                    location: checked ? 'my-shop' : undefined,
                  });
                }}
              />
              <Label htmlFor="pickup" className="font-medium cursor-pointer flex-1">
                Customer Pickup
              </Label>
            </div>
          </CardHeader>
          {deliveryMethods?.pickup?.enabled && (
            <CardContent className="pt-0 space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">Pickup Location (Optional)</Label>
                <Input
                  type="text"
                  placeholder="e.g., Near Sahad Stores"
                  value={deliveryMethods.pickup?.landmark || ''}
                  onChange={(e) => {
                    updateDeliveryMethod('pickup', {
                      ...deliveryMethods.pickup,
                      landmark: e.target.value,
                    });
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use your shop address from store settings
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

