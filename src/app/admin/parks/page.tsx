'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAllParks } from '@/lib/firebase/firestore/parks';
import { createPark, deletePark, updatePark } from '@/lib/parks-actions';
import { initializeParks } from '@/lib/init-parks';
import { Loader2, MapPin, Plus, Trash2, Database } from 'lucide-react';
import { useState, useTransition } from 'react';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

export default function AdminParksPage() {
  const { data: parks, isLoading } = useAllParks();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPark, setEditingPark] = useState<{ id: string; name: string; city: string; state: string; isActive: boolean } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    isActive: true,
  });

  const handleCreate = () => {
    setFormData({ name: '', city: '', state: '', isActive: true });
    setEditingPark(null);
    setShowCreateDialog(true);
  };

  const handleEdit = (park: typeof parks[0]) => {
    setFormData({
      name: park.name,
      city: park.city,
      state: park.state,
      isActive: park.isActive ?? true,
    });
    setEditingPark({ id: park.id!, name: park.name, city: park.city, state: park.state, isActive: park.isActive ?? true });
    setShowCreateDialog(true);
  };

  const handleDelete = (parkId: string) => {
    if (!confirm('Are you sure you want to delete this park?')) return;

    startTransition(async () => {
      try {
        await deletePark(parkId);
        toast({
          title: 'Park Deleted',
          description: 'The park has been deleted successfully.',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: (error as Error).message,
        });
      }
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.city || !formData.state) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
      });
      return;
    }

    startTransition(async () => {
      try {
        if (editingPark) {
          await updatePark(editingPark.id, formData);
          toast({
            title: 'Park Updated',
            description: 'The park has been updated successfully.',
          });
        } else {
          await createPark(formData);
          toast({
            title: 'Park Created',
            description: 'The park has been created successfully.',
          });
        }
        setShowCreateDialog(false);
        setFormData({ name: '', city: '', state: '', isActive: true });
        setEditingPark(null);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: (error as Error).message,
        });
      }
    });
  };

  const parksByState = parks.reduce((acc, park) => {
    if (!acc[park.state]) {
      acc[park.state] = [];
    }
    acc[park.state].push(park);
    return acc;
  }, {} as Record<string, typeof parks>);

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 bg-background border-b flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Waybill Parks</h1>
          <p className="text-muted-foreground">Manage parks for inter-state waybill deliveries</p>
        </div>
        <div className="flex gap-2">
          {!isLoading && parks.length === 0 && (
            <Button 
              variant="outline" 
              onClick={() => {
                startTransition(async () => {
                  try {
                    await initializeParks();
                    toast({
                      title: 'Parks Initialized',
                      description: 'Parks have been initialized from default data.',
                    });
                  } catch (error) {
                    toast({
                      variant: 'destructive',
                      title: 'Error',
                      description: (error as Error).message,
                    });
                  }
                });
              }}
              disabled={isPending}
            >
              <Database className="mr-2 h-4 w-4" />
              Initialize Default Parks
            </Button>
          )}
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Park
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 sm:p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : parks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No parks added yet</p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Park
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(parksByState).map(([state, stateParks]) => (
              <Card key={state}>
                <CardHeader>
                  <CardTitle>{state}</CardTitle>
                  <CardDescription>{stateParks.length} park{stateParks.length !== 1 ? 's' : ''}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stateParks.map((park) => (
                        <TableRow key={park.id}>
                          <TableCell className="font-medium">{park.name}</TableCell>
                          <TableCell>{park.city}</TableCell>
                          <TableCell>
                            {park.isActive ? (
                              <span className="text-green-600">Active</span>
                            ) : (
                              <span className="text-muted-foreground">Inactive</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(park)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(park.id!)}
                                disabled={isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPark ? 'Edit Park' : 'Add New Park'}</DialogTitle>
            <DialogDescription>
              {editingPark ? 'Update park information' : 'Add a new waybill park for inter-state deliveries'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Park Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Naibawa Park"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g., Kano"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Select
                value={formData.state}
                onValueChange={(value) => setFormData({ ...formData, state: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active (visible to sellers)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setFormData({ name: '', city: '', state: '', isActive: true });
              setEditingPark(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingPark ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingPark ? 'Update Park' : 'Create Park'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

