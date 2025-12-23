'use client';

import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { openDispute } from '@/lib/dispute-actions';
import { Loader2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import type { Order } from '@/lib/firebase/firestore/orders';

interface OpenDisputeDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OpenDisputeDialog({ order, open, onOpenChange }: OpenDisputeDialogProps) {
  const { toast } = useToast();
  const [disputeType, setDisputeType] = useState<'item_not_received' | 'wrong_item' | 'damaged_item'>('item_not_received');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'dispute-photos');

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const { url } = await response.json();
      setPhotos([...photos, url]);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: (error as Error).message,
      });
    }
  };

  const handleSubmit = () => {
    if (description.length < 10) {
      toast({
        variant: 'destructive',
        title: 'Invalid Description',
        description: 'Please provide at least 10 characters describing the issue.',
      });
      return;
    }

    startTransition(async () => {
      try {
        await openDispute({
          orderId: order.id!,
          type: disputeType,
          description,
          photos: photos.length > 0 ? photos : undefined,
        });

        toast({
          title: 'Dispute Opened',
          description: 'Your dispute has been submitted. An admin will review it shortly.',
        });

        onOpenChange(false);
        setDescription('');
        setPhotos([]);
        setDisputeType('item_not_received');
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed',
          description: (error as Error).message,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Open Dispute</DialogTitle>
          <DialogDescription>
            Describe the issue with your order. An admin will review and resolve it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Dispute Type</Label>
            <Select value={disputeType} onValueChange={(value: any) => setDisputeType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="item_not_received">Item Not Received</SelectItem>
                <SelectItem value="wrong_item">Wrong Item</SelectItem>
                <SelectItem value="damaged_item">Item Damaged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the issue in detail..."
              rows={5}
              minLength={10}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/10 characters minimum
            </p>
          </div>

          <div>
            <Label>Photos (Optional)</Label>
            <div className="mt-2 space-y-2">
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative aspect-square">
                      <Image
                        src={photo}
                        alt={`Dispute photo ${idx + 1}`}
                        fill
                        className="object-cover rounded"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="dispute-photo-upload"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('dispute-photo-upload')?.click()}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Add Photo
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || description.length < 10}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Dispute'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

