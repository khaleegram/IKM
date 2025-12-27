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
  onMaterialTypeChange: (type: string) => void;
  onLengthChange: (length: string) => void;
  onQualityChange: (quality: string) => void;
  onCustomMaterialTypeChange: (custom: string) => void;
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

export function MaterialsFields({
  materialType,
  fabricLength,
  quality,
  customMaterialType,
  onMaterialTypeChange,
  onLengthChange,
  onQualityChange,
  onCustomMaterialTypeChange,
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

      {/* Length */}
      <div className="space-y-2">
        <Label>Length (Yards) *</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Select the yard length for this listing. Stock represents total yards available.
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

      {/* Quality - Based on selected yard length */}
      <div className="space-y-2">
        <Label>Quality (for {fabricLength ? LENGTH_OPTIONS.find(o => o.value === fabricLength)?.label || 'selected length' : 'selected length'}) *</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Quality rating for this yard length option
        </p>
        <Select value={quality || ''} onValueChange={onQualityChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select quality" />
          </SelectTrigger>
          <SelectContent>
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

