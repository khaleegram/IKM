'use client';

import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    // Generate product link
    const productLink = `${window.location.origin}/product/${productId}`;
    
    // Create WhatsApp share text
    const shareText = `Check out this product:\n\n${productName}\n₦${productPrice.toLocaleString()}\n\n${productLink}`;
    
    // Open WhatsApp with share text
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: 'Opening WhatsApp',
      description: 'Share this product to your WhatsApp Status',
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
      Share to WhatsApp Status
    </Button>
  );
}

