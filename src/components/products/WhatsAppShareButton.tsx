'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatProductShareMessage, generateWhatsAppShareUrl, getAbsoluteUrl } from '@/lib/share-actions';
import { Share2 } from 'lucide-react';

interface WhatsAppShareButtonProps {
  productId: string;
  productName: string;
  productImage?: string;
  productPrice: number;
  disabled?: boolean;
}

export function WhatsAppShareButton({
  productId,
  productName,
  productImage,
  productPrice,
  disabled,
}: WhatsAppShareButtonProps) {
  const { toast } = useToast();

  const handleShare = () => {
    // Generate absolute product link
    const productLink = getAbsoluteUrl(`/product/${productId}`);
    
    // Format share message (without URL - URL is added separately)
    const shareText = formatProductShareMessage(productName, productPrice);
    
    // Generate WhatsApp share URL (this adds the URL to the message)
    const whatsappUrl = generateWhatsAppShareUrl(shareText, productLink);
    
    // Open WhatsApp with share text
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: 'Opening WhatsApp',
      description: 'Share this product with thumbnail preview',
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleShare}
      disabled={disabled}
      className="w-full"
    >
      <Share2 className="mr-2 h-4 w-4" />
      Share to WhatsApp
    </Button>
  );
}

