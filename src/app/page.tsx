
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { ShoppingCart, Loader2, ArrowRight, Search, Sparkles, Star } from 'lucide-react';
import { useAllProducts } from '@/lib/firebase/firestore/products';
import { useCart } from '@/lib/cart-context';
import { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/firebase/firestore/products';

export default function StoreHomePage() {
  const { data: products, isLoading: isLoadingProducts } = useAllProducts(8);
  const { addToCart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => 
    products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [products, searchTerm]
  );

  const handleAddToCart = useCallback(async (product: Product) => {
    if (!product.id) return;
    setAddingProductId(product.id);
    try {
      // The addToCart function in the context is synchronous, 
      // but we simulate a small delay to show the loader.
      await new Promise(res => setTimeout(res, 300));
      addToCart(product);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setAddingProductId(null);
    }
  }, [addToCart]);
  
  const placeholderImages = [
    { src: "https://picsum.photos/seed/fashion/600/800", alt: "Fashion accessory", dataAiHint: "fashion accessory" },
    { src: "https://picsum.photos/seed/crafts/600/800", alt: "Handmade craft", dataAiHint: "handmade craft" },
    { src: "https://picsum.photos/seed/pottery/600/800", alt: "Pottery art", dataAiHint: "pottery art" },
    { src: "https://picsum.photos/seed/art/600/800", alt: "Local art", dataAiHint: "local art" },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-muted/40 to-muted/20 relative overflow-hidden">
        <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center py-16 sm:py-24 px-4">
          <div className="flex flex-col items-start text-left space-y-6 z-10">
            <div className="space-y-4">
              <Badge variant="secondary" className="px-4 py-1 text-sm">
                🎉 100+ Nigerian Artisans
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold font-headline tracking-tight leading-tight">
                Unique Finds,
                <br />
                <span className="text-primary bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Nigerian Hands.
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Discover authentic products from independent sellers and talented artisans across Nigeria.
              </p>
            </div>
            
            <div className="w-full max-w-md flex flex-col sm:flex-row gap-3">
              <Link href="/stores" className="flex-1">
                <Button size="lg" className="w-full h-12 text-base">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Explore Stores
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/seller/dashboard" className="flex-1">
                <Button size="lg" variant="outline" className="w-full h-12 text-base">
                  Become a Seller
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-6 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Artisans</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Authentic</div>
              </div>
            </div>
          </div>

          {/* Image Grid */}
          <div className="hidden lg:grid grid-cols-2 gap-4 relative">
            {placeholderImages.map((image, index) => (
              <div 
                key={index}
                className={`${index % 2 === 1 ? 'pt-12' : ''} animate-fade-in`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <Image 
                    src={image.src} 
                    alt={image.alt}
                    width={600}
                    height={index % 2 === 0 ? 400 : 800}
                    className="object-cover aspect-[3/4] group-hover:scale-110 transition-transform duration-500"
                    priority={index < 2}
                    data-ai-hint={image.dataAiHint}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-6">
            <div className="text-center sm:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold font-headline mb-2">
                Featured Products
              </h2>
              <p className="text-muted-foreground text-lg">
                Handpicked items from our talented artisans
              </p>
            </div>
            
            <div className="relative w-full sm:w-auto min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search products..."
                className="pl-9 pr-4 h-11 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search products"
              />
            </div>
          </div>

          {/* Loading State */}
          {isLoadingProducts && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                          disabled={addingProductId === product.id}
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
