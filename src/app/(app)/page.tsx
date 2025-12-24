'use client';

import { DynamicLogo } from '@/components/DynamicLogo';
import { ProductGridSkeleton } from '@/components/loading-skeleton';
import { ProductCard } from '@/components/product-card';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { useCart } from '@/lib/cart-context';
import { PRODUCT_CATEGORIES } from '@/lib/constants/categories';
import { debounce } from '@/lib/debounce';
import type { Product } from '@/lib/firebase/firestore/products';
import { useAllProducts } from '@/lib/firebase/firestore/products';
import { ArrowRight, Search, ShoppingCart, Sparkles, Store } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function StoreHomePage() {
  const router = useRouter();
  const { data: products, isLoading: isLoadingProducts } = useAllProducts(8);
  const { addToCart, isAddingToCart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Debounce search term
  useEffect(() => {
    const debounced = debounce((value: string) => {
      setDebouncedSearchTerm(value);
    }, 300);

    debounced(searchTerm);

    return () => {
      // Cleanup if component unmounts
    };
  }, [searchTerm]);

  const filteredProducts = useMemo(() => 
    (products || []).filter(product => 
      product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
    ),
    [products, debouncedSearchTerm]
  );

  const handleAddToCart = useCallback((product: Product) => {
    if (!product.id) return;
    setAddingProductId(product.id);
    try {
      addToCart(product);
    } catch (error) {
      // Failed to add to cart
    } finally {
      // Add a small delay to show the loading state
      setTimeout(() => setAddingProductId(null), 500);
    }
  }, [addToCart]);
  

  const categoryLinks = [
    { name: 'Browse All Products', icon: ShoppingCart, href: '/products'},
    { name: 'Browse All Stores', icon: Store, href: '/stores'},
  ]

  return (
    <>
      {/* Functional Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-background via-card/5 to-background">
         <div className="container relative z-10 mx-auto flex flex-col items-center justify-center space-y-6 px-4 py-12 sm:py-20 text-center animate-fade-in-up">
            <div className="flex items-center gap-2 sm:gap-4">
              <DynamicLogo className="w-auto h-12 sm:h-16" />
              <h1 className="hidden sm:block text-4xl sm:text-5xl font-bold font-headline tracking-tight">IK Market Place</h1>
            </div>
            <div className="w-full max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search for products, brands, and more..."
                  className="h-12 sm:h-14 w-full rounded-full bg-card/80 pl-12 pr-4 text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchTerm.trim()) {
                      router.push(`/products?q=${encodeURIComponent(searchTerm.trim())}`);
                    }
                  }}
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
            
            {/* Popular Categories */}
            <div className="mt-8 w-full max-w-4xl">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 text-center">Shop by Category</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {PRODUCT_CATEGORIES.slice(0, 12).map(category => (
                  <Link
                    key={category.value}
                    href={`/products?category=${category.value}`}
                    className="flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:bg-accent hover:border-primary transition-all duration-200 group"
                  >
                    <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{category.icon}</span>
                    <span className="text-xs font-medium text-center line-clamp-2 group-hover:text-primary transition-colors">
                      {category.label}
                    </span>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-6">
                <Link href="/products">
                  <Button variant="outline" size="sm">
                    View All Categories
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-24 px-3 sm:px-4 md:px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline mb-2">
                Featured Products
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                Handpicked items from our talented artisans
              </p>
            </div>

          {/* Loading State */}
          {isLoadingProducts && (
            <ProductGridSkeleton count={8} />
          )}

          {/* Products Grid */}
          {!isLoadingProducts && filteredProducts.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    onAddToCart={handleAddToCart}
                    isAddingToCart={addingProductId === product.id || isAddingToCart}
                    viewMode="grid"
                  />
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
