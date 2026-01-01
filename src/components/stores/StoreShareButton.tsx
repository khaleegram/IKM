'use client';

import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAbsoluteUrl, generateWhatsAppShareUrl, formatStoreShareMessage } from '@/lib/share-actions';

interface StoreShareButtonProps {
  sellerId: string;
  storeName: string;
  storeDescription?: string;
  disabled?: boolean;
}

export function StoreShareButton({
  sellerId,
  storeName,
  storeDescription,
  disabled,
}: StoreShareButtonProps) {
  const { toast } = useToast();

  const handleShare = () => {
    // Generate absolute store link
    const storeLink = getAbsoluteUrl(`/store/${sellerId}`);
    
    // Format share message
    const shareText = formatStoreShareMessage(storeName, storeDescription, storeLink);
    
    // Generate WhatsApp share URL
    const whatsappUrl = generateWhatsAppShareUrl(shareText, storeLink);
    
    // Open WhatsApp with share text
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: 'Opening WhatsApp',
      description: 'Share this store with thumbnail preview',
    });
  };

  return (
    <Button
      type="button"
      variant="default"
      onClick={handleShare}
      disabled={disabled}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      <Share2 className="mr-2 h-4 w-4" />
      Share to WhatsApp
    </Button>
  );
}

