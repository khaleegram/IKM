'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HaircareFieldsProps {
  type?: string;
  brand?: string;
  size?: string;
  packageItems?: string[]; // Array of selected items in package
  onTypeChange: (type: string) => void;
  onBrandChange: (brand: string) => void;
  onSizeChange: (size: string) => void;
  onPackageItemsChange: (items: string[]) => void;
}

const TYPE_OPTIONS = [
  { value: 'hair-oil', label: 'Hair Oil' },
  { value: 'treatment', label: 'Hair Treatment' },
  { value: 'shampoo', label: 'Shampoo' },
  { value: 'conditioner', label: 'Conditioner' },
  { value: 'hair-cream', label: 'Hair Cream' },
  { value: 'hair-gel', label: 'Hair Gel' },
  { value: 'accessories', label: 'Hair Accessories' },
  { value: 'package-deal', label: 'Package Deal (Multiple Items)' },
  { value: 'other', label: 'Other' },
];

const SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'custom', label: 'Custom Size' },
];

const PACKAGE_ITEMS = [
  { value: 'oil', label: 'Hair Oil' },
  { value: 'shampoo', label: 'Shampoo' },
  { value: 'conditioner', label: 'Conditioner' },
  { value: 'treatment', label: 'Hair Treatment' },
  { value: 'cream', label: 'Hair Cream' },
  { value: 'gel', label: 'Hair Gel' },
  { value: 'accessories', label: 'Hair Accessories' },
];

export function HaircareFields({
  type,
  brand,
  size,
  packageItems = [],
  onTypeChange,
  onBrandChange,
  onSizeChange,
  onPackageItemsChange,
}: HaircareFieldsProps) {
  const handlePackageItemToggle = (itemValue: string) => {
    const currentItems = packageItems || [];
    if (currentItems.includes(itemValue)) {
      onPackageItemsChange(currentItems.filter(item => item !== itemValue));
    } else {
      onPackageItemsChange([...currentItems, itemValue]);
    }
  };

  return (
    <div className="space-y-4">
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

      {/* Package Items - Only show if type is package-deal */}
      {type === 'package-deal' && (
        <div className="space-y-2">
          <Label>What's Included in Package *</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Select all items included in this package deal
          </p>
          <div className="space-y-2">
            {PACKAGE_ITEMS.map((item) => (
              <div key={item.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`package-${item.value}`}
                  checked={packageItems.includes(item.value)}
                  onCheckedChange={() => handlePackageItemToggle(item.value)}
                />
                <Label
                  htmlFor={`package-${item.value}`}
                  className="cursor-pointer font-normal"
                >
                  {item.label}
                </Label>
              </div>
            ))}
          </div>
          {packageItems.length === 0 && (
            <p className="text-sm text-destructive">
              Please select at least one item for the package
            </p>
          )}
        </div>
      )}

      {/* Brand - Hide for package deals */}
      {type !== 'package-deal' && (
        <div className="space-y-2">
          <Label>Brand (Optional)</Label>
          <Input
            type="text"
            placeholder="Enter brand name"
            value={brand || ''}
            onChange={(e) => onBrandChange(e.target.value)}
          />
        </div>
      )}

      {/* Size - Hide for package deals */}
      {type !== 'package-deal' && (
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
              placeholder="e.g., Small Pack, Medium Pack"
              className="mt-2"
              onChange={(e) => onSizeChange(`custom-${e.target.value}`)}
            />
          )}
        </div>
      )}
    </div>
  );
}

