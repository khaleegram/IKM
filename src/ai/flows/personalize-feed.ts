
'use server';

/**
 * @fileOverview Personalizes a user's product feed based on their interests.
 *
 * - findProducts - A Genkit tool to search for products in Firestore.
 * - personalizeFeed - The main flow to process user interests and return products.
 * - PersonalizeFeedInput - The input type for the personalizeFeed flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAdminFirestore } from '@/lib/firebase/admin';
import type { Product } from '@/lib/firebase/firestore/products';

export const PersonalizeFeedInputSchema = z.object({
  interests: z.string().describe('The user\'s stated interests, like "handmade jewelry" or "men\'s fashion".'),
});
export type PersonalizeFeedInput = z.infer<typeof PersonalizeFeedInputSchema>;

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
          price: z.number(),
          imageUrl: z.string().optional(),
          sellerId: z.string().optional(),
      })),
    },
    async (input) => {
        const db = getAdminFirestore();
        const productsRef = db.collection('products');
        const snapshot = await productsRef.get();

        if (snapshot.empty) {
            return [];
        }

        const allProducts: Product[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

        const lowercasedTerm = input.query.toLowerCase();
        const filteredProducts = allProducts.filter(product => 
            product.name.toLowerCase().includes(lowercasedTerm) || 
            (product.description && product.description.toLowerCase().includes(lowercasedTerm)) ||
            (product.category && product.category.toLowerCase().includes(lowercasedTerm))
        ).slice(0, 4); // Return a max of 4 products for the chat

        // Map to the schema, using initialPrice as price
        return filteredProducts.map(({ id, name, description, initialPrice, imageUrl, sellerId }) => ({
            id,
            name,
            description,
            price: initialPrice,
            imageUrl,
            sellerId,
        }));
    }
);


// Define the main prompt for the personalization flow
const personalizeFeedPrompt = ai.definePrompt({
    name: 'personalizeFeedPrompt',
    input: { schema: PersonalizeFeedInputSchema },
    tools: [findProducts],
    prompt: `You are a personal shopping assistant for IKM Marketplace. A user has told you their interests. Your goal is to find relevant products for them.

    1.  Use the 'findProducts' tool to search for products based on the user's interests.
    2.  The tool will return a list of products. You do not need to say anything else. The system will display the products.
    3.  If the tool returns no products, simply tell the user: "I couldn't find any products matching your interests. Try being more specific or browse all products."

    User Interests: {{{interests}}}
    `,
});

// Define the main flow that orchestrates the logic
export const personalizeFeedFlow = ai.defineFlow(
  {
    name: 'personalizeFeedFlow',
    inputSchema: PersonalizeFeedInputSchema,
    outputSchema: z.any(), // Can be string or product array
  },
  async (input) => {
    const llmResponse = await personalizeFeedPrompt(input);
    
    if (llmResponse.isToolRequest()) {
        const toolResponse = await llmResponse.executeTool();
        // Return the structured data from the tool
        return toolResponse.output();
    }
    
    // If it's not a tool request, it's a text message (e.g., "no products found")
    return llmResponse.output();
  }
);


// Wrapper function to be called from the client
export async function personalizeFeed(input: PersonalizeFeedInput): Promise<any> {
  return await personalizeFeedFlow(input);
}
