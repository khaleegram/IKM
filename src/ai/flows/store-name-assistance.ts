
'use server';

/**
 * @fileOverview Helps sellers come up with a name for their store.
 *
 * - suggestStoreName - A function that generates store name ideas.
 * - SuggestStoreNameInput - The input type for the suggestStoreName function.
 * - SuggestStoreNameOutput - The return type for the suggestStoreName function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestStoreNameInputSchema = z.object({
  keywords: z.string().describe('A few keywords describing the store or its products.'),
});
export type SuggestStoreNameInput = z.infer<
  typeof SuggestStoreNameInputSchema
>;

const SuggestStoreNameOutputSchema = z.object({
  storeNames: z.array(z.string()).describe('An array of 5 creative and catchy store name suggestions.'),
});
export type SuggestStoreNameOutput = z.infer<
  typeof SuggestStoreNameOutputSchema
>;

export async function suggestStoreName(
  input: SuggestStoreNameInput
): Promise<SuggestStoreNameOutput> {
  return suggestStoreNameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestStoreNamePrompt',
  input: {schema: SuggestStoreNameInputSchema},
  output: {schema: SuggestStoreNameOutputSchema},
  prompt: `You are a branding expert who excels at creating memorable and catchy store names.

  Based on the following keywords, generate 5 unique and brandable store name ideas. The names should be suitable for an online marketplace in Nigeria.

  Keywords: {{{keywords}}}
  `,
});

const suggestStoreNameFlow = ai.defineFlow(
  {
    name: 'suggestStoreNameFlow',
    inputSchema: SuggestStoreNameInputSchema,
    outputSchema: SuggestStoreNameOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
