// Product categories for the marketplace
// Using Northern categories
import { NORTHERN_PRODUCT_CATEGORIES, type NorthernCategory } from '@/lib/data/northern-categories';

export const PRODUCT_CATEGORIES = NORTHERN_PRODUCT_CATEGORIES.map((cat: NorthernCategory) => ({
  value: cat.id,
  label: cat.name,
  icon: cat.icon,
}));

export type CategoryValue = typeof PRODUCT_CATEGORIES[number]['value'];

export const getCategoryLabel = (value: string | undefined): string => {
  if (!value) return 'Uncategorized';
  const category = PRODUCT_CATEGORIES.find(cat => cat.value === value);
  return category?.label || value;
};

