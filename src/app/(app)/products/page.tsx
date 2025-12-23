'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { ShoppingCart, Loader2, ArrowRight, Search, Sparkles, Star, Filter, X, SlidersHorizontal } from 'lucide-react';
import { usePaginatedProducts } from '@/lib/firebase/firestore/products';
import { useCart } from '@/lib/cart-context';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { debounce } from '@/lib/debounce';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/firebase/firestore/products';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRODUCT_CATEGORIES } from '@/lib/constants/categories';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'rating' | 'name';

export default function AllProductsPage() {
  const { data: products, isLoading: isLoadingProducts, isLoadingMore, loadMore, hasMore } = usePaginatedProducts(20);
  const { addToCart, isAddingToCart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Debounce search term
  useEffect(() => {
    const debounced = debounce((value: string) => {
      setDebouncedSearchTerm(value);
    }, 300);

    debounced(searchTerm);
  }, [searchTerm]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoadingProducts) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoadingMore, isLoadingProducts, loadMore]);

  const filteredProducts = useMemo(() => {
    let filtered = products || [];

    // Search filter
    if (debouncedSearchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (product.category && product.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Price range filter
    filtered = filtered.filter(product => {
      const price = product.price || product.initialPrice || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Rating filter
    if (minRating > 0) {
      filtered = filtered.filter(product => 
        product.averageRating && product.averageRating >= minRating
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.price || a.initialPrice || 0) - (b.price || b.initialPrice || 0);
        case 'price-high':
          return (b.price || b.initialPrice || 0) - (a.price || a.initialPrice || 0);
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'oldest':
          return (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0);
        case 'newest':
        default:
          return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
      }
    });

    return filtered;
  }, [products, debouncedSearchTerm, selectedCategory, sortBy, priceRange, minRating]);

  const handleAddToCart = useCallback((product: Product) => {
    if (!product.id) return;
    setAddingProductId(product.id);
    try {
      addToCart(product);
    } catch (error) {
      // Failed to add to cart
    } finally {
      setTimeout(() => setAddingProductId(null), 500);
    }
  }, [addToCart]);
  

  return (
    <section className="py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold font-headline mb-2">
                All Products
              </h1>
              <p className="text-muted-foreground text-lg">
                Explore the entire collection from all our talented artisans.
              </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 sm:mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search for products..."
                  className="h-11 w-full rounded-full bg-card/80 pl-10 pr-4"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 sm:w-96" align="end">
                  <div className="space-y-4">
                    <div>
                      <Label>Category</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {PRODUCT_CATEGORIES.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Price Range: ₦{priceRange[0].toLocaleString()} - ₦{priceRange[1].toLocaleString()}</Label>
                      <Slider
                        value={priceRange}
                        onValueChange={(value) => setPriceRange(value as [number, number])}
                        max={1000000}
                        min={0}
                        step={1000}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Minimum Rating</Label>
                      <Select value={minRating.toString()} onValueChange={(v) => setMinRating(Number(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Any Rating</SelectItem>
                          <SelectItem value="4">4+ Stars</SelectItem>
                          <SelectItem value="3">3+ Stars</SelectItem>
                          <SelectItem value="2">2+ Stars</SelectItem>
                          <SelectItem value="1">1+ Star</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCategory('all');
                        setPriceRange([0, 1000000]);
                        setMinRating(0);
                      }}
                      className="w-full"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear Filters
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="name">Name: A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(selectedCategory !== 'all' || priceRange[0] > 0 || priceRange[1] < 1000000 || minRating > 0) && (
              <div className="flex flex-wrap gap-2">
                {selectedCategory !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedCategory}
                    <button onClick={() => setSelectedCategory('all')} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {(priceRange[0] > 0 || priceRange[1] < 1000000) && (
                  <Badge variant="secondary" className="gap-1">
                    ₦{priceRange[0].toLocaleString()} - ₦{priceRange[1].toLocaleString()}
                    <button onClick={() => setPriceRange([0, 1000000])} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {minRating > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    {minRating}+ Stars
                    <button onClick={() => setMinRating(0)} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {isLoadingProducts && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {Array.from({ length: 12 }).map((_, index) => (
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

          {!isLoadingProducts && filteredProducts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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
                          loading={index < 8 ? "eager" : "lazy"}
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
          )}

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
                    Try adjusting your search terms.
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
                </>
              )}
            </div>
          )}

          {/* Infinite scroll trigger */}
          {!isLoadingProducts && filteredProducts.length > 0 && (
            <div ref={observerTarget} className="py-8">
              {isLoadingMore && (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
              {!hasMore && !isLoadingMore && (
                <p className="text-center text-muted-foreground">No more products to load</p>
              )}
            </div>
          )}
        </div>
      </section>
  );
}