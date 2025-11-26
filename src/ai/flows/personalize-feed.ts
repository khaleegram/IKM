
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { searchProducts } from '@/lib/actions';
import type { Product } from '@/lib/firebase/firestore/products';

// Export Zod schemas and tools BEFORE the 'use server' directive
export const PersonalizeFeedInputSchema = z.object({
  interests: z.string().describe('The user\'s stated interests, like "handmade jewelry" or "men\'s fashion".'),
});

// Tool for the AI to find products in the database
export const findProducts = ai.defineTool(
    {
      name: 'findProducts',
      description: 'Searches the marketplace for products based on a user\'s query. Use this whenever a user asks about available products, expresses interest in buying something, or mentions product categories or keywords.',
      inputSchema: z.object({ query: z.string().describe('The user\'s search query for a product.') }),
      outputSchema: z.array(z.object({
          id: z.string().optional(),
          name: z.string(),
          description: z.string().optional(),
          initialPrice: z.number(),
          imageUrl: z.string().optional(),
          sellerId: z.string().optional(),
          category: z.string().optional(),
      })),
    },
    async (input) => {
        console.log(`[Tool] Searching for products with query: ${input.query}`);
        const products = await searchProducts(input.query);
        // Map to the schema, ensuring `price` is not included as it is client-side only
        return products.map(({ id, name, description, initialPrice, imageUrl, sellerId, category }) => ({
            id,
            name,
            description,
            initialPrice,
            imageUrl,
            sellerId,
            category,
        }));
    }
);

'use server';

/**
 * @fileOverview Personalizes a user's product feed based on their interests.
 *
 * - findProducts - A Genkit tool to search for products in Firestore.
 * - personalizeFeed - The main flow to process user interests and return products.
 * - PersonalizeFeedInput - The input type for the personalizeFeed flow.
 */

export type PersonalizeFeedInput = z.infer<typeof PersonalizeFeedInputSchema>;

const personalizeFeedResponseSchema = z.union([
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

// Define the main prompt for the personalization flow
const personalizeFeedPrompt = ai.definePrompt({
    name: 'personalizeFeedPrompt',
    input: { schema: PersonalizeFeedInputSchema },
    tools: [findProducts],
    prompt: `You are a personal shopping assistant for IKM Marketplace. A user has told you their interests. Your goal is to find relevant products for them.

    1.  Use the 'findProducts' tool to search for products based on the user's interests.
    2.  The tool will return a list of products. The system will handle displaying these products, so you do not need to say anything further.
    3.  If the tool returns no products, simply tell the user: "I couldn't find any products matching your interests. Try being more specific or browse all products."

    User Interests: {{{interests}}}
    `,
});

// Define the main flow that orchestrates the logic
export const personalizeFeedFlow = ai.defineFlow(
  {
    name: 'personalizeFeedFlow',
    inputSchema: PersonalizeFeedInputSchema,
    outputSchema: personalizeFeedResponseSchema,
  },
  async (input) => {
    const llmResponse = await personalizeFeedPrompt(input);
    
    if (llmResponse.isToolRequest()) {
        const toolResponse = await llmResponse.executeTool();
        const toolOutput = toolResponse.output() as Product[];
        
        // Map the full product data to the simplified schema for the chat response
        const productsForChat = toolOutput.map(p => ({
            id: p.id!,
            name: p.name,
            price: p.initialPrice, // Use initialPrice for display
            imageUrl: p.imageUrl
        }));
        
        return { type: 'products', data: productsForChat };
    }
    
    // If it's not a tool request, it's a text message (e.g., "no products found")
    return { type: 'message', data: llmResponse.output() as string };
  }
);


// Wrapper function to be called from the client
export async function personalizeFeed(input: PersonalizeFeedInput): Promise<{type: 'products' | 'message', data: any}> {
  return await personalizeFeedFlow(input);
}
