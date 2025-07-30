
'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const conversations = [
  {
    id: 'seller123',
    name: "KicksRepublic",
    lastMessage: "Sounds good, I'll ship it out tomorrow morning.",
    time: "10:45 AM",
    unread: true,
    avatar: "https://placehold.co/100x100.png",
    hint: "logo business"
  },
  {
    id: 'seller456',
    name: "Amina's Creations",
    lastMessage: "Yes, it's made from 100% genuine leather.",
    time: "Yesterday",
    unread: false,
    avatar: "https://placehold.co/100x100.png",
    hint: "logo calligraphy"
  },
  {
    id: 'buyer789',
    name: "David Okon",
    lastMessage: "Perfect, thank you!",
    time: "3 days ago",
    unread: false,
    avatar: "https://placehold.co/100x100.png",
    hint: "person portrait"
  }
];

export default function MessagesPage() {
  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 sm:p-6 bg-background border-b">
        <h1 className="text-2xl font-bold font-headline">My Messages</h1>
      </header>
      <main className="flex-1 overflow-auto">
        <div className="divide-y divide-border">
          {conversations.map((convo) => (
            <Link key={convo.id} href={`/messages/${convo.id}`}>
              <div className="p-4 flex items-center gap-4 hover:bg-muted/50 cursor-pointer">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={convo.avatar} alt={convo.name} data-ai-hint={convo.hint} />
                  <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <div className="flex justify-between items-center">
                    <p className={`font-semibold ${convo.unread ? 'text-foreground' : ''}`}>{convo.name}</p>
                    <p className="text-xs text-muted-foreground">{convo.time}</p>
                  </div>
                  <div className="flex justify-between items-start">
                    <p className={`text-sm text-muted-foreground truncate max-w-xs ${convo.unread ? 'font-medium text-foreground/80' : ''}`}>
                      {convo.lastMessage}
                    </p>
                    {convo.unread && <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1" />}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
