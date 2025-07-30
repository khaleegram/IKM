'use server';

/**
 * @fileOverview Summarizes a rider's earnings for a given period.
 *
 * - summarizeRiderEarnings - A function that summarizes the rider earnings.
 * - RiderEarningsSummaryInput - The input type for the summarizeRiderEarnings function.
 * - RiderEarningsSummaryOutput - The return type for the summarizeRiderEarnings function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RiderEarningsSummaryInputSchema = z.object({
  riderId: z.string().describe('The ID of the rider.'),
  period: z.string().describe('The period for which to summarize earnings (e.g., last week, last month).'),
});
export type RiderEarningsSummaryInput = z.infer<typeof RiderEarningsSummaryInputSchema>;

const RiderEarningsSummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the rider earnings for the given period.'),
});
export type RiderEarningsSummaryOutput = z.infer<typeof RiderEarningsSummaryOutputSchema>;

export async function summarizeRiderEarnings(input: RiderEarningsSummaryInput): Promise<RiderEarningsSummaryOutput> {
  return summarizeRiderEarningsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'riderEarningsSummaryPrompt',
  input: {schema: RiderEarningsSummaryInputSchema},
  output: {schema: RiderEarningsSummaryOutputSchema},
  prompt: `You are an AI assistant helping riders track their income.

  Summarize the rider's earnings for the given period.  Be concise and specific.

Rider ID: {{{riderId}}}
Period: {{{period}}}
`,
});

const summarizeRiderEarningsFlow = ai.defineFlow(
  {
    name: 'summarizeRiderEarningsFlow',
    inputSchema: RiderEarningsSummaryInputSchema,
    outputSchema: RiderEarningsSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
