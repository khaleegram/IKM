/**
 * Northern Nigerian Product Categories
 * Tailored for actual products sold in Northern markets
 */

export interface NorthernCategory {
  id: string;
  name: string;
  nameHausa: string;
  description: string;
  icon: string;
  fields: string[]; // Which fields to show for this category
}

export const NORTHERN_PRODUCT_CATEGORIES: NorthernCategory[] = [
  // Fragrance & Perfumes
  {
    id: "fragrance",
    name: "Fragrance & Perfumes",
    nameHausa: "Turare",
    description: "Perfumes, oud, attar, body sprays",
    icon: "🌸",
    fields: ["volume", "type", "container"]
  },
  
  // Fashion & Abayas
  {
    id: "fashion",
    name: "Fashion & Abayas",
    nameHausa: "Kayan Ado",
    description: "Abayas, hijabs, kaftans, traditional wear",
    icon: "👗",
    fields: ["sizeType", "setIncludes", "material"]
  },
  
  // Snacks & Food
  {
    id: "snacks",
    name: "Snacks & Food",
    nameHausa: "Abinci",
    description: "Kilishi, fura, tuwo, local snacks",
    icon: "🍖",
    fields: ["packaging", "quantity", "taste"]
  },
  
  // Materials & Fabrics
  {
    id: "materials",
    name: "Materials & Fabrics",
    nameHausa: "Kayan Zane",
    description: "Shadda, atiku, unsewn fabrics",
    icon: "🧵",
    fields: ["length", "quality"]
  },
  
  // Beauty & Personal Care
  {
    id: "skincare",
    name: "Skincare & Cosmetics",
    nameHausa: "Kayan Kwalliya",
    description: "Face creams, soaps, beauty products",
    icon: "💄",
    fields: ["brand", "type", "size"]
  },
  {
    id: "haircare",
    name: "Hair Care Products",
    nameHausa: "Kayan Gashi",
    description: "Hair oils, treatments, accessories",
    icon: "💇",
    fields: ["type", "brand", "size"]
  },
  
  // Islamic Products
  {
    id: "islamic",
    name: "Islamic Products",
    nameHausa: "Kayan Addini",
    description: "Prayer mats, tasbih, Islamic books, misbaha",
    icon: "🕌",
    fields: ["type", "size", "material"]
  },
  
  // Electronics
  {
    id: "electronics",
    name: "Electronics",
    nameHausa: "Na'urori",
    description: "Phones, accessories, gadgets",
    icon: "📱",
    fields: ["brand", "model"]
  }
];

/**
 * Get category by ID
 */
export function getNorthernCategoryById(id: string): NorthernCategory | undefined {
  return NORTHERN_PRODUCT_CATEGORIES.find(cat => cat.id === id);
}

/**
 * Get all category IDs
 */
export function getAllCategoryIds(): string[] {
  return NORTHERN_PRODUCT_CATEGORIES.map(cat => cat.id);
}

