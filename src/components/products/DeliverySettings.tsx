'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NORTHERN_PARKS } from '@/lib/data/northern-parks';
import { cn } from '@/lib/utils';
import type { ProductDeliveryMethods } from '@/lib/firebase/firestore/products';

interface DeliverySettingsProps {
  deliveryMethods?: ProductDeliveryMethods;
  onDeliveryMethodsChange: (methods: ProductDeliveryMethods) => void;
}

export function DeliverySettings({
  deliveryMethods,
  onDeliveryMethodsChange,
}: DeliverySettingsProps) {
  const updateDeliveryMethod = (key: keyof ProductDeliveryMethods, value: any) => {
    onDeliveryMethodsChange({
      ...deliveryMethods,
      [key]: value,
    });
  };

  const activeParks = NORTHERN_PARKS.filter(p => p.isActive);
  const parksByCity = {
    Kano: activeParks.filter(p => p.city === 'Kano'),
    Kaduna: activeParks.filter(p => p.city === 'Kaduna'),
    Abuja: activeParks.filter(p => p.city === 'Abuja'),
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Delivery Settings</div>
      
      {/* Local Dispatch */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="local-dispatch"
              checked={deliveryMethods?.localDispatch?.enabled || false}
              onCheckedChange={(checked) => {
                updateDeliveryMethod('localDispatch', {
                  ...deliveryMethods?.localDispatch,
                  enabled: checked,
                });
              }}
            />
            <Label htmlFor="local-dispatch" className="font-medium cursor-pointer">
              Local Dispatch (Within City)
            </Label>
          </div>
        </CardHeader>
        {deliveryMethods?.localDispatch?.enabled && (
          <CardContent className="space-y-3 pt-0">
            <div className="space-y-2">
              <Label>Method</Label>
              <Select
                value={deliveryMethods.localDispatch.method || ''}
                onValueChange={(value: "keke" | "bike" | "personal") => {
                  updateDeliveryMethod('localDispatch', {
                    ...deliveryMethods.localDispatch,
                    method: value,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select delivery method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keke">Keke Napep</SelectItem>
                  <SelectItem value="bike">Bike/Rider</SelectItem>
                  <SelectItem value="personal">Personal Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Price</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="₦0"
                  value={deliveryMethods.localDispatch.price || ''}
                  onChange={(e) => {
                    updateDeliveryMethod('localDispatch', {
                      ...deliveryMethods.localDispatch,
                      price: parseFloat(e.target.value) || undefined,
                    });
                  }}
                  disabled={deliveryMethods.localDispatch.negotiable}
                />
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="negotiable"
                    checked={deliveryMethods.localDispatch.negotiable || false}
                    onCheckedChange={(checked) => {
                      updateDeliveryMethod('localDispatch', {
                        ...deliveryMethods.localDispatch,
                        negotiable: checked,
                        price: checked ? undefined : deliveryMethods.localDispatch?.price,
                      });
                    }}
                  />
                  <Label htmlFor="negotiable" className="text-sm cursor-pointer">
                    Negotiable
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Waybill */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="waybill"
              checked={deliveryMethods?.waybill?.enabled || false}
              onCheckedChange={(checked) => {
                updateDeliveryMethod('waybill', {
                  ...deliveryMethods?.waybill,
                  enabled: checked,
                  parks: checked ? [] : undefined,
                });
              }}
            />
            <Label htmlFor="waybill" className="font-medium cursor-pointer">
              Waybill (Inter-state / To Park)
            </Label>
          </div>
        </CardHeader>
        {deliveryMethods?.waybill?.enabled && (
          <CardContent className="space-y-3 pt-0">
            <div className="space-y-2">
              <Label>Select Parks</Label>
              <div className="space-y-3">
                {Object.entries(parksByCity).map(([city, parks]) => (
                  <div key={city} className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">{city}</div>
                    <div className="flex flex-wrap gap-2">
                      {parks.map((park) => (
                        <Button
                          key={park.id}
                          type="button"
                          variant={
                            deliveryMethods.waybill?.parks?.includes(park.id)
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() => {
                            const currentParks = deliveryMethods.waybill?.parks || [];
                            const newParks = currentParks.includes(park.id)
                              ? currentParks.filter(p => p !== park.id)
                              : [...currentParks, park.id];
                            updateDeliveryMethod('waybill', {
                              ...deliveryMethods.waybill,
                              parks: newParks,
                            });
                          }}
                          className={cn(
                            deliveryMethods.waybill?.parks?.includes(park.id) &&
                              "bg-primary text-primary-foreground"
                          )}
                        >
                          {park.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fee Paid By</Label>
              <Select
                value={deliveryMethods.waybill?.feePaidBy || 'seller'}
                onValueChange={(value: "seller" | "buyer") => {
                  updateDeliveryMethod('waybill', {
                    ...deliveryMethods.waybill,
                    feePaidBy: value,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="buyer">Buyer at Park</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  ...deliveryMethods?.pickup,
                  enabled: checked,
                  location: checked ? 'my-shop' : undefined,
                });
              }}
            />
            <Label htmlFor="pickup" className="font-medium cursor-pointer">
              Customer Pickup
            </Label>
          </div>
        </CardHeader>
        {deliveryMethods?.pickup?.enabled && (
          <CardContent className="space-y-3 pt-0">
            <div className="space-y-2">
              <Label>Location</Label>
              <RadioGroup
                value={deliveryMethods.pickup?.location || 'my-shop'}
                onValueChange={(value) => {
                  updateDeliveryMethod('pickup', {
                    ...deliveryMethods.pickup,
                    location: value,
                    landmark: value === 'landmark' ? deliveryMethods.pickup?.landmark : undefined,
                  });
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="my-shop" id="my-shop" />
                  <Label htmlFor="my-shop" className="cursor-pointer">My Shop</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="landmark" id="landmark" />
                  <Label htmlFor="landmark" className="cursor-pointer">Popular Landmark</Label>
                </div>
              </RadioGroup>
            </div>
            {deliveryMethods.pickup?.location === 'landmark' && (
              <div className="space-y-2">
                <Label>Landmark</Label>
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
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

