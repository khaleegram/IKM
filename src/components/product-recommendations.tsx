'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2, Star } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { getProductRecommendations } from '@/lib/product-recommendations';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/firebase/firestore/products';

interface ProductRecommendationsProps {
  productId: string;
  category?: string;
  price?: number;
}

export function ProductRecommendations({ productId, category, price }: ProductRecommendationsProps) {
  const { addToCart } = useCart();
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const products = await getProductRecommendations(productId, category, price, 4);
        setRecommendations(products);
      } catch (error) {
        // Error fetching recommendations - silently fail
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [productId, category, price]);

  const handleAddToCart = (product: Product) => {
    if (!product.id) return;
    setAddingProductId(product.id);
    try {
      addToCart(product);
    } catch (error) {
      // Failed to add to cart
    } finally {
      setTimeout(() => setAddingProductId(null), 500);
    }
  };

  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-bold font-headline mb-6">You May Also Like</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-0">
                <Skeleton className="aspect-square w-full" />
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold font-headline mb-6">You May Also Like</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {recommendations.map((product) => (
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
            <CardContent className="p-4 space-y-2">
              <Link href={`/product/${product.id}`}>
                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
              </Link>
              <div className="flex items-center justify-between">
                <p className="font-bold text-primary">₦{(product.price || product.initialPrice || 0).toLocaleString()}</p>
                {product.averageRating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs">{product.averageRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <Button
                className="w-full text-sm"
                size="sm"
                onClick={() => handleAddToCart(product)}
                disabled={addingProductId === product.id || product.stock === 0}
              >
                {addingProductId === product.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="mr-2 h-4 w-4" />
                )}
                Add to Cart
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

