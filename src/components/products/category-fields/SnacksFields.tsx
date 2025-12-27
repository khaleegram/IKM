'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import React from 'react';

interface SnacksFieldsProps {
  packaging?: string;
  quantity?: number;
  taste?: string;
  onPackagingChange: (packaging: string) => void;
  onQuantityChange: (quantity: number) => void;
  onTasteChange: (taste: string) => void;
}

const PACKAGING_OPTIONS = [
  { value: 'single-piece', label: 'Single Piece' },
  { value: 'pack-sachet', label: 'Pack/Sachet' },
  { value: 'plastic-jar', label: 'Plastic Jar/Rubber' },
  { value: 'bucket', label: 'Bucket' },
];

const QUANTITY_OPTIONS = [1, 6, 12, 24];

const TASTE_OPTIONS = [
  { value: 'sweet', label: 'Sweet' },
  { value: 'spicy', label: 'Spicy/Yaji' },
  { value: 'crunchy', label: 'Crunchy' },
  { value: 'soft', label: 'Soft' },
];

export function SnacksFields({
  packaging,
  quantity,
  taste,
  onPackagingChange,
  onQuantityChange,
  onTasteChange,
}: SnacksFieldsProps) {
  const [customQuantity, setCustomQuantity] = React.useState<string>('');

  return (
    <div className="space-y-4">
      {/* Packaging */}
      <div className="space-y-2">
        <Label>How it's packed</Label>
        <div className="flex flex-wrap gap-2">
          {PACKAGING_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={packaging === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPackagingChange(option.value)}
              className={cn(
                packaging === option.value && "bg-primary text-primary-foreground"
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div className="space-y-2">
        <Label>Quantity in Pack</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {QUANTITY_OPTIONS.map((qty) => (
            <Button
              key={qty}
              type="button"
              variant={quantity === qty ? 'default' : 'outline'}
              size="sm"
              onClick={() => onQuantityChange(qty)}
              className={cn(
                quantity === qty && "bg-primary text-primary-foreground"
              )}
            >
              {qty}
            </Button>
          ))}
        </div>
        <Input
          type="number"
          placeholder="Or enter custom number"
          value={customQuantity}
          onChange={(e) => {
            setCustomQuantity(e.target.value);
            const num = parseInt(e.target.value);
            if (!isNaN(num) && num > 0) {
              onQuantityChange(num);
            }
          }}
        />
      </div>

      {/* Taste Tag */}
      <div className="space-y-2">
        <Label>The "Taste" Tag</Label>
        <div className="flex flex-wrap gap-2">
          {TASTE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={taste === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTasteChange(option.value)}
              className={cn(
                taste === option.value && "bg-primary text-primary-foreground"
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

