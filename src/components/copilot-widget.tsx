"use client";

import { Bot } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CoPilotChat } from "@/components/copilot-chat";

export function CoPilotWidget() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          size="icon"
          aria-label="Open AI Co-Pilot"
        >
          <Bot size={28} />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[540px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="font-headline">IKM Co-Pilot</SheetTitle>
        </SheetHeader>
        <CoPilotChat />
      </SheetContent>
    </Sheet>
  );
}
