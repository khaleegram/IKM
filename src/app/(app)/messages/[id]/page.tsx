
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock data, in a real app you'd fetch this based on params.id
const chatPartner = {
  name: 'KicksRepublic',
  avatar: 'https://placehold.co/100x100.png',
  hint: 'logo business'
};

const messages = [
  { from: 'them', text: 'Hi there! I saw you were interested in the Classic Leather Watch. Do you have any questions about it?' },
  { from: 'me', text: 'Yes, actually. I was wondering about the materials. Is it genuine leather?' },
  { from: 'them', text: "Absolutely! It's made from high-quality, full-grain leather. Very durable and gets better with age." },
  { from: 'me', text: 'Great to hear. And what about shipping to Abuja?' },
];

export default function ChatInterfacePage({ params }: { params: { id: string } }) {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 bg-background border-b flex items-center gap-4 sticky top-0 z-10">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-9 w-9">
          <AvatarImage src={chatPartner.avatar} alt={chatPartner.name} data-ai-hint={chatPartner.hint} />
          <AvatarFallback>{chatPartner.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h1 className="text-lg font-bold font-headline">{chatPartner.name}</h1>
      </header>

      <ScrollArea className="flex-1 p-4 sm:p-6">
        <div className="space-y-6">
          {messages.map((message, index) => (
            <div key={index} className={`flex items-end gap-2 ${message.from === 'me' ? 'justify-end' : ''}`}>
              {message.from === 'them' && (
                 <Avatar className="h-8 w-8">
                    <AvatarImage src={chatPartner.avatar} alt={chatPartner.name} />
                    <AvatarFallback>{chatPartner.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg rounded-xl px-4 py-3 text-sm ${
                  message.from === 'me'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <footer className="p-4 bg-background border-t">
        <div className="relative">
          <Input placeholder="Type a message..." className="pr-12 h-11" />
          <Button type="submit" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
