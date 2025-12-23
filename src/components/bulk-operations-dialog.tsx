'use client';

import { useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { PRODUCT_CATEGORIES } from "@/lib/constants/categories";

interface BulkOperationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onBulkUpdate: (updateType: 'price' | 'stock' | 'category', value: string | number) => Promise<void>;
  isProcessing?: boolean;
}

export function BulkOperationsDialog({
  open,
  onOpenChange,
  selectedCount,
  onBulkUpdate,
  isProcessing = false,
}: BulkOperationsDialogProps) {
  const [updateType, setUpdateType] = useState<'price' | 'stock' | 'category'>('price');
  const [value, setValue] = useState('');

  const handleSubmit = async () => {
    if (!value) return;

    let processedValue: string | number = value;
    if (updateType === 'price' || updateType === 'stock') {
      processedValue = Number(value);
      if (isNaN(processedValue)) {
        return;
      }
    }

    await onBulkUpdate(updateType, processedValue);
    setValue('');
    setUpdateType('price');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Update Products</DialogTitle>
          <DialogDescription>
            Update {selectedCount} selected product(s). All changes will be applied to all selected products.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Update Type</Label>
            <Select value={updateType} onValueChange={(v) => setUpdateType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="bulk-value">
              {updateType === 'price' && 'New Price (₦)'}
              {updateType === 'stock' && 'Stock Quantity'}
              {updateType === 'category' && 'Category'}
            </Label>
            {updateType === 'category' ? (
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="bulk-value"
                type={updateType === 'price' ? 'number' : 'number'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={updateType === 'price' ? 'Enter new price' : 'Enter stock quantity'}
                min={0}
              />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isProcessing || !value}>
            {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : `Update ${selectedCount} Product(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

