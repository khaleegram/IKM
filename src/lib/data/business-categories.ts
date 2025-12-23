/**
 * Business categories for store setup
 * Tailored for local sellers in Northern Nigeria
 */

export interface BusinessCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  {
    id: "fashion",
    name: "Fashion & Apparel",
    description: "Clothing, shoes, accessories, traditional wear"
  },
  {
    id: "electronics",
    name: "Electronics & Gadgets",
    description: "Phones, accessories, gadgets, tech products"
  },
  {
    id: "food",
    name: "Food & Beverages",
    description: "Food items, drinks, snacks, groceries"
  },
  {
    id: "beauty",
    name: "Beauty & Personal Care",
    description: "Cosmetics, skincare, hair products, perfumes"
  },
  {
    id: "home",
    name: "Home & Living",
    description: "Furniture, home decor, kitchen items, household goods"
  },
  {
    id: "health",
    name: "Health & Wellness",
    description: "Medicines, supplements, health products"
  },
  {
    id: "baby",
    name: "Baby & Kids",
    description: "Baby products, toys, children's items"
  },
  {
    id: "sports",
    name: "Sports & Outdoors",
    description: "Sports equipment, outdoor gear, fitness items"
  },
  {
    id: "books",
    name: "Books & Education",
    description: "Books, educational materials, stationery"
  },
  {
    id: "automotive",
    name: "Automotive",
    description: "Car parts, accessories, automotive products"
  },
  {
    id: "agriculture",
    name: "Agriculture & Farming",
    description: "Farm produce, seeds, farming equipment"
  },
  {
    id: "handmade",
    name: "Handmade & Crafts",
    description: "Handcrafted items, artisanal products, local crafts"
  },
  {
    id: "general",
    name: "General Store",
    description: "Multiple categories, general merchandise"
  }
];

/**
 * Get category by ID
 */
export function getCategoryById(id: string): BusinessCategory | undefined {
  return BUSINESS_CATEGORIES.find(cat => cat.id === id);
}

