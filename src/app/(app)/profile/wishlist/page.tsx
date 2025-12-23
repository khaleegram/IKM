'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, ShoppingCart, Trash2 } from "lucide-react";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useWishlist } from "@/lib/firebase/firestore/wishlist";
import { removeFromWishlist } from "@/lib/wishlist-actions";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

export default function WishlistPage() {
  const { user } = useUser();
  const { products, isLoading } = useWishlist(user?.uid);
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [isRemoving, startRemoveTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = (productId: string) => {
    setRemovingId(productId);
    startRemoveTransition(async () => {
      try {
        await removeFromWishlist(productId);
        toast({
          title: "Removed from Wishlist",
          description: "Product has been removed from your wishlist.",
        });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      } finally {
        setRemovingId(null);
      }
    });
  };

  const handleAddToCart = (product: any) => {
    try {
      addToCart(product);
      toast({
        title: "Added to Cart",
        description: "Product has been added to your cart.",
      });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
      <header className="mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline">My Wishlist</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Products you've saved for later.
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-semibold mb-2">Your wishlist is empty</p>
            <p className="text-muted-foreground mb-4">Start adding products you love!</p>
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {products.map((product) => (
            <Card key={product.id} className="group overflow-hidden">
              <Link href={`/product/${product.id}`}>
                <CardHeader className="p-0 relative">
                  <Image
                    src={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/400`}
                    alt={product.name}
                    width={600}
                    height={400}
                    className="aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemove(product.id!);
                    }}
                    disabled={isRemoving && removingId === product.id}
                  >
                    {isRemoving && removingId === product.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </CardHeader>
              </Link>
              <CardContent className="p-3 sm:p-4">
                <Link href={`/product/${product.id}`}>
                  <h3 className="font-semibold text-sm sm:text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-base sm:text-lg font-bold text-primary">
                    ₦{(product.price || product.initialPrice || 0).toLocaleString()}
                  </p>
                  {product.averageRating && product.reviewCount ? (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{product.averageRating.toFixed(1)}</span>
                    </div>
                  ) : null}
                </div>
                <Button
                  className="w-full text-sm"
                  size="sm"
                  onClick={() => handleAddToCart(product)}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

