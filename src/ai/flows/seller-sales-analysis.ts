'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing seller sales data and providing insights.
 *
 * - analyzeSales - A function that analyzes sales data and returns insights.
 * - AnalyzeSalesInput - The input type for the analyzeSales function.
 * - AnalyzeSalesOutput - The return type for the analyzeSales function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeSalesInputSchema = z.object({
  salesData: z.string().describe('A stringified JSON array containing sales data. Each object should contain productId, productName, quantity, price, and date.'),
});
export type AnalyzeSalesInput = z.infer<typeof AnalyzeSalesInputSchema>;

const AnalyzeSalesOutputSchema = z.object({
  summary: z.string().describe('A summary of the sales data, including total sales, best-selling product, and average order value.'),
  insights: z.string().describe('Insights into the sales data, including trends, patterns, and recommendations for improvement.'),
});
export type AnalyzeSalesOutput = z.infer<typeof AnalyzeSalesOutputSchema>;

export async function analyzeSales(input: AnalyzeSalesInput): Promise<AnalyzeSalesOutput> {
  return analyzeSalesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSalesPrompt',
  input: {schema: AnalyzeSalesInputSchema},
  output: {schema: AnalyzeSalesOutputSchema},
  prompt: `You are a sales data analyst. Analyze the following sales data and provide a summary and insights.

Sales Data: {{{salesData}}}

Provide a summary of the sales data, including total sales, best-selling product, and average order value.  Then, provide insights into the sales data, including trends, patterns, and recommendations for improvement.  Consider seasonality, product performance, and pricing strategies.

Format your response as a JSON object:
{
  "summary": "",
  "insights": ""
}
`,
});

const analyzeSalesFlow = ai.defineFlow(
  {
    name: 'analyzeSalesFlow',
    inputSchema: AnalyzeSalesInputSchema,
    outputSchema: AnalyzeSalesOutputSchema,
  },
  async input => {
    try {
      JSON.parse(input.salesData);
    } catch (e) {
      throw new Error('Invalid JSON sales data provided.');
    }
    const {output} = await prompt(input);
    return output!;
  }
);
