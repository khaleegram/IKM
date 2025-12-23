'use client';

import { useState, useRef, useEffect } from 'react';
import { useOrderChat } from '@/lib/firebase/firestore/order-chat';
import { sendOrderMessage } from '@/lib/order-chat-actions';
import { useUser } from '@/lib/firebase/auth/use-user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { useTransition } from 'react';

interface OrderChatProps {
  orderId: string;
  sellerId: string;
  customerId: string;
}

export function OrderChat({ orderId, sellerId, customerId }: OrderChatProps) {
  const { data: messages, isLoading } = useOrderChat(orderId);
  const { user } = useUser();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSeller = user?.uid === sellerId;
  const isCustomer = user?.uid === customerId;
  const canChat = isSeller || isCustomer;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Upload to Firebase Storage
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'order-chat');

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const { url } = await response.json();
        setImageUrl(url);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: (error as Error).message,
        });
      }
    });
  };

  const handleSend = () => {
    if (!message.trim() && !imageUrl) return;
    if (!canChat) return;

    startTransition(async () => {
      try {
        await sendOrderMessage({
          orderId,
          message: message.trim() || undefined,
          imageUrl: imageUrl || undefined,
        });
        setMessage('');
        setImageUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: (error as Error).message,
        });
      }
    });
  };

  if (!canChat) {
    return null;
  }

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader>
        <CardTitle>Order Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.senderId === user?.uid;
              const isSystem = msg.isSystemMessage;

              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${
                    isSystem ? 'justify-center' : ''
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isSystem
                        ? 'bg-muted text-muted-foreground text-sm'
                        : isOwnMessage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {!isSystem && (
                      <div className="text-xs opacity-70 mb-1">
                        {msg.senderType === 'seller' ? 'Seller' : 'Customer'}
                      </div>
                    )}
                    {msg.message && <p className="whitespace-pre-wrap">{msg.message}</p>}
                    {msg.imageUrl && (
                      <div className="mt-2">
                        <Image
                          src={msg.imageUrl}
                          alt="Chat image"
                          width={200}
                          height={200}
                          className="rounded"
                        />
                      </div>
                    )}
                    {msg.createdAt && (
                      <div className="text-xs opacity-70 mt-1">
                        {format(
                          msg.createdAt?.toDate?.() || new Date(msg.createdAt),
                          'MMM d, h:mm a'
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4 space-y-2">
          {imageUrl && (
            <div className="relative inline-block">
              <Image
                src={imageUrl}
                alt="Preview"
                width={100}
                height={100}
                className="rounded"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-0 right-0"
                onClick={() => setImageUrl(null)}
              >
                ×
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isPending}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="chat-image-upload"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button onClick={handleSend} disabled={isPending || (!message.trim() && !imageUrl)}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

