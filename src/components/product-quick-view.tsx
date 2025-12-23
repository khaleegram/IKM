'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Star, Loader2 } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { useIsInWishlist } from '@/lib/firebase/firestore/wishlist';
import { useUser } from '@/lib/firebase/auth/use-user';
import { addToWishlist, removeFromWishlist } from '@/lib/wishlist-actions';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import type { Product } from '@/lib/firebase/firestore/products';

interface ProductQuickViewProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductQuickView({ product, open, onOpenChange }: ProductQuickViewProps) {
  const { user } = useUser();
  const { addToCart } = useCart();
  const { isInWishlist, isLoading: isLoadingWishlist } = useIsInWishlist(user?.uid, product.id);
  const { toast } = useToast();
  const [isToggling, startToggleTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);
    try {
      addToCart(product);
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart.`,
      });
      setTimeout(() => setIsAdding(false), 500);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      setIsAdding(false);
    }
  };

  const handleWishlistToggle = () => {
    if (!user || !product.id) {
      toast({ variant: 'destructive', title: 'Login Required', description: 'Please login to add items to wishlist.' });
      return;
    }

    startToggleTransition(async () => {
      try {
        if (isInWishlist) {
          await removeFromWishlist(product.id!);
          toast({ title: "Removed from Wishlist", description: "Product removed from your wishlist." });
        } else {
          await addToWishlist(product.id!);
          toast({ title: "Added to Wishlist", description: "Product added to your wishlist." });
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>{product.category}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative aspect-square">
            <Image
              src={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/600`}
              alt={product.name}
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-2xl font-bold text-primary">₦{product.price.toLocaleString()}</p>
                {product.averageRating && product.reviewCount ? (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{product.averageRating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({product.reviewCount})</span>
                  </div>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">Stock: {product.stock} available</p>
            </div>
            <p className="text-sm leading-relaxed">{product.description}</p>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleAddToCart}
                disabled={isAdding || product.stock === 0}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </>
                )}
              </Button>
              {user && (
                <Button
                  variant="outline"
                  onClick={handleWishlistToggle}
                  disabled={isToggling || isLoadingWishlist}
                >
                  <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              )}
            </div>
            <Link href={`/product/${product.id}`} className="block">
              <Button variant="outline" className="w-full">
                View Full Details
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

