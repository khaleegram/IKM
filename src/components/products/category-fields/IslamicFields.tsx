'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface IslamicFieldsProps {
  type?: string;
  size?: string;
  material?: string;
  onTypeChange: (type: string) => void;
  onSizeChange: (size: string) => void;
  onMaterialChange: (material: string) => void;
}

const TYPE_OPTIONS = [
  { value: 'prayer-mat', label: 'Prayer Mat (Sallah)' },
  { value: 'tasbih', label: 'Tasbih (Misbaha)' },
  { value: 'book', label: 'Islamic Book' },
  { value: 'misbaha', label: 'Misbaha (Prayer Beads)' },
  { value: 'quran', label: 'Quran' },
  { value: 'hijab-pin', label: 'Hijab Pin' },
  { value: 'other', label: 'Other' },
];

const SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'standard', label: 'Standard' },
];

const MATERIAL_OPTIONS = [
  { value: 'wool', label: 'Wool' },
  { value: 'cotton', label: 'Cotton' },
  { value: 'plastic', label: 'Plastic' },
  { value: 'wood', label: 'Wood' },
  { value: 'synthetic', label: 'Synthetic' },
  { value: 'other', label: 'Other' },
];

export function IslamicFields({
  type,
  size,
  material,
  onTypeChange,
  onSizeChange,
  onMaterialChange,
}: IslamicFieldsProps) {
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
      </div>

      {/* Material */}
      <div className="space-y-2">
        <Label>Material</Label>
        <Select value={material || ''} onValueChange={onMaterialChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select material" />
          </SelectTrigger>
          <SelectContent>
            {MATERIAL_OPTIONS.map((option) => (
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

