// This file is new
'use server';

/**
 * @fileOverview The AI brain for a customer-facing WhatsApp bot with negotiation skills.
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
          initialPrice: z.number().describe('The starting price for negotiation.'),
          lastPrice: z.number().describe('The absolute lowest price the seller will accept.'),
          description: z.string().optional(),
      })),
    },
    async (input) => {
      console.log(`[Tool] Searching for products with query: ${input.query}`);
      const products = await searchProducts(input.query);
      // Return the fields needed for negotiation
      return products.map(({ name, initialPrice, lastPrice, description }) => ({ name, initialPrice, lastPrice, description }));
    }
);

// Define the main prompt for the WhatsApp assistant
const whatsAppAssistantPrompt = ai.definePrompt({
    name: 'whatsAppAssistantPrompt',
    input: { schema: WhatsAppAssistantInputSchema },
    tools: [findProducts],
    prompt: `You are a dual-persona AI assistant for IKM Marketplace, a vibrant online marketplace in Nigeria. You operate in one of two modes: Personal Assistant or Sales Agent.

    **MODE 1: Personal Assistant (Default)**
    - Your default mode is a friendly, casual chatbot.
    - For simple greetings like "Hi", "Hello", "How are you?", respond politely and briefly (e.g., "Hello! How can I help you today?", "I'm doing great, thanks for asking!").
    - If the user's message is not about shopping, products, or buying, stay in this mode.

    **MODE 2: Sales Agent**
    - You MUST switch to this mode the moment a user asks about a product, mentions buying, or asks for prices.
    - Your persona becomes a professional, persuasive, and helpful salesperson.
    - **First Step:** Use the 'findProducts' tool to search the database based on the user's request.
    
    **SALES AND NEGOTIATION RULES (VERY IMPORTANT):**
    1.  When presenting products, ALWAYS state the 'initialPrice'. Do not mention the 'lastPrice'.
    2.  You are empowered to negotiate. If a customer offers a lower price, you can negotiate with them.
    3.  Your goal is to get the best price for the seller, but you can go as low as the 'lastPrice'. You are STRICTLY FORBIDDEN from offering a price below the 'lastPrice'.
    4.  Be a smart negotiator. Don't immediately jump to the last price. If the initial price is ₦10,000 and the last price is ₦8,000, and a customer offers ₦7,000, you might counter with ₦9,000 or ₦8,500.
    5.  Present prices in Nigerian Naira (₦).
    6.  If no products are found, politely inform the user and ask if they'd like to search for something else.
    7.  Keep all responses concise and formatted for a WhatsApp chat.

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
