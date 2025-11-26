// This file is new
'use server';

/**
 * @fileOverview The AI brain for a customer-facing WhatsApp bot.
 * 
 * - whatsappAssistant - The main flow to process incoming customer messages.
 * - WhatsAppAssistantInput - The input type for the flow.
 */

import { ai } from '@/ai/genkit';
import { searchProducts } from '@/lib/actions';
import { z } from 'genkit';

export const WhatsAppAssistantInputSchema = z.object({
  message: z.string().describe('The incoming message from the user on WhatsApp.'),
});
export type WhatsAppAssistantInput = z.infer<typeof WhatsAppAssistantInputSchema>;

// Define the tool for the AI to find products in the database
const findProducts = ai.defineTool(
    {
      name: 'findProducts',
      description: 'Searches the marketplace for products based on a user\'s query. Use this whenever a user asks about available products or expresses interest in buying something.',
      inputSchema: z.object({ query: z.string().describe('The user\'s search query for a product.') }),
      outputSchema: z.array(z.object({
          name: z.string(),
          price: z.number(),
          description: z.string().optional(),
      })),
    },
    async (input) => {
      console.log(`[Tool] Searching for products with query: ${input.query}`);
      const products = await searchProducts(input.query);
      return products.map(({ name, price, description }) => ({ name, price, description }));
    }
);

// Define the main prompt for the WhatsApp assistant
const whatsAppAssistantPrompt = ai.definePrompt({
    name: 'whatsAppAssistantPrompt',
    input: { schema: WhatsAppAssistantInputSchema },
    tools: [findProducts],
    prompt: `You are a friendly and helpful WhatsApp shopping assistant for IKM Marketplace, an online marketplace in Nigeria.

    Your goal is to help users find products they are looking for.

    - If the user asks a question about products or expresses intent to buy, use the 'findProducts' tool to search the database.
    - Based on the tool's results, present the products to the user in a clear and friendly format. Display the name and the price in Nigerian Naira (₦).
    - If no products are found, politely inform the user and ask if they would like to search for something else.
    - If the user asks a general question, answer it politely. Keep responses concise and suitable for WhatsApp chat.

    User's message: {{{message}}}
    `,
});

// Define the main flow that orchestrates the logic
export const whatsAppAssistantFlow = ai.defineFlow(
  {
    name: 'whatsAppAssistantFlow',
    inputSchema: WhatsAppAssistantInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await whatsAppAssistantPrompt(input);
    
    if (output === undefined) {
        return "I'm sorry, I encountered an issue and can't respond right now. Please try again later.";
    }
    
    // Check if the output is structured tool output or a simple text response
    if (typeof output === 'string') {
        return output;
    }

    // In a more advanced bot, you would handle tool requests and responses here.
    // For now, we assume the model returns a text response directly.
    // This part of genkit returns a structured object when a tool call is recommended.
    // For this implementation, we will rely on the text response that summarizes the tool call result.
    console.log("Output was not a simple string:", JSON.stringify(output, null, 2));
    
    // As a fallback, we try to find a text part in the complex output
    if(Array.isArray(output) && output.length > 0 && output[0].text) {
        return output.map(part => part.text).join('\n');
    }
    
    return "I'm not sure how to help with that. Can I help you find a product?";
  }
);


// Wrapper function to be called from an API route
export async function whatsappAssistant(input: WhatsAppAssistantInput): Promise<string> {
  const result = await whatsAppAssistantFlow(input);
  return result;
}
