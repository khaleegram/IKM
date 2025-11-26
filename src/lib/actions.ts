
'use server';

import { generateProductDescription as genProductDesc, type GenerateProductDescriptionInput } from "@/ai/flows/seller-product-description-assistance";
import { z } from "zod";

const productDescriptionSchema = z.object({
  productName: z.string(),
  productCategory: z.string(),
  keyFeatures: z.string(),
  targetAudience: z.string(),
});

export async function getProductDescription(input: GenerateProductDescriptionInput) {
  const parsedInput = productDescriptionSchema.parse(input);
  const result = await genProductDesc(parsedInput);
  return result.description;
}
