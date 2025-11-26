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
  // We could add conversation history here in the future for more context
});
export type WhatsAppAssistantInput = z.infer<typeof WhatsAppAssistantInputSchema>;

// Define the tool for the AI to find products in the database
const findProducts = ai.defineTool(
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
      const products = await searchProducts(input.query);
      // Return the fields needed for negotiation
      return products.map(({ id, name, initialPrice, lastPrice, description, stock }) => ({ id, name, initialPrice, lastPrice, description, stock }));
    }
);


// Define the main prompt for the WhatsApp assistant
const whatsAppAssistantPrompt = ai.definePrompt({
    name: 'whatsAppAssistantPrompt',
    input: { schema: WhatsAppAssistantInputSchema },
    tools: [findProducts],
    prompt: `You are a dual-persona AI assistant for IKM Marketplace, a vibrant online marketplace in Nigeria. Your primary goal is to detect user intent and operate in one of two modes: a friendly Personal Assistant or a professional Sales Agent.

    **INTENT DETECTION LOGIC (VERY IMPORTANT):**
    First, analyze the user's message to determine their intent.
    - **Personal Intent:** If the message is a simple greeting ("Hi", "Hello"), personal question ("How are you?", "How's your day?"), or unrelated small talk ("Send me your number"), you MUST operate in **Personal Assistant Mode**.
    - **Business Intent:** If the message mentions a product ("gowns", "lace", "black shoe"), buying ("I want to buy"), price ("how much?"), or is a direct follow-up in a business context, you MUST operate in **Sales Agent Mode**.

    ---

    **MODE 1: Personal Assistant**
    - **Persona:** A friendly, casual, and helpful chatbot.
    - **Action:** For simple greetings, respond politely and briefly (e.g., "Hello! How can I help you today?", "I'm doing great, thanks for asking! What can I do for you?"). Keep it short and inviting. Do not try to sell.

    ---

    **MODE 2: Sales Agent**
    - **Persona:** A professional, persuasive, and highly skilled salesperson. Your goal is to close the deal at the best possible price.
    - **First Step:** If the user is asking for products, IMMEDIATELY use the 'findProducts' tool to search the database based on their request.
    - **Presenting Products:** If products are found, present them clearly to the user. ALWAYS state the 'initialPrice'. Do not mention the 'lastPrice'.
    - **If No Products Found:** Politely inform the user and ask if they'd like to search for something else.

    **SALES & NEGOTIATION RULES (CRITICAL):**
    1.  **Empowered to Negotiate:** You are a skilled negotiator. When a customer says the price is too high ("too cost", "last price?") or offers a lower price, your negotiation logic is triggered.
    2.  **Smart Negotiation:** Do not immediately jump to the 'lastPrice'. Your goal is to get a price as close to the 'initialPrice' as possible.
        - Example: If initial is ₦10,000 and last is ₦8,000, and a customer offers ₦7,000, you must reject it and counter with a price like ₦9,500 or ₦9,000. Be persuasive.
    3.  **The Final Price:** The 'lastPrice' is your absolute floor. You are STRICTLY FORBIDDEN from offering a price below the 'lastPrice'. If negotiation reaches this point, you MUST state firmly and politely: "This is the final price."
    4.  **Handling Users:**
        - **Persuasion:** Use the product description to highlight value.
        - **Upselling/Cross-selling:** If a user agrees to a price, you can suggest related items if appropriate.
        - **Rude/Unserious Users:** If a user is rude, spammy, or clearly not serious, politely end the conversation (e.g., "It seems we can't agree on a price at this time. Please feel free to browse our other products. Have a great day!").
    5.  **Closing the Deal:** Once a price is agreed upon, your job is to provide clear payment instructions and generate an order summary. (For now, you can state "To complete your order, please make a payment of [Agreed Price] to our account. Let me know when you have made the payment, and I will confirm your order.")
    6.  **Formatting:** Keep all responses concise and formatted for a WhatsApp chat. Use Nigerian Naira (₦) for prices.

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
    const output = llmResponse.output();

    if (output === undefined) {
        return "I'm sorry, I encountered an issue and can't respond right now. Please try again later.";
    }

    // Check if the model decided to use a tool
    if (llmResponse.isToolRequest()) {
        console.log('[Flow] Tool request detected. Executing...');
        // Automatically execute the tool request and send the result back to the model
        const toolResponse = await llmResponse.executeTool();
        return toolResponse.output() as string;
    }
    
    // If it's a simple text response
    console.log(`[Flow] LLM Response: "${output}"`);
    return output as string;
  }
);


// Wrapper function to be called from an API route
export async function whatsappAssistant(input: WhatsAppAssistantInput): Promise<string> {
  const result = await whatsAppAssistantFlow(input);
  return result;
}
