

"use client";

import { usePathname } from "next/navigation";
import React, { useState, useTransition, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, User, Loader } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getProductDescription, getSalesAnalysis, getRiderEarningsSummary, getSuspiciousActivity, getPlatformRevenueSummary } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

type Message = {
  role: "user" | "assistant" | "system";
  content: React.ReactNode;
};

const buyerPrompts = ["🔍 Find a product for me", "📦 Track my order", "⚖️ Compare prices"];
const sellerPrompts = ["📈 Which product is my bestseller?", "📉 Which items are low in stock?", "💡 How can I improve my listings?"];
const riderPrompts = ["🗺️ Show profitable 'hotspot' areas now?", "⛽ Estimate fuel cost for this trip?", "⏰ What are today's peak hours?"];
const adminPrompts = ["📈 Summarize daily performance", "🚩 Flag suspicious activity", "⚠️ Check platform health"];
const productDetailPrompts = ["🤔 Any discounts for this item?", "⭐ Summarize the reviews", "↔️ Show me similar products"];
const cartPrompts = ["💸 Can I apply a coupon?", "🚚 Estimate delivery fee?", "🤔 Help me with my order."];
const checkoutPrompts = ["🔒 Is this payment secure?", "📜 What's the return policy?", "📞 Contact Support."];
const addProductPrompts = ["✍️ Help write a compelling title", "💡 Suggest a competitive price", "🖼️ What kind of images work best?"];
const activeDeliveryPrompts = ["🚧 Report traffic?", "💬 Send ETA update to buyer?", "🆘 I need help with this delivery."];
const adminApprovalsPrompts = ["✔️ Run automated background check?", "🔎 Flag any issues with these documents?", "💬 Send 'More Info Required' message."];
const orderHistoryPrompts = ["💬 I have an issue with an order", "📦 Track my ongoing order", "🧾 Get an invoice for this purchase."];
const salesHistoryPrompts = ["📈 Analyze my revenue this month", "💰 Which product is most profitable?", "📦 Print shipping label."];


export function CoPilotChat() {
  const pathname = usePathname();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const getPrompts = () => {
    if (pathname.startsWith("/admin/pending-approvals")) return adminApprovalsPrompts;
    if (pathname.startsWith("/rider/active-delivery")) return activeDeliveryPrompts;
    if (pathname.startsWith("/seller/add-product")) return addProductPrompts;
    if (pathname.startsWith("/seller/sales-history")) return salesHistoryPrompts;
    if (pathname.startsWith("/seller")) return sellerPrompts;
    if (pathname.startsWith("/rider")) return riderPrompts;
    if (pathname.startsWith("/admin")) return adminPrompts;
    if (pathname.startsWith("/buyer/product/")) return productDetailPrompts;
    if (pathname.startsWith("/buyer/cart")) return cartPrompts;
    if (pathname.startsWith("/buyer/checkout")) return checkoutPrompts;
    if (pathname.startsWith("/buyer/orders")) return orderHistoryPrompts;
    return buyerPrompts;
  };

  const handlePromptClick = (prompt: string) => {
    setMessages(prev => [...prev, { role: "user", content: prompt }]);
    
    startTransition(async () => {
      try {
        let response: React.ReactNode = "I'm sorry, I can't help with that yet.";
        
        switch (prompt) {
          case "📈 Analyze my sales":
            response = await getSalesAnalysis();
            break;
          case "💵 Summarize my earnings":
            response = await getRiderEarningsSummary({ riderId: 'rider-123', period: 'last week' });
            break;
          case "💹 Summarize platform revenue":
          case "📈 Summarize daily performance":
            response = await getPlatformRevenueSummary({ timePeriod: 'today' });
            break;
          case "🚩 Flag suspicious activity":
            const activity = await getSuspiciousActivity({ activityDetails: 'Multiple login failures for user "test-user" followed by a successful login from a new IP address.' });
            response = `${activity.isSuspicious ? 'Suspicious Activity Flagged:' : 'Activity not suspicious.'} ${activity.reason}`;
            break;
          case "✍️ Help write a product description":
          case "✍️ Help write a compelling title":
            setCurrentAction(prompt);
            setFormModalOpen(true);
            return; // Don't add a default response yet
          default:
            // For prompts not yet implemented
            setMessages(prev => [...prev, { role: "assistant", content: response }]);
            return;
        }

        setMessages(prev => [...prev, { role: "assistant", content: response }]);
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
    const fields = Array.from(formData.entries()).map(([key, value]) => {
        userMessageContent += `${key}: "${value}", `;
        return {key, value};
    });
    userMessageContent = userMessageContent.slice(0, -2);
    
    setMessages(prev => [...prev, {role: 'user', content: userMessageContent}]);

    startTransition(async () => {
        try {
            let response: React.ReactNode = "I'm sorry, I can't help with that yet.";
            if (prompt === "✍️ Help write a product description" || prompt === "✍️ Help write a compelling title") {
                const productName = formData.get('productName') as string;
                const productCategory = formData.get('productCategory') as string;
                const keyFeatures = formData.get('keyFeatures') as string;
                const targetAudience = formData.get('targetAudience') as string;
                response = await getProductDescription({ productName, productCategory, keyFeatures, targetAudience });
            }
            setMessages(prev => [...prev, { role: "assistant", content: response as string }]);
        } catch (error) {
            toast({ variant: 'destructive', title: 'An error occurred', description: (error as Error).message });
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
        }
    });
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const suggestedPrompts = getPrompts();

  const getFormForAction = (action: string | null) => {
    switch(action) {
        case '✍️ Help write a product description':
        case '✍️ Help write a compelling title':
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
                    I'm your AI assistant. How can I help you today?
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
                <div className={`rounded-lg px-4 py-2 ${m.role === "user" ? "bg-muted" : "bg-transparent"}`}>
                  {m.content}
                </div>
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
            if (!input.trim()) return;
            handlePromptClick(input);
            setInput("");
          }}
        >
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question or type a command..."
              className="pr-12"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!input.trim()) return;
                  handlePromptClick(input);
                  setInput("");
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
