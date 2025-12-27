'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface FragranceFieldsProps {
  volume?: string;
  fragranceType?: string;
  container?: string;
  onVolumeChange: (volume: string) => void;
  onTypeChange: (type: string) => void;
  onContainerChange: (container: string) => void;
}

const VOLUME_OPTIONS = [
  { value: '3ml', label: '3ml' },
  { value: '6ml', label: '6ml' },
  { value: '12ml', label: '12ml (1 Tola)' },
  { value: '30ml', label: '30ml' },
  { value: '50ml', label: '50ml' },
  { value: '100ml', label: '100ml' },
  { value: 'other', label: 'Other' },
];

const TYPE_OPTIONS = [
  { value: 'oil-based', label: 'Oil-Based (Humra/Oil)' },
  { value: 'spray', label: 'Spray (Perfume)' },
  { value: 'incense', label: 'Incense (Turaren Wuta)' },
];

const CONTAINER_OPTIONS = [
  { value: 'pocket-size', label: 'Pocket Size' },
  { value: 'standard-bottle', label: 'Standard Bottle' },
  { value: 'refill-unboxed', label: 'Refill/Unboxed' },
];

export function FragranceFields({
  volume,
  fragranceType,
  container,
  onVolumeChange,
  onTypeChange,
  onContainerChange,
}: FragranceFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Volume Picker - Chips */}
      <div className="space-y-2">
        <Label>Volume (ml)</Label>
        <div className="flex flex-wrap gap-2">
          {VOLUME_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={volume === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onVolumeChange(option.value)}
              className={cn(
                volume === option.value && "bg-primary text-primary-foreground"
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Type Selector */}
      <div className="space-y-2">
        <Label>Type *</Label>
        <Select value={fragranceType || ''} onValueChange={onTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select fragrance type" />
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

      {/* Container Selector */}
      <div className="space-y-2">
        <Label>Container *</Label>
        <Select value={container || ''} onValueChange={onContainerChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select container type" />
          </SelectTrigger>
          <SelectContent>
            {CONTAINER_OPTIONS.map((option) => (
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

