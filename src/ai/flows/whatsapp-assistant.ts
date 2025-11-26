
'use server';

/**
 * @fileOverview The AI brain for a customer-facing WhatsApp bot with negotiation skills.
 * 
 * - whatsappAssistant - The main flow to process incoming customer messages.
 * - WhatsAppAssistantInput - The input type for the flow.
 */

import { ai } from '@/ai/genkit';
import { findProducts } from '@/ai/flows/personalize-feed';
import { z } from 'genkit';

// Special marker for the bot to remain silent
const SILENCE_MARKER = '__SILENCE__';

export const WhatsAppAssistantInputSchema = z.object({
  message: z.string().describe('The incoming message from the user on WhatsApp.'),
  // We could add conversation history here in the future for more context
});
export type WhatsAppAssistantInput = z.infer<typeof WhatsAppAssistantInputSchema>;

// Define a new tool specific for the WhatsApp context that uses findProducts
const searchProductsForWhatsApp = ai.defineTool(
    {
      name: 'findProducts',
      description: 'Searches the marketplace for products based on a user\'s query. Use this whenever a user asks about available products, expresses interest in buying something, or asks about specific items like "gowns" or "shoes".',
      inputSchema: z.object({ query: z.string().describe('The user\'s search query for a product.') }),
      outputSchema: z.array(z.object({
          id: z.string().optional(),
          name: z.string(),
          initialPrice: z.number().describe('The starting price for negotiation.'),
          lastPrice: z.number().describe('The absolute lowest price the seller will accept. This is a secret internal-only price.'),
          description: z.string().optional(),
          stock: z.number().optional(),
      })),
    },
    async (input) => {
      console.log(`[Tool] Searching for products with query: ${input.query}`);
      // This is a bit of a hack. The `findProducts` tool returns a slightly different schema.
      // We'll call the underlying search function directly.
      const db = (await import('@/lib/firebase/admin')).getAdminFirestore();
      const productsRef = db.collection('products');
      const snapshot = await productsRef.get();

      if (snapshot.empty) {
          return [];
      }

      const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      const lowercasedTerm = input.query.toLowerCase();
      const filteredProducts = allProducts.filter(product => 
          product.name.toLowerCase().includes(lowercasedTerm) || 
          (product.description && product.description.toLowerCase().includes(lowercasedTerm)) ||
          (product.category && product.category.toLowerCase().includes(lowercasedTerm))
      );
      
      // Return the fields needed for negotiation
      return filteredProducts.map(({ id, name, initialPrice, lastPrice, description, stock }) => ({ id, name, initialPrice, lastPrice, description, stock }));
    }
);


// Define the main prompt for the WhatsApp assistant
const whatsAppAssistantPrompt = ai.definePrompt({
    name: 'whatsAppAssistantPrompt',
    input: { schema: WhatsAppAssistantInputSchema },
    tools: [searchProductsForWhatsApp],
    prompt: `You are a highly disciplined AI assistant for IKM Marketplace, a Nigerian online marketplace. You have two modes: Personal Greeting Mode and Business Handling Mode. Your default state is to be silent.

    **RULE 1: PERSONAL MESSAGES (VERY STRICT)**
    - You ONLY reply to initial greetings. Examples: "Hi", "Hello", "Good morning". Your response should be brief and polite (e.g., "Hello, how are you doing?", "I'm good, thanks.").
    - After the initial greeting exchange is complete, if the next message is personal, emotional, gossip, flirting, or irrelevant chat ("You ate today?", "Do you miss me?", "Send photos of you", "How's your day?"), you MUST remain silent. To do this, you will output only the special marker: ${SILENCE_MARKER}
    - DO NOT reply. DO NOT show attitude. DO NOT send any other message.

    **RULE 2: BUSINESS MESSAGES (YOUR ONLY ACTIVE STATE)**
    - You will switch from silence mode into "Business Handling Mode" ONLY when you detect a clear business intent.
    - **Activation Triggers:**
        - Product names ("gowns", "lace", "black shoe")
        - Price inquiries ("how much?", "what's the price?")
        - Variation inquiries ("size", "color", "length", "inches")
        - Delivery/location questions
        - Negotiation words ("last price", "too cost")
        - Action phrases ("show me", "send me", "I want to buy", "I want to order")
    - If a message is ambiguous or you are confused, you MUST default to silence. Output: ${SILENCE_MARKER}

    **RULE 3: BUSINESS HANDLING MODE WORKFLOW**
    1.  **Find Products:** If a user is asking for products, IMMEDIATELY use the 'findProducts' tool to search the database.
    2.  **Present Products:** If products are found, present them clearly. ALWAYS state the 'initialPrice'. Do not mention the 'lastPrice'. Use Nigerian Naira (₦) for prices.
    3.  **If No Products Found:** Politely inform the user you couldn't find the item and ask if they'd like to search for something else.
    4.  **Negotiate Smartly:**
        - When a customer objects to the price or offers a lower one, your negotiation is triggered.
        - Your goal is to get a price as close to the 'initialPrice' as possible. Do NOT immediately offer the 'lastPrice'.
        - Example: If initial is ₦10,000 and last is ₦8,000, and a customer offers ₦7,000, you must reject it and counter with a price like ₦9,500.
        - Persuade by mentioning product features from the description.
    5.  **Final Price:** The 'lastPrice' is your absolute floor. You are STRICTLY FORBIDDEN from offering a price below it. If negotiation reaches this point, you MUST state firmly: "This is the final price."
    6.  **Closing the Deal:** Once a price is agreed upon, provide clear payment instructions. (For now, state: "To complete your order, please make a payment of [Agreed Price] to our account. Let me know when you have made the payment, and I will confirm your order.")
    7.  **Rude Users:** If a user is rude, spammy, or clearly not serious, politely end the conversation (e.g., "It seems we can't agree on a price. Feel free to browse our other products. Have a great day!").

    ---
    Current User's Message: {{{message}}}
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
    console.log(`[Flow] Processing message: "${input.message}"`);
    
    // Generate the response from the AI model
    const llmResponse = await whatsAppAssistantPrompt(input);
    let output = llmResponse.output();

    if (output === undefined) {
        // If the model provides no response, default to silence.
        return SILENCE_MARKER;
    }

    // Check if the model decided to use a tool
    if (llmResponse.isToolRequest()) {
        console.log('[Flow] Tool request detected. Executing...');
        // Automatically execute the tool request and send the result back to the model
        const toolResponse = await llmResponse.executeTool();
        output = toolResponse.output() as string;
    }
    
    // Log the raw output before checking for silence marker
    console.log(`[Flow] Raw LLM Response: "${output}"`);

    // If the model's response is the silence marker, return it so the calling function knows not to reply.
    if (output?.trim() === SILENCE_MARKER) {
        console.log('[Flow] Silence marker detected. No reply will be sent.');
        return SILENCE_MARKER;
    }
    
    return output as string;
  }
);


// Wrapper function to be called from an API route
export async function whatsappAssistant(input: WhatsAppAssistantInput): Promise<string> {
  const result = await whatsAppAssistantFlow(input);
  
  // If the flow returns the silence marker, return an empty string to signify no reply.
  if (result === SILENCE_MARKER) {
    return '';
  }
  
  return result;
}
