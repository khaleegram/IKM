
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { ShoppingCart, Loader2, ArrowRight, Search, Sparkles, Star, Store } from 'lucide-react';
import { useAllProducts } from '@/lib/firebase/firestore/products';
import { useCart } from '@/lib/cart-context';
import { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/firebase/firestore/products';
import { IkmLogo } from '@/components/icons';

export default function StoreHomePage() {
  const { data: products, isLoading: isLoadingProducts } = useAllProducts(8);
  const { addToCart, isAddingToCart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => 
    products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [products, searchTerm]
  );

  const handleAddToCart = useCallback((product: Product) => {
    if (!product.id) return;
    setAddingProductId(product.id);
    try {
      addToCart(product);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      // Add a small delay to show the loading state
      setTimeout(() => setAddingProductId(null), 500);
    }
  }, [addToCart]);
  

  const categoryLinks = [
    { name: 'Browse All Stores', icon: Store, href: '/stores'},
  ]

  return (
    <>
      {/* Functional Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-background via-card/5 to-background">
         <div className="container relative z-10 mx-auto flex flex-col items-center justify-center space-y-6 px-4 py-12 text-center animate-fade-in-up">
            <div className="flex items-center gap-2 sm:gap-4">
              <IkmLogo className="w-auto h-10 sm:h-12" />
              <h1 className="text-3xl sm:text-4xl font-bold font-headline tracking-tight">The IK Market Place</h1>
            </div>
            <div className="w-full max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search for products, brands, and more..."
                  className="h-12 sm:h-14 w-full rounded-full bg-card/80 pl-12 pr-4 text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
               <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">Get started:</span>
                {categoryLinks.map(link => (
                    <Link href={link.href} key={link.name}>
                        <Button variant="ghost" size="sm" className="rounded-full">
                            <link.icon className="mr-2 h-4 w-4" />
                            {link.name}
                        </Button>
                    </Link>
                ))}
            </div>
            </div>
          </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold font-headline mb-2">
                Featured Products
              </h2>
              <p className="text-muted-foreground text-lg">
                Handpicked items from our talented artisans
              </p>
            </div>

          {/* Loading State */}
          {isLoadingProducts && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <Card key={index} className="overflow-hidden border-0 shadow-sm">
                  <CardHeader className="p-0">
                    <Skeleton className="aspect-square w-full" />
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Products Grid */}
          {!isLoadingProducts && filteredProducts.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((product, index) => (
                  <Card 
                    key={product.id} 
                    className="group overflow-hidden relative border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-card"
                  >
                    <Link href={`/product/${product.id}`} className="block">
                      <CardHeader className="p-0 relative">
                        <Image 
                          src={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/400`} 
                          alt={product.name} 
                          width={600} 
                          height={400} 
                          className="aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                          loading={index < 4 ? "eager" : "lazy"}
                          data-ai-hint="product image"
                        />
                        {product.isFeatured && (
                          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                            <Star className="h-3 w-3 mr-1.5 fill-current" />
                            Featured
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
                        <p className="font-bold text-primary text-lg">
                          ₦{product.price.toLocaleString()}
                        </p>
                        <Button 
                          size="icon" 
                          className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-110"
                          onClick={() => handleAddToCart(product)}
                          disabled={addingProductId === product.id || isAddingToCart}
                          aria-label={`Add ${product.name} to cart`}
                        >
                          {addingProductId === product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ShoppingCart className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* View All Products CTA */}
              {products.length >= 8 && (
                <div className="text-center mt-12">
                  <Link href="/products">
                    <Button variant="outline" size="lg" className="px-8">
                      View All Products
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Empty States */}
          {!isLoadingProducts && filteredProducts.length === 0 && (
            <div className="text-center py-16 space-y-4">
              <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              {searchTerm ? (
                <>
                  <h3 className="text-xl font-semibold">No products found</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    No products found for "<span className="font-medium">{searchTerm}</span>". 
                    Try adjusting your search terms or browse all products.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchTerm('')}
                    className="mt-4"
                  >
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold">No products available</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Check back soon to discover amazing products from our Nigerian artisans!
                  </p>
                  <Link href="/seller/dashboard" className="inline-block mt-4">
                    <Button>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Become a Seller
                    </Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
