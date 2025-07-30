'use server';

import { analyzeSales } from "@/ai/flows/seller-sales-analysis";
import { generateProductDescription as genProductDesc, type GenerateProductDescriptionInput } from "@/ai/flows/seller-product-description-assistance";
import { summarizeRiderEarnings, type RiderEarningsSummaryInput } from "@/ai/flows/rider-earnings-summary";
import { flagSuspiciousActivity, type FlagSuspiciousActivityInput } from "@/ai/flows/admin-suspicious-activity-flagging";
import { summarizePlatformRevenue, type SummarizePlatformRevenueInput } from "@/ai/flows/admin-platform-revenue-summary";
import { z } from "zod";

const salesData = [
    { productId: 'p001', productName: 'Artisan Coffee Beans', quantity: 150, price: 20, date: '2023-10-01' },
    { productId: 'p002', productName: 'Handmade Ceramic Mug', quantity: 250, price: 25, date: '2023-10-05' },
    { productId: 'p003', productName: 'Organic Tea Selection', quantity: 100, price: 15, date: '2023-10-12' },
    { productId: 'p001', productName: 'Artisan Coffee Beans', quantity: 120, price: 20, date: '2023-11-01' },
    { productId: 'p002', productName: 'Handmade Ceramic Mug', quantity: 300, price: 25, date: '2023-11-05' },
];

export async function getSalesAnalysis() {
  const result = await analyzeSales({ salesData: JSON.stringify(salesData) });
  return `**Summary:** ${result.summary}\n\n**Insights:** ${result.insights}`;
}

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

export async function getRiderEarningsSummary(input: RiderEarningsSummaryInput) {
    const result = await summarizeRiderEarnings(input);
    return result.summary;
}

export async function getSuspiciousActivity(input: FlagSuspiciousActivityInput) {
    const result = await flagSuspiciousActivity(input);
    return result;
}

export async function getPlatformRevenueSummary(input: SummarizePlatformRevenueInput) {
    const result = await summarizePlatformRevenue(input);
    return result.revenueSummary;
}
