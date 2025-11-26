
import { ai } from '@/ai/genkit';
import { findProducts } from '@/ai/flows/personalize-feed';
import { z } from 'genkit';
import type { Product } from '@/lib/firebase/firestore/products';

// Export Zod schemas and tools BEFORE the 'use server' directive
export const CopilotAssistantInputSchema = z.object({
  message: z.string().describe('The incoming message from the user in the chat widget.'),
});


'use server';

/**
 * @fileOverview The AI brain for the website's Co-Pilot widget.
 * 
 * - copilotAssistant - The main flow to process incoming customer messages from the widget.
 * - CopilotAssistantInput - The input type for the flow.
 */

export type CopilotAssistantInput = z.infer<typeof CopilotAssistantInputSchema>;

const copilotAssistantResponseSchema = z.union([
    z.object({
        type: z.literal('products'),
        data: z.array(z.object({
            id: z.string(),
            name: z.string(),
            price: z.number(),
            imageUrl: z.string().optional(),
        }))
    }),
    z.object({
        type: z.literal('message'),
        data: z.string()
    })
]);


// Define the main prompt for the Co-Pilot assistant
const copilotAssistantPrompt = ai.definePrompt({
    name: 'copilotAssistantPrompt',
    input: { schema: CopilotAssistantInputSchema },
    tools: [findProducts],
    prompt: `You are a friendly and helpful shopping assistant for IKM Marketplace, an online marketplace for Nigerian artisans.

    Your primary goals are:
    1.  **Be Conversational:** Greet users, answer their questions about the marketplace, and maintain a friendly tone.
    2.  **Help Users Find Products:** If a user expresses any intent to find or buy something, immediately use the 'findProducts' tool to search for relevant items.
    3.  **Present Products:** If the tool finds products, the system will show them to the user. You don't need to say anything else.
    4.  **Handle No Results:** If the tool returns no products, or if the user's request is too vague, politely inform them you couldn't find what they were looking for and suggest they try a different search or browse all products.

    Examples:
    - User: "Hi" -> You: "Hello! Welcome to IKM Marketplace. How can I help you today?"
    - User: "I'm looking for black shoes" -> You: (Use findProducts tool with query: "black shoes")
    - User: "What is IKM?" -> You: "IKM Marketplace is a platform that connects you with talented Nigerian artisans and their unique, handmade products."
    - User: "Do you sell food?" -> You: (Use findProducts tool with query: "food")

    ---
    Current User's Message: {{{message}}}
    `,
});

// Define the main flow that orchestrates the logic
export const copilotAssistantFlow = ai.defineFlow(
  {
    name: 'copilotAssistantFlow',
    inputSchema: CopilotAssistantInputSchema,
    outputSchema: copilotAssistantResponseSchema,
  },
  async (input) => {
    console.log(`[Co-Pilot Flow] Processing message: "${input.message}"`);
    
    const llmResponse = await copilotAssistantPrompt(input);
    
    if (llmResponse.isToolRequest()) {
        const toolResponse = await llmResponse.executeTool();
        const toolOutput = toolResponse.output() as Product[];
        
        if (!toolOutput || toolOutput.length === 0) {
            return { type: 'message', data: "I couldn't find any products matching your search. Try being more specific or browse all products." };
        }

        const productsForChat = toolOutput.map(p => ({
            id: p.id!,
            name: p.name,
            price: p.initialPrice,
            imageUrl: p.imageUrl
        }));
        
        return { type: 'products', data: productsForChat };
    }
    
    return { type: 'message', data: llmResponse.output() as string };
  }
);


// Wrapper function to be called from the client component
export async function copilotAssistant(input: CopilotAssistantInput): Promise<{type: 'products' | 'message', data: any}> {
  return await copilotAssistantFlow(input);
}
