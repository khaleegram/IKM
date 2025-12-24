'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Loader2, Star } from 'lucide-react';
import type { Product } from '@/lib/firebase/firestore/products';
import { PRODUCT_CATEGORIES } from '@/lib/constants/categories';

interface ProductCardProps {
  product: Product;
  index: number;
  onAddToCart: (product: Product) => void;
  isAddingToCart: boolean;
  viewMode?: 'grid' | 'list';
}

const ProductCardComponent = ({ 
  product, 
  index, 
  onAddToCart, 
  isAddingToCart,
  viewMode = 'grid'
}: ProductCardProps) => {
  const discountPercentage = product.compareAtPrice && product.compareAtPrice > (product.price || 0)
    ? Math.round(((product.compareAtPrice - (product.price || 0)) / product.compareAtPrice) * 100)
    : 0;

  const isOutOfStock = (product.stock || 0) === 0;
  const categoryLabel = PRODUCT_CATEGORIES.find(c => c.value === product.category)?.label || product.category;

  if (viewMode === 'list') {
    return (
      <Card className="group overflow-hidden relative border shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex flex-col sm:flex-row">
          <Link 
            href={`/product/${product.id}`} 
            className="block sm:w-48 flex-shrink-0"
            prefetch={index < 4}
          >
            <div className="relative aspect-square sm:aspect-auto sm:h-48">
              <Image 
                src={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/400`} 
                alt={product.name} 
                fill
                sizes="(max-width: 640px) 50vw, 192px"
                className="object-cover"
                loading={index < 4 ? "eager" : "lazy"}
                quality={85}
              />
              {product.isFeatured && (
                <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Featured
                </Badge>
              )}
            </div>
          </Link>
          
          <CardContent className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <Link href={`/product/${product.id}`} prefetch={index < 4}>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors mb-1">
                      {product.name}
                    </h3>
                  </Link>
                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {product.description}
                    </p>
                  )}
                  {product.category && (
                    <Badge variant="outline" className="text-xs">
                      {categoryLabel}
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary text-xl">
                    ₦{(product.price || 0).toLocaleString()}
                  </p>
                  {discountPercentage > 0 && (
                    <>
                      <p className="text-sm text-muted-foreground line-through">
                        ₦{product.compareAtPrice!.toLocaleString()}
                      </p>
                      <Badge variant="destructive" className="mt-1">
                        {discountPercentage}% OFF
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {product.averageRating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{product.averageRating.toFixed(1)}</span>
                    {product.reviewCount && <span>({product.reviewCount})</span>}
                  </div>
                )}
                <span>Stock: {product.stock || 0}</span>
                {product.salesCount && product.salesCount > 0 && (
                  <span>{product.salesCount} sold</span>
                )}
              </div>
              <Button 
                onClick={() => onAddToCart(product)}
                disabled={isAddingToCart || isOutOfStock}
                className="gap-2"
                aria-label={`Add ${product.name} to cart`}
              >
                {isAddingToCart ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="group overflow-hidden relative border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-card"
    >
      <Link 
        href={`/product/${product.id}`} 
        className="block"
        prefetch={index < 8}
      >
        <CardHeader className="p-0 relative">
          <div className="relative aspect-square">
            <Image 
              src={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/400`} 
              alt={product.name} 
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              loading={index < 8 ? "eager" : "lazy"}
              quality={85}
            />
          </div>
          {product.isFeatured && (
            <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
              <Star className="h-3 w-3 mr-1.5 fill-current" />
              Featured
            </Badge>
          )}
          {discountPercentage > 0 && (
            <Badge variant="destructive" className="absolute top-3 right-3">
              {discountPercentage}% OFF
            </Badge>
          )}
        </CardHeader>
      </Link>
      
      <CardContent className="p-4 space-y-3">
        <div className="space-y-1 h-20">
          <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}
        </div>
        
        <div className="flex justify-between items-center pt-2">
          <div>
            <p className="font-bold text-primary text-lg">
              ₦{(product.price || 0).toLocaleString()}
            </p>
            {discountPercentage > 0 && (
              <p className="text-xs text-muted-foreground line-through">
                ₦{product.compareAtPrice!.toLocaleString()}
              </p>
            )}
          </div>
          <Button 
            size="icon" 
            className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-110"
            onClick={() => onAddToCart(product)}
            disabled={isAddingToCart || isOutOfStock}
            aria-label={`Add ${product.name} to cart`}
          >
            {isAddingToCart ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
          </Button>
        </div>
        {isOutOfStock && (
          <Badge variant="destructive" className="w-full justify-center">Out of Stock</Badge>
        )}
      </CardContent>
    </Card>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const ProductCard = memo(ProductCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.stock === nextProps.product.stock &&
    prevProps.isAddingToCart === nextProps.isAddingToCart &&
    prevProps.viewMode === nextProps.viewMode
  );
});

ProductCard.displayName = 'ProductCard';

