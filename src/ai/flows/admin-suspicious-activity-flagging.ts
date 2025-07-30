'use server';

/**
 * @fileOverview This flow is designed to flag potentially suspicious activities on the platform.
 *
 * - flagSuspiciousActivity - A function that flags suspicious activities.
 * - FlagSuspiciousActivityInput - The input type for the flagSuspiciousActivity function.
 * - FlagSuspiciousActivityOutput - The return type for the flagSuspiciousActivity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FlagSuspiciousActivityInputSchema = z.object({
  activityDetails: z.string().describe('Details of the activity to be checked for suspicious behavior.'),
});

export type FlagSuspiciousActivityInput = z.infer<typeof FlagSuspiciousActivityInputSchema>;

const FlagSuspiciousActivityOutputSchema = z.object({
  isSuspicious: z.boolean().describe('Whether the activity is deemed suspicious or not.'),
  reason: z.string().describe('The reason why the activity is flagged as suspicious, if applicable.'),
});

export type FlagSuspiciousActivityOutput = z.infer<typeof FlagSuspiciousActivityOutputSchema>;

export async function flagSuspiciousActivity(input: FlagSuspiciousActivityInput): Promise<FlagSuspiciousActivityOutput> {
  return flagSuspiciousActivityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'flagSuspiciousActivityPrompt',
  input: {schema: FlagSuspiciousActivityInputSchema},
  output: {schema: FlagSuspiciousActivityOutputSchema},
  prompt: `You are an AI assistant that helps administrators to identify suspicious activities on the platform.
  Based on the activity details provided, determine if the activity is suspicious or not and provide a reason for your determination.
  Activity Details: {{{activityDetails}}}
  \n  Respond in JSON format.
  `,
});

const flagSuspiciousActivityFlow = ai.defineFlow(
  {
    name: 'flagSuspiciousActivityFlow',
    inputSchema: FlagSuspiciousActivityInputSchema,
    outputSchema: FlagSuspiciousActivityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
