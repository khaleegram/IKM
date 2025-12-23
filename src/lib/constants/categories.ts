// Product categories for the marketplace
export const PRODUCT_CATEGORIES = [
  { value: 'electronics', label: 'Electronics', icon: '📱' },
  { value: 'fashion', label: 'Fashion & Apparel', icon: '👕' },
  { value: 'home', label: 'Home & Living', icon: '🏠' },
  { value: 'beauty', label: 'Beauty & Personal Care', icon: '💄' },
  { value: 'sports', label: 'Sports & Outdoors', icon: '⚽' },
  { value: 'books', label: 'Books & Media', icon: '📚' },
  { value: 'toys', label: 'Toys & Games', icon: '🎮' },
  { value: 'automotive', label: 'Automotive', icon: '🚗' },
  { value: 'food', label: 'Food & Beverages', icon: '🍔' },
  { value: 'health', label: 'Health & Wellness', icon: '💊' },
  { value: 'jewelry', label: 'Jewelry & Accessories', icon: '💍' },
  { value: 'art', label: 'Arts & Crafts', icon: '🎨' },
  { value: 'baby', label: 'Baby & Kids', icon: '👶' },
  { value: 'pet', label: 'Pet Supplies', icon: '🐾' },
  { value: 'office', label: 'Office Supplies', icon: '📎' },
  { value: 'garden', label: 'Garden & Tools', icon: '🌱' },
  { value: 'general', label: 'General', icon: '📦' },
] as const;

export type CategoryValue = typeof PRODUCT_CATEGORIES[number]['value'];

export const getCategoryLabel = (value: string | undefined): string => {
  if (!value) return 'Uncategorized';
  const category = PRODUCT_CATEGORIES.find(cat => cat.value === value);
  return category?.label || value;
};

