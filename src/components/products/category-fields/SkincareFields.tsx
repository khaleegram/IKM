'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SkincareFieldsProps {
  brand?: string;
  type?: string;
  size?: string;
  onBrandChange: (brand: string) => void;
  onTypeChange: (type: string) => void;
  onSizeChange: (size: string) => void;
}

const TYPE_OPTIONS = [
  { value: 'face-cream', label: 'Face Cream' },
  { value: 'soap', label: 'Soap' },
  { value: 'toner', label: 'Toner' },
  { value: 'serum', label: 'Serum' },
  { value: 'moisturizer', label: 'Moisturizer' },
  { value: 'cleanser', label: 'Cleanser' },
  { value: 'mask', label: 'Face Mask' },
  { value: 'other', label: 'Other' },
];

const SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'custom', label: 'Custom (specify ml/g)' },
];

export function SkincareFields({
  brand,
  type,
  size,
  onBrandChange,
  onTypeChange,
  onSizeChange,
}: SkincareFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Brand */}
      <div className="space-y-2">
        <Label>Brand (Optional)</Label>
        <Input
          type="text"
          placeholder="Enter brand name"
          value={brand || ''}
          onChange={(e) => onBrandChange(e.target.value)}
        />
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label>Product Type *</Label>
        <Select value={type || ''} onValueChange={onTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select product type" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Size */}
      <div className="space-y-2">
        <Label>Size</Label>
        <Select value={size || ''} onValueChange={onSizeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent>
            {SIZE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {size === 'custom' && (
          <Input
            type="text"
            placeholder="e.g., 50ml, 100g"
            className="mt-2"
            onChange={(e) => onSizeChange(`custom-${e.target.value}`)}
          />
        )}
      </div>
    </div>
  );
}

