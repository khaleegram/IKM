'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Loader2 } from "lucide-react";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useRecentlyViewed } from "@/lib/firebase/firestore/recently-viewed";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { ProductQuickView } from "@/components/product-quick-view";
import { useState } from "react";

export default function RecentlyViewedPage() {
  const { user } = useUser();
  const { data: products, isLoading } = useRecentlyViewed(user?.uid, 20);
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null);

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
          <h1 className="text-2xl sm:text-3xl font-bold font-headline">Recently Viewed</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Products you've recently browsed.
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
            <Eye className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-semibold mb-2">No recently viewed products</p>
            <p className="text-muted-foreground mb-4">Start browsing products to see them here!</p>
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
                    ₦{(product.price || 0).toLocaleString()}
                  </p>
                  {product.averageRating && product.reviewCount ? (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{product.averageRating.toFixed(1)}</span>
                    </div>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 text-sm"
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                  >
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickViewProduct(product)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          open={!!quickViewProduct}
          onOpenChange={(open) => !open && setQuickViewProduct(null)}
        />
      )}
    </div>
  );
}

