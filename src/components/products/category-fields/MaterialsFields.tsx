'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface MaterialsFieldsProps {
  materialType?: string;
  fabricLength?: string;
  quality?: string;
  customMaterialType?: string;
  // Northern market-specific fields
  unit?: 'yards' | 'meters' | 'rolls';
  fabricLengthYards?: number;
  color?: string;
  pattern?: string;
  grade?: string;
  supplier?: string;
  lotNumber?: string;
  wholesalePrice?: number;
  retailPrice?: number;
  onMaterialTypeChange: (type: string) => void;
  onLengthChange: (length: string) => void;
  onQualityChange: (quality: string) => void;
  onCustomMaterialTypeChange: (custom: string) => void;
  onUnitChange?: (unit: 'yards' | 'meters' | 'rolls') => void;
  onFabricLengthYardsChange?: (yards: number) => void;
  onColorChange?: (color: string) => void;
  onPatternChange?: (pattern: string) => void;
  onGradeChange?: (grade: string) => void;
  onSupplierChange?: (supplier: string) => void;
  onLotNumberChange?: (lot: string) => void;
  onWholesalePriceChange?: (price: number) => void;
  onRetailPriceChange?: (price: number) => void;
}

const MATERIAL_TYPE_OPTIONS = [
  { value: 'shadda', label: 'Shadda' },
  { value: 'atiku', label: 'Atiku' },
  { value: 'cotton', label: 'Cotton' },
  { value: 'silk', label: 'Silk' },
  { value: 'linen', label: 'Linen' },
  { value: 'custom', label: 'Custom (Specify)' },
];

const LENGTH_OPTIONS = [
  { value: '4-yards', label: '4 Yards' },
  { value: '5-yards', label: '5 Yards' },
  { value: '10-yards', label: '10 Yards (Full Bundle)' },
];

const QUALITY_OPTIONS = [
  { value: 'super-vip', label: 'Super VIP' },
  { value: 'standard', label: 'Standard' },
  { value: 'starched', label: 'Starched/Stiff' },
];

const GRADE_OPTIONS = [
  { value: 'premium', label: 'Premium (A)' },
  { value: 'standard-a', label: 'Standard A' },
  { value: 'standard-b', label: 'Standard B' },
  { value: 'economy', label: 'Economy (C)' },
];

const PATTERN_OPTIONS = [
  { value: 'plain', label: 'Plain' },
  { value: 'floral', label: 'Floral' },
  { value: 'geometric', label: 'Geometric' },
  { value: 'striped', label: 'Striped' },
  { value: 'checked', label: 'Checked' },
  { value: 'printed', label: 'Printed' },
  { value: 'embossed', label: 'Embossed' },
];

export function MaterialsFields({
  materialType,
  fabricLength,
  quality,
  customMaterialType,
  unit = 'yards',
  fabricLengthYards,
  color,
  pattern,
  grade,
  supplier,
  lotNumber,
  wholesalePrice,
  retailPrice,
  onMaterialTypeChange,
  onLengthChange,
  onQualityChange,
  onCustomMaterialTypeChange,
  onUnitChange,
  onFabricLengthYardsChange,
  onColorChange,
  onPatternChange,
  onGradeChange,
  onSupplierChange,
  onLotNumberChange,
  onWholesalePriceChange,
  onRetailPriceChange,
}: MaterialsFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Material Type */}
      <div className="space-y-2">
        <Label>Material Type *</Label>
        <Select value={materialType || ''} onValueChange={onMaterialTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select material type" />
          </SelectTrigger>
          <SelectContent>
            {MATERIAL_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {materialType === 'custom' && (
          <Input
            type="text"
            placeholder="e.g., Ankara, Kente, etc."
            value={customMaterialType || ''}
            onChange={(e) => onCustomMaterialTypeChange(e.target.value)}
            className="mt-2"
          />
        )}
      </div>

      {/* Unit of Measurement */}
      <div className="space-y-2">
        <Label>Unit of Measurement *</Label>
        <Select value={unit || 'yards'} onValueChange={(val) => onUnitChange?.(val as 'yards' | 'meters' | 'rolls')}>
          <SelectTrigger>
            <SelectValue placeholder="Select unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yards">Yards</SelectItem>
            <SelectItem value="meters">Meters</SelectItem>
            <SelectItem value="rolls">Rolls/Bundles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Available Quantity */}
      <div className="space-y-2">
        <Label>Available {unit === 'yards' ? 'Yards' : unit === 'meters' ? 'Meters' : 'Rolls'} *</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Total {unit === 'yards' ? 'yards' : unit === 'meters' ? 'meters' : 'rolls'} available. This will be deducted when orders are placed.
        </p>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder={`Enter total ${unit}`}
          value={fabricLengthYards || ''}
          onChange={(e) => onFabricLengthYardsChange?.(parseFloat(e.target.value) || 0)}
        />
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label>Color</Label>
        <Input
          type="text"
          placeholder="e.g., Blue, Red, Multi-color"
          value={color || ''}
          onChange={(e) => onColorChange?.(e.target.value)}
        />
      </div>

      {/* Pattern */}
      <div className="space-y-2">
        <Label>Pattern</Label>
        <Select value={pattern || ''} onValueChange={(val) => onPatternChange?.(val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select pattern (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {PATTERN_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grade */}
      <div className="space-y-2">
        <Label>Quality Grade</Label>
        <Select value={grade || ''} onValueChange={(val) => onGradeChange?.(val)}>
          <SelectTrigger>
            <SelectValue placeholder="Select grade (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {GRADE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Supplier */}
      <div className="space-y-2">
        <Label>Supplier/Market Name</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Name of your supplier or market where you source from
        </p>
        <Input
          type="text"
          placeholder="e.g., Kano Market, Alhaji Supplies"
          value={supplier || ''}
          onChange={(e) => onSupplierChange?.(e.target.value)}
        />
      </div>

      {/* Lot Number */}
      <div className="space-y-2">
        <Label>Lot/Batch Number</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Track batches for quality control and restocking
        </p>
        <Input
          type="text"
          placeholder="e.g., LOT-2024-001"
          value={lotNumber || ''}
          onChange={(e) => onLotNumberChange?.(e.target.value)}
        />
      </div>

      {/* Wholesale & Retail Prices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Wholesale Price (per {unit === 'yards' ? 'yard' : unit === 'meters' ? 'meter' : 'roll'})</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Price for bulk buyers
          </p>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="₦0.00"
            value={wholesalePrice || ''}
            onChange={(e) => onWholesalePriceChange?.(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label>Retail Price (per {unit === 'yards' ? 'yard' : unit === 'meters' ? 'meter' : 'roll'})</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Price for individual buyers
          </p>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="₦0.00"
            value={retailPrice || ''}
            onChange={(e) => onRetailPriceChange?.(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Legacy Length Options (for backward compatibility) */}
      <div className="space-y-2 border-t pt-4">
        <Label>Listing Length Option (Optional)</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Pre-set yard lengths for quick listing
        </p>
        <div className="flex flex-wrap gap-2">
          {LENGTH_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={fabricLength === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onLengthChange(option.value)}
              className={cn(
                fabricLength === option.value && "bg-primary text-primary-foreground"
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Legacy Quality Rating */}
      <div className="space-y-2">
        <Label>Quality Rating (Optional)</Label>
        <Select value={quality || ''} onValueChange={onQualityChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select quality (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {QUALITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

