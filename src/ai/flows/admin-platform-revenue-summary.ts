'use server';
/**
 * @fileOverview An AI agent for summarizing platform revenue for administrators.
 *
 * - summarizePlatformRevenue - A function that summarizes the platform's revenue.
 * - SummarizePlatformRevenueInput - The input type for the summarizePlatformRevenue function.
 * - SummarizePlatformRevenueOutput - The return type for the summarizePlatformRevenue function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizePlatformRevenueInputSchema = z.object({
  timePeriod: z
    .string()
    .describe('The time period for which to summarize revenue (e.g., last month, last quarter, year to date).'),
});
export type SummarizePlatformRevenueInput = z.infer<typeof SummarizePlatformRevenueInputSchema>;

const SummarizePlatformRevenueOutputSchema = z.object({
  revenueSummary: z
    .string()
    .describe('A summary of the platform revenue for the specified time period.'),
});
export type SummarizePlatformRevenueOutput = z.infer<typeof SummarizePlatformRevenueOutputSchema>;

export async function summarizePlatformRevenue(input: SummarizePlatformRevenueInput): Promise<SummarizePlatformRevenueOutput> {
  return summarizePlatformRevenueFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizePlatformRevenuePrompt',
  input: {schema: SummarizePlatformRevenueInputSchema},
  output: {schema: SummarizePlatformRevenueOutputSchema},
  prompt: `You are an AI assistant for an e-commerce platform administrator. Your task is to summarize the platform's revenue for a given time period.

  Summarize the platform revenue for the following time period: {{{timePeriod}}}.
  Provide a concise summary of the revenue, including key metrics and trends.
`,
});

const summarizePlatformRevenueFlow = ai.defineFlow(
  {
    name: 'summarizePlatformRevenueFlow',
    inputSchema: SummarizePlatformRevenueInputSchema,
    outputSchema: SummarizePlatformRevenueOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
