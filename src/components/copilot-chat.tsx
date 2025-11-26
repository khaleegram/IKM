
"use client";

import { usePathname } from "next/navigation";
import React, { useState, useTransition, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, User, Loader, ShoppingCart } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getProductDescription, suggestStoreName } from "@/lib/actions";
import { personalizeFeed } from "@/ai/flows/personalize-feed";
import { copilotAssistant } from "@/ai/flows/copilot-assistant";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

type ChatProduct = {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
}

type Message = {
  role: "user" | "assistant";
  content: React.ReactNode;
};

type ProductMessage = {
    role: "assistant";
    content: ChatProduct[];
}

const sellerDashboardPrompts = ["📈 How do I get my first sale?", "💡 Suggest a name for my store", "💰 How much should I charge for delivery?"];
const sellerProductsPrompts = ["✍️ Help write a compelling product description", "🖼️ What kind of images work best for [Product]?", "⚖️ How should I price this item?"];
const buyerCheckoutPrompts = ["🚚 What are the delivery options?", "🔒 Is my payment secure?", "🤔 Can I change my order?"];
const defaultPrompts = ["🔭 Show me something new", "🔥 What's trending right now?", "🛍️ Personalize my feed."];


export function CoPilotChat() {
  const pathname = usePathname();
  const { toast } = useToast();
  const [messages, setMessages] = useState<(Message | ProductMessage)[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [isAwaitingInput, setAwaitingInput] = useState(false);
  const [personalizationTopic, setPersonalizationTopic] = useState('');


  const formRef = useRef<HTMLFormElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const getPrompts = () => {
    if (pathname.startsWith("/seller/products")) return sellerProductsPrompts;
    if (pathname.startsWith("/seller")) return sellerDashboardPrompts;
    if (pathname.startsWith("/cart") || pathname.startsWith("/checkout")) return buyerCheckoutPrompts;
    return defaultPrompts;
  };

  const handlePromptClick = (prompt: string) => {
    const newUserMessage = { role: "user", content: prompt };
    setMessages(prev => [...prev, newUserMessage]);
    
    startTransition(async () => {
      try {
        const action = prompt.toLowerCase();

        if (action.includes("help write") && action.includes("product description")) {
            setCurrentAction("✍️ Help write a compelling product description");
            setFormModalOpen(true);
            return;
        }

        if (action.includes("suggest a name for my store")) {
            setCurrentAction("💡 Suggest a name for my store");
            setFormModalOpen(true);
            return;
        }

        if (action.includes("personalize my feed")) {
            const response = "Of course! What are you interested in? For example: 'handmade jewelry', 'men\\'s fashion', or 'traditional art'.";
            setAwaitingInput(true);
            setPersonalizationTopic('personalize_feed');
            setMessages(prev => [...prev, { role: "assistant", content: response }]);
            return;
        }

        // For all other general prompts, call the main assistant
        const results = await copilotAssistant({ message: prompt });
        if (results.type === 'products') {
            setMessages(prev => [...prev, { role: 'assistant', content: results.data }]);
        } else {
            setMessages(prev => [...prev, { role: 'assistant', content: results.data }]);
        }

      } catch (error) {
        toast({ variant: 'destructive', title: 'An error occurred', description: (error as Error).message });
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
      }
    });
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const prompt = currentAction;
    setFormModalOpen(false);
    setCurrentAction(null);

    let userMessageContent = `For my product, `;
    Array.from(formData.entries()).forEach(([key, value]) => {
        userMessageContent += `${key}: "${value}", `;
    });
    userMessageContent = userMessageContent.slice(0, -2);
    
    setMessages(prev => [...prev, {role: 'user', content: userMessageContent}]);

    startTransition(async () => {
        try {
            let response: React.ReactNode = "I'm sorry, I can't help with that yet.";
            if (prompt === "✍️ Help write a compelling product description") {
                const productName = formData.get('productName') as string;
                const productCategory = formData.get('productCategory') as string;
                const keyFeatures = formData.get('keyFeatures') as string;
                const targetAudience = formData.get('targetAudience') as string;
                response = await getProductDescription({ productName, productCategory, keyFeatures, targetAudience });
            }
             if (prompt === "💡 Suggest a name for my store") {
                const keywords = formData.get('keywords') as string;
                const result = await suggestStoreName({ keywords });
                response = (
                    <div>
                        <p>Here are a few store name suggestions:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            {result.storeNames.map((name: string, index: number) => <li key={index}>{name}</li>)}
                        </ul>
                    </div>
                );
            }
            setMessages(prev => [...prev, { role: "assistant", content: response as string }]);
        } catch (error) {
            toast({ variant: 'destructive', title: 'An error occurred', description: (error as Error).message });
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
        }
    });
  };

  const handleInputSubmit = (text: string) => {
    if (!text.trim()) return;

    const newUserMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, newUserMessage]);
    setInput('');

    startTransition(async () => {
        try {
            let results;
            if (isAwaitingInput && personalizationTopic === 'personalize_feed') {
                setAwaitingInput(false);
                setPersonalizationTopic('');
                results = await personalizeFeed({ interests: text });
            } else {
                results = await copilotAssistant({ message: text });
            }

            if (results.type === 'products' && Array.isArray(results.data) && results.data.length > 0) {
                 setMessages(prev => [...prev, { role: "assistant", content: results.data }]);
            } else if (results.type === 'message') {
                setMessages(prev => [...prev, { role: "assistant", content: results.data }]);
            } else {
                 setMessages(prev => [...prev, { role: "assistant", content: "I couldn't find anything matching that. Try another search?" }]);
            }
        } catch (error) {
             toast({ variant: 'destructive', title: 'An error occurred', description: (error as Error).message });
             setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong while searching." }]);
        }
    });
  }


  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollDiv = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollDiv) {
          scrollDiv.scrollTo({ top: scrollDiv.scrollHeight, behavior: 'smooth' });
        }
    }
  }, [messages]);

  const suggestedPrompts = getPrompts();

  const getFormForAction = (action: string | null) => {
    switch(action) {
        case '✍️ Help write a compelling product description':
            return (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name</Label>
                  <Input id="productName" name="productName" placeholder="e.g., Artisan Leather Wallet" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productCategory">Product Category</Label>
                  <Input id="productCategory" name="productCategory" placeholder="e.g., Accessories" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keyFeatures">Key Features (comma-separated)</Label>
                  <Textarea id="keyFeatures" name="keyFeatures" placeholder="e.g., Hand-stitched, Full-grain leather, RFID blocking" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Input id="targetAudience" name="targetAudience" placeholder="e.g., Design-conscious professionals" />
                </div>
              </div>
            );
        case '💡 Suggest a name for my store':
            return (
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="keywords">Describe your store in a few keywords</Label>
                        <Input id="keywords" name="keywords" placeholder="e.g., handmade jewelry, Nigerian crafts" />
                    </div>
                </div>
            )
        default: 
            return null;
    }
  }


  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-headline">
                    <Sparkles className="text-accent" /> IKM Co-Pilot
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    I'm your AI assistant. How can I help you manage your store?
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suggestedPrompts.map((prompt) => (
                      <Button
                        key={prompt}
                        variant="outline"
                        className="h-auto whitespace-normal text-left justify-start"
                        onClick={() => handlePromptClick(prompt)}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 text-sm ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                    <Bot size={20} />
                  </span>
                )}
                {Array.isArray(m.content) ? (
                    <div className="w-full">
                        <p className="mb-2 text-muted-foreground">Here's what I found for you:</p>
                        <div className="grid grid-cols-2 gap-2">
                            {(m as ProductMessage).content.map((product: ChatProduct) => (
                                <Card key={product.id} className="overflow-hidden">
                                     <Link href={`/product/${product.id}`} target="_blank">
                                        <Image src={product.imageUrl || `https://picsum.photos/seed/${product.id}/200/200`} alt={product.name} width={200} height={200} className="w-full aspect-square object-cover" />
                                    </Link>
                                    <CardHeader className="p-2">
                                        <CardTitle className="text-sm font-medium line-clamp-2">{product.name}</CardTitle>
                                    </CardHeader>
                                    <CardFooter className="p-2 flex justify-between items-center">
                                        <p className="text-xs font-bold">₦{product.price.toLocaleString()}</p>
                                        <Button size="icon" variant="ghost" className="h-6 w-6">
                                            <ShoppingCart className="h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                ) : (
                     <div className={`rounded-lg px-4 py-2 ${m.role === "user" ? "bg-muted" : "bg-transparent"}`}>
                        {m.content}
                    </div>
                )}
                {m.role === "user" && (
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground">
                    <User size={20} />
                  </span>
                )}
              </div>
            ))}
            {isPending && (
              <div className="flex gap-3 text-sm">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                  <Bot size={20} />
                </span>
                <div className="rounded-lg px-4 py-2 flex items-center">
                  <Loader className="animate-spin" size={20} />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleInputSubmit(input);
          }}
        >
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isAwaitingInput ? "e.g., 'Handmade jewelry'" : "Ask a question..."}
              className="pr-12"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleInputSubmit(input);
                }
              }}
            />
            <Button type="submit" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" disabled={isPending || !input.trim()}>
              <Send size={16} />
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={isFormModalOpen} onOpenChange={setFormModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentAction}</DialogTitle>
            <DialogDescription>Please provide the following details.</DialogDescription>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleFormSubmit}>
            {getFormForAction(currentAction)}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setFormModalOpen(false)}>Cancel</Button>
              <Button type="submit">Generate</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
