'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface FashionFieldsProps {
  sizeType?: string;
  abayaLength?: string;
  standardSize?: string;
  setIncludes?: string;
  material?: string;
  onSizeTypeChange: (sizeType: string) => void;
  onAbayaLengthChange: (length: string) => void;
  onStandardSizeChange: (size: string) => void;
  onSetIncludesChange: (set: string) => void;
  onMaterialChange: (material: string) => void;
}

const ABAYA_LENGTHS = ['52', '54', '56', '58', '60'];
const STANDARD_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const SET_OPTIONS = [
  { value: 'dress-only', label: 'Dress Only' },
  { value: 'with-veil', label: 'With Veil/Shayla' },
  { value: '3-piece-set', label: '3-Piece Set' },
];

const MATERIAL_OPTIONS = [
  { value: 'soft-silk', label: 'Soft/Silk' },
  { value: 'stiff-cotton', label: 'Stiff/Cotton' },
  { value: 'heavy-premium', label: 'Heavy/Premium' },
];

export function FashionFields({
  sizeType,
  abayaLength,
  standardSize,
  setIncludes,
  material,
  onSizeTypeChange,
  onAbayaLengthChange,
  onStandardSizeChange,
  onSetIncludesChange,
  onMaterialChange,
}: FashionFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Size Type */}
      <div className="space-y-2">
        <Label>Size Type</Label>
        <div className="space-y-3">
          <Button
            type="button"
            variant={sizeType === 'free-size' ? 'default' : 'outline'}
            className={cn(
              "w-full",
              sizeType === 'free-size' && "bg-primary text-primary-foreground"
            )}
            onClick={() => onSizeTypeChange('free-size')}
          >
            Free Size (Most Common)
          </Button>
          
          <div className="space-y-2">
            <Button
              type="button"
              variant={sizeType === 'abaya-length' ? 'default' : 'outline'}
              className={cn(
                "w-full",
                sizeType === 'abaya-length' && "bg-primary text-primary-foreground"
              )}
              onClick={() => onSizeTypeChange('abaya-length')}
            >
              Abaya Size (Length)
            </Button>
            {sizeType === 'abaya-length' && (
              <div className="grid grid-cols-5 gap-2 mt-2">
                {ABAYA_LENGTHS.map((length) => (
                  <Button
                    key={length}
                    type="button"
                    variant={abayaLength === length ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onAbayaLengthChange(length)}
                    className={cn(
                      abayaLength === length && "bg-primary text-primary-foreground"
                    )}
                  >
                    {length}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant={sizeType === 'standard' ? 'default' : 'outline'}
              className={cn(
                "w-full",
                sizeType === 'standard' && "bg-primary text-primary-foreground"
              )}
              onClick={() => onSizeTypeChange('standard')}
            >
              Standard Size
            </Button>
            {sizeType === 'standard' && (
              <div className="flex flex-wrap gap-2 mt-2">
                {STANDARD_SIZES.map((size) => (
                  <Button
                    key={size}
                    type="button"
                    variant={standardSize === size ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onStandardSizeChange(size)}
                    className={cn(
                      standardSize === size && "bg-primary text-primary-foreground"
                    )}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Set Includes */}
      <div className="space-y-2">
        <Label>Set Includes *</Label>
        <Select value={setIncludes || ''} onValueChange={onSetIncludesChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select what's included" />
          </SelectTrigger>
          <SelectContent>
            {SET_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Material */}
      <div className="space-y-2">
        <Label>Material Feel *</Label>
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

