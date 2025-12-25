'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { NIGERIAN_STATES, getLGAsForState } from "@/lib/data/nigerian-locations";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useStoreByUserId } from "@/lib/firebase/firestore/stores";
import {
  createShippingZone,
  deleteShippingZone,
  getShippingSettings,
  getShippingZones,
  updateShippingSettings,
  updateShippingZone,
  type ShippingZone
} from "@/lib/shipping-actions";
import { updateStoreSettings } from "@/lib/store-actions";
import { Edit, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from 'react';

export default function ShippingPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [isLoadingZones, setIsLoadingZones] = useState(true);
  
  // Form state for adding/editing zone
  const [zoneName, setZoneName] = useState('');
  const [zoneRate, setZoneRate] = useState('');
  const [zoneFreeThreshold, setZoneFreeThreshold] = useState('');
  const [zoneStates, setZoneStates] = useState<string[]>([]);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [showZoneDialog, setShowZoneDialog] = useState(false);
  
  // Packaging settings
  const [defaultPackagingType, setDefaultPackagingType] = useState('Standard Box');
  const [packagingCost, setPackagingCost] = useState('');
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Pickup address settings
  const { data: store, isLoading: isLoadingStore } = useStoreByUserId(user?.uid);
  const [pickupState, setPickupState] = useState('');
  const [pickupLGA, setPickupLGA] = useState('');
  const [pickupStreet, setPickupStreet] = useState('');
  const [isLoadingPickup, setIsLoadingPickup] = useState(true);

  // Load shipping zones
  useEffect(() => {
    const loadZones = async () => {
      if (!user?.uid) return;
      try {
        setIsLoadingZones(true);
        const data = await getShippingZones(user.uid);
        setZones(data);
      } catch (error) {
        console.error('Failed to load shipping zones:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load shipping zones',
        });
      } finally {
        setIsLoadingZones(false);
      }
    };
    loadZones();
  }, [user?.uid, toast]);

  // Load shipping settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.uid) return;
      try {
        setIsLoadingSettings(true);
        const settings = await getShippingSettings(user.uid);
        setDefaultPackagingType(settings.defaultPackagingType || 'Standard Box');
        setPackagingCost(settings.packagingCost?.toString() || '');
      } catch (error) {
        console.error('Failed to load shipping settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    loadSettings();
  }, [user?.uid]);

  // Load pickup address
  useEffect(() => {
    if (store) {
      setIsLoadingPickup(true);
      // Check if pickupAddress is an object (new format) or string (old format)
      if (store.pickupAddress) {
        if (typeof store.pickupAddress === 'object' && store.pickupAddress !== null && !Array.isArray(store.pickupAddress)) {
          // New format: { state, lga, street }
          const addr = store.pickupAddress as { state?: string; lga?: string; street?: string };
          setPickupState(addr.state || '');
          setPickupLGA(addr.lga || '');
          setPickupStreet(addr.street || '');
        } else if (typeof store.pickupAddress === 'string') {
          // Old format: just a string - try to extract from storeLocation if available
          if (store.storeLocation) {
            setPickupState(store.storeLocation.state || '');
            setPickupLGA(store.storeLocation.lga || '');
            setPickupStreet(store.storeLocation.address || store.pickupAddress || '');
          } else {
            setPickupStreet(store.pickupAddress);
          }
        }
      } else if (store.storeLocation) {
        // Fallback to storeLocation
        setPickupState(store.storeLocation.state || '');
        setPickupLGA(store.storeLocation.lga || '');
        setPickupStreet(store.storeLocation.address || '');
      }
      setIsLoadingPickup(false);
    }
  }, [store]);

  const handleAddZone = () => {
    setEditingZone(null);
    setZoneName('');
    setZoneRate('');
    setZoneFreeThreshold('');
    setZoneStates([]);
    setShowZoneDialog(true);
  };

  const handleEditZone = (zone: ShippingZone) => {
    setEditingZone(zone);
    setZoneName(zone.name);
    setZoneRate(zone.rate.toString());
    setZoneFreeThreshold(zone.freeThreshold?.toString() || '');
    setZoneStates(zone.states || []);
    setShowZoneDialog(true);
  };

  const handleSaveZone = async () => {
    if (!user?.uid) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not authenticated' });
      return;
    }

    if (!zoneName.trim() || !zoneRate.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill in zone name and rate' });
      return;
    }

    startTransition(async () => {
      try {
        if (editingZone) {
          await updateShippingZone(user.uid, editingZone.id!, {
            name: zoneName.trim(),
            rate: parseFloat(zoneRate),
            freeThreshold: zoneFreeThreshold ? parseFloat(zoneFreeThreshold) : undefined,
            states: zoneStates.length > 0 ? zoneStates : undefined,
          });
          toast({ title: 'Success', description: 'Shipping zone updated successfully!' });
        } else {
          await createShippingZone(user.uid, {
            name: zoneName.trim(),
            rate: parseFloat(zoneRate),
            freeThreshold: zoneFreeThreshold ? parseFloat(zoneFreeThreshold) : undefined,
            states: zoneStates.length > 0 ? zoneStates : undefined,
          });
          toast({ title: 'Success', description: 'Shipping zone created successfully!' });
        }
        
        // Reload zones
        const updatedZones = await getShippingZones(user.uid);
        setZones(updatedZones);
        setShowZoneDialog(false);
        setEditingZone(null);
        setZoneName('');
        setZoneRate('');
        setZoneFreeThreshold('');
        setZoneStates([]);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to save shipping zone',
        });
      }
    });
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!user?.uid) return;
    
    if (!confirm('Are you sure you want to delete this shipping zone?')) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteShippingZone(user.uid, zoneId);
        toast({ title: 'Success', description: 'Shipping zone deleted successfully!' });
        
        // Reload zones
        const updatedZones = await getShippingZones(user.uid);
        setZones(updatedZones);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to delete shipping zone',
        });
      }
    });
  };

  const handleSavePackagingSettings = async () => {
    if (!user?.uid) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not authenticated' });
      return;
    }

    startTransition(async () => {
      try {
        await updateShippingSettings(user.uid, {
          defaultPackagingType,
          packagingCost: packagingCost ? parseFloat(packagingCost) : undefined,
        });
        toast({ title: 'Success', description: 'Packaging settings saved successfully!' });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to save settings',
        });
      }
    });
  };

  const handleSavePickupAddress = async () => {
    if (!user?.uid) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not authenticated' });
      return;
    }

    if (!pickupState || !pickupLGA || !pickupStreet.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill in state, LGA, and street address' });
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        // Save pickup address as JSON string (will be parsed in store-actions)
        formData.append('pickupAddress', JSON.stringify({
          state: pickupState,
          lga: pickupLGA,
          street: pickupStreet.trim(),
        }));
        
        await updateStoreSettings(user.uid, formData);
        toast({ title: 'Success', description: 'Pickup address saved successfully!' });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to save pickup address',
        });
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Shipping</h1>
          <p className="text-muted-foreground">Configure shipping rates, zones, and carrier integrations</p>
        </div>
      </div>

      <Tabs defaultValue="zones" className="space-y-4">
        <TabsList>
          <TabsTrigger value="zones">Shipping Zones</TabsTrigger>
          <TabsTrigger value="pickup">Pickup Address</TabsTrigger>
          <TabsTrigger value="carriers">Carriers</TabsTrigger>
          <TabsTrigger value="packaging">Packaging</TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Shipping Zones</CardTitle>
                <CardDescription>Set shipping rates by location</CardDescription>
              </div>
              <Dialog open={showZoneDialog} onOpenChange={setShowZoneDialog}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddZone}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Zone
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingZone ? 'Edit' : 'Add'} Shipping Zone</DialogTitle>
                    <DialogDescription>
                      {editingZone ? 'Update' : 'Create'} a new shipping zone with rates
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Zone Name</Label>
                      <Input 
                        placeholder="Lagos" 
                        value={zoneName}
                        onChange={(e) => setZoneName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Shipping Rate (₦)</Label>
                      <Input 
                        type="number" 
                        placeholder="2000" 
                        value={zoneRate}
                        onChange={(e) => setZoneRate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Free Shipping Threshold (₦) - Optional</Label>
                      <Input 
                        type="number" 
                        placeholder="10000" 
                        value={zoneFreeThreshold}
                        onChange={(e) => setZoneFreeThreshold(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleSaveZone}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        editingZone ? 'Update Zone' : 'Add Zone'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoadingZones ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : zones.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No shipping zones configured. Click "Add Zone" to create one.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zone Name</TableHead>
                      <TableHead>States</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Free Threshold</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zones.map((zone) => (
                      <TableRow key={zone.id}>
                        <TableCell className="font-medium">{zone.name}</TableCell>
                        <TableCell>
                          {zone.states && zone.states.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {zone.states.map((state) => (
                                <Badge key={state} variant="outline" className="text-xs">
                                  {state}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">All states</span>
                          )}
                        </TableCell>
                        <TableCell>₦{zone.rate.toLocaleString()}</TableCell>
                        <TableCell>
                          {zone.freeThreshold ? `₦${zone.freeThreshold.toLocaleString()}` : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditZone(zone)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteZone(zone.id!)}
                              disabled={isPending}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pickup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Store Pickup Address</CardTitle>
              <CardDescription>
                Set your store pickup location. This address will be shown to customers as a pickup option on checkout.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingPickup ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="pickupState">State *</Label>
                    <Select value={pickupState} onValueChange={(value) => {
                      setPickupState(value);
                      setPickupLGA(''); // Reset LGA when state changes
                    }}>
                      <SelectTrigger id="pickupState">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {NIGERIAN_STATES.map((state) => (
                          <SelectItem key={state.name} value={state.name}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {pickupState && (
                    <div className="space-y-2">
                      <Label htmlFor="pickupLGA">Local Government Area (LGA) *</Label>
                      <Select value={pickupLGA} onValueChange={setPickupLGA} disabled={!pickupState}>
                        <SelectTrigger id="pickupLGA">
                          <SelectValue placeholder="Select LGA" />
                        </SelectTrigger>
                        <SelectContent>
                          {getLGAsForState(pickupState).map((lga) => (
                            <SelectItem key={lga} value={lga}>
                              {lga}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="pickupStreet">Street Address *</Label>
                    <Input
                      id="pickupStreet"
                      placeholder="e.g., 123 Main Street, Area Name"
                      value={pickupStreet}
                      onChange={(e) => setPickupStreet(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter the street address and area where customers can pick up their orders
                    </p>
                  </div>

                  <Button 
                    onClick={handleSavePickupAddress}
                    disabled={isPending || !pickupState || !pickupLGA || !pickupStreet.trim()}
                    className="w-full sm:w-auto"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Pickup Address'
                    )}
                  </Button>

                  {pickupState && pickupLGA && pickupStreet && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Preview:</p>
                      <p className="text-sm text-muted-foreground">
                        {pickupStreet}, {pickupLGA}, {pickupState} State
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carriers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Carrier Integrations</CardTitle>
              <CardDescription>Connect with shipping carriers for automatic tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Carrier integrations coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packaging" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Packaging Options</CardTitle>
              <CardDescription>Configure packaging types and costs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingSettings ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Default Packaging Type</Label>
                    <select 
                      className="w-full p-2 border rounded"
                      value={defaultPackagingType}
                      onChange={(e) => setDefaultPackagingType(e.target.value)}
                    >
                      <option value="Standard Box">Standard Box</option>
                      <option value="Envelope">Envelope</option>
                      <option value="Bubble Mailer">Bubble Mailer</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Packaging Cost (₦) - Optional</Label>
                    <Input 
                      type="number" 
                      placeholder="500" 
                      value={packagingCost}
                      onChange={(e) => setPackagingCost(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleSavePackagingSettings}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Settings'
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
