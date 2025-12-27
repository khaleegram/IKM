'use client';

import { Card, CardContent } from '@/components/ui/card';
import { NORTHERN_PRODUCT_CATEGORIES } from '@/lib/data/northern-categories';
import { cn } from '@/lib/utils';

interface CategoryPickerProps {
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
}

export function CategoryPicker({ selectedCategory, onCategorySelect }: CategoryPickerProps) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Select Category</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {NORTHERN_PRODUCT_CATEGORIES.map((category) => (
          <Card
            key={category.id}
            className={cn(
              "cursor-pointer transition-all hover:border-primary hover:shadow-md",
              selectedCategory === category.id && "border-primary border-2 shadow-md"
            )}
            onClick={() => onCategorySelect(category.id)}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="text-3xl">{category.icon}</div>
              <div className="text-sm font-medium">{category.name}</div>
              <div className="text-xs text-muted-foreground">{category.nameHausa}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

