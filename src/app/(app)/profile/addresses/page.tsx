'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plus, Edit, Trash2, Loader2, CheckCircle } from "lucide-react";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useUserAddresses } from "@/lib/firebase/firestore/addresses";
import { addAddress, updateAddress, deleteAddress, setDefaultAddress } from "@/lib/address-actions";
import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export default function AddressesPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const { data: addresses, isLoading } = useUserAddresses(user?.uid);
  const [isAdding, startAddTransition] = useTransition();
  const [isUpdating, startUpdateTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isSettingDefault, startSetDefaultTransition] = useTransition();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [deletingAddress, setDeletingAddress] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    label: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    lga: '',
    isDefault: false,
  });

  const handleAddAddress = () => {
    if (!user?.uid) return;

    startAddTransition(async () => {
      try {
        const formDataObj = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          formDataObj.append(key, value.toString());
        });

        await addAddress(user.uid, formDataObj);
        toast({
          title: "Address Added!",
          description: "Your address has been saved successfully.",
        });
        setShowAddDialog(false);
        resetForm();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      }
    });
  };

  const handleUpdateAddress = () => {
    if (!user?.uid || !editingAddress) return;

    startUpdateTransition(async () => {
      try {
        const formDataObj = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          formDataObj.append(key, value.toString());
        });

        await updateAddress(editingAddress.id, user.uid, formDataObj);
        toast({
          title: "Address Updated!",
          description: "Your address has been updated successfully.",
        });
        setEditingAddress(null);
        resetForm();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      }
    });
  };

  const handleDeleteAddress = (addressId: string) => {
    if (!user?.uid) return;

    startDeleteTransition(async () => {
      try {
        await deleteAddress(addressId, user.uid);
        toast({
          title: "Address Deleted",
          description: "Your address has been removed.",
        });
        setDeletingAddress(null);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      }
    });
  };

  const handleSetDefault = (addressId: string) => {
    if (!user?.uid) return;

    startSetDefaultTransition(async () => {
      try {
        await setDefaultAddress(addressId, user.uid);
        toast({
          title: "Default Address Updated",
          description: "Your default address has been changed.",
        });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      }
    });
  };

  const resetForm = () => {
    setFormData({
      label: '',
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      lga: '',
      isDefault: false,
    });
  };

  const startEdit = (address: any) => {
    setEditingAddress(address);
    setFormData({
      label: address.label || '',
      firstName: address.firstName || '',
      lastName: address.lastName || '',
      phone: address.phone || '',
      address: address.address || '',
      city: address.city || '',
      state: address.state || '',
      lga: address.lga || '',
      isDefault: address.isDefault || false,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
      <header className="mb-4 sm:mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline">My Addresses</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your delivery addresses for faster checkout.
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Address
        </Button>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-semibold mb-2">No addresses saved</p>
            <p className="text-muted-foreground mb-4">Add an address to speed up your checkout process.</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <Card key={address.id} className={address.isDefault ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {address.label}
                  </CardTitle>
                  {address.isDefault && (
                    <Badge variant="default">Default</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold">{address.firstName} {address.lastName}</p>
                  <p className="text-sm text-muted-foreground">{address.phone}</p>
                </div>
                <div className="text-sm">
                  <p>{address.address}</p>
                  <p>{address.city}, {address.lga}</p>
                  <p>{address.state}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  {!address.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(address.id!)}
                      disabled={isSettingDefault}
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(address)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingAddress(address.id!)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Address Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
            <DialogDescription>
              Add a new delivery address for faster checkout.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="label">Label (e.g., Home, Work)</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Home"
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked as boolean })}
                  />
                  <Label htmlFor="isDefault" className="cursor-pointer">Set as default</Label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="address">Street Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lga">LGA</Label>
                <Input
                  id="lga"
                  value={formData.lga}
                  onChange={(e) => setFormData({ ...formData, lga: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleAddAddress} disabled={isAdding}>
              {isAdding ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : 'Add Address'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Address Dialog */}
      <Dialog open={!!editingAddress} onOpenChange={() => { setEditingAddress(null); resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
            <DialogDescription>
              Update your delivery address information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-label">Label</Label>
                <Input
                  id="edit-label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked as boolean })}
                  />
                  <Label htmlFor="edit-isDefault" className="cursor-pointer">Set as default</Label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Street Address</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-lga">LGA</Label>
                <Input
                  id="edit-lga"
                  value={formData.lga}
                  onChange={(e) => setFormData({ ...formData, lga: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-state">State</Label>
                <Input
                  id="edit-state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingAddress(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleUpdateAddress} disabled={isUpdating}>
              {isUpdating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : 'Update Address'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingAddress} onOpenChange={() => setDeletingAddress(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Address?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingAddress(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deletingAddress && handleDeleteAddress(deletingAddress)} disabled={isDeleting}>
              {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

