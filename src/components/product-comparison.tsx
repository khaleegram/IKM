'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ShoppingCart, Star, Package, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { useProduct } from '@/lib/firebase/firestore/products';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/firebase/firestore/products';

interface ProductComparisonProps {
  productIds: string[];
  onRemove?: (productId: string) => void;
  onClear?: () => void;
}

export function ProductComparison({ productIds, onRemove, onClear }: ProductComparisonProps) {
  const { addToCart } = useCart();
  const { data: allProducts } = useAllProducts();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!allProducts) {
      setIsLoading(true);
      return;
    }

    // Filter products by IDs
    const matchedProducts = productIds
      .map(id => allProducts.find(p => p.id === id))
      .filter((p): p is Product => p !== undefined);

    setProducts(matchedProducts);
    setIsLoading(false);
  }, [productIds, allProducts]);

  if (productIds.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No products selected for comparison</p>
          <p className="text-sm text-muted-foreground mt-2">
            Add products to compare by clicking the "Compare" button on product pages
          </p>
        </CardContent>
      </Card>
    );
  }

  const validProducts = products.filter((p): p is Product => p !== null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {productIds.map((id) => (
              <Skeleton key={id} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (validProducts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Failed to load products for comparison</p>
        </CardContent>
      </Card>
    );
  }

  // Get all unique attributes to compare
  const attributes = new Set<string>();
  validProducts.forEach(product => {
    if (product.category) attributes.add('Category');
    if (product.price !== undefined) attributes.add('Price');
    if (product.stock !== undefined) attributes.add('Stock');
    if (product.averageRating !== undefined) attributes.add('Rating');
    if (product.description) attributes.add('Description');
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Compare Products</CardTitle>
          <div className="flex gap-2">
            {onClear && (
              <Button variant="outline" size="sm" onClick={onClear}>
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-full inline-block">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2 border-b">Attribute</th>
                  {validProducts.map((product) => (
                    <th key={product.id} className="text-center p-2 border-b min-w-[200px]">
                      <div className="flex flex-col items-center gap-2">
                        <div className="relative w-24 h-24">
                          <Image
                            src={product.imageUrl || `https://picsum.photos/seed/${product.id}/200/200`}
                            alt={product.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <div className="text-sm font-semibold">{product.name}</div>
                        {onRemove && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemove(product.id!)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from(attributes).map((attr) => (
                  <tr key={attr} className="border-b">
                    <td className="p-2 font-medium">{attr}</td>
                    {validProducts.map((product) => (
                      <td key={product.id} className="p-2 text-center">
                        {attr === 'Price' && (
                          <span className="font-bold text-primary">
                            ₦{(product.price || product.initialPrice || 0).toLocaleString()}
                          </span>
                        )}
                        {attr === 'Category' && (
                          <Badge variant="secondary">{product.category || 'N/A'}</Badge>
                        )}
                        {attr === 'Stock' && (
                          <span className={product.stock === 0 ? 'text-destructive' : ''}>
                            {product.stock || 0}
                          </span>
                        )}
                        {attr === 'Rating' && (
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{product.averageRating?.toFixed(1) || 'N/A'}</span>
                          </div>
                        )}
                        {attr === 'Description' && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description || 'N/A'}
                          </p>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="p-2 font-medium">Actions</td>
                  {validProducts.map((product) => (
                    <td key={product.id} className="p-2">
                      <div className="flex flex-col gap-2">
                        <Link href={`/product/${product.id}`} className="w-full">
                          <Button variant="outline" size="sm" className="w-full">
                            View Details
                          </Button>
                        </Link>
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full"
                          onClick={() => addToCart(product)}
                          disabled={product.stock === 0}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Add to Cart
                        </Button>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook to manage comparison state
export function useProductComparison() {
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const maxCompare = 4; // Maximum products to compare

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('ikm-comparison');
    if (saved) {
      try {
        setComparisonIds(JSON.parse(saved));
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  useEffect(() => {
    // Save to localStorage
    if (comparisonIds.length > 0) {
      localStorage.setItem('ikm-comparison', JSON.stringify(comparisonIds));
    } else {
      localStorage.removeItem('ikm-comparison');
    }
  }, [comparisonIds]);

  const addToComparison = (productId: string) => {
    if (comparisonIds.includes(productId)) {
      return; // Already in comparison
    }
    if (comparisonIds.length >= maxCompare) {
      // Remove oldest and add new
      setComparisonIds(prev => [...prev.slice(1), productId]);
    } else {
      setComparisonIds(prev => [...prev, productId]);
    }
  };

  const removeFromComparison = (productId: string) => {
    setComparisonIds(prev => prev.filter(id => id !== productId));
  };

  const clearComparison = () => {
    setComparisonIds([]);
  };

  return {
    comparisonIds,
    addToComparison,
    removeFromComparison,
    clearComparison,
    canAddMore: comparisonIds.length < maxCompare,
  };
}

