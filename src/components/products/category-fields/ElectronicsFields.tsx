'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ElectronicsFieldsProps {
  brand?: string;
  model?: string;
  onBrandChange: (brand: string) => void;
  onModelChange: (model: string) => void;
}

export function ElectronicsFields({
  brand,
  model,
  onBrandChange,
  onModelChange,
}: ElectronicsFieldsProps) {
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

      {/* Model */}
      <div className="space-y-2">
        <Label>Model (Optional)</Label>
        <Input
          type="text"
          placeholder="Enter model name"
          value={model || ''}
          onChange={(e) => onModelChange(e.target.value)}
        />
      </div>
    </div>
  );
}

