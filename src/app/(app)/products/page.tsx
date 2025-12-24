'use client';

import { EmptyState } from '@/components/empty-state';
import { ProductGridSkeleton } from '@/components/loading-skeleton';
import { ProductCard } from '@/components/product-card';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { useCart } from '@/lib/cart-context';
import { PRODUCT_CATEGORIES } from '@/lib/constants/categories';
import { debounce } from '@/lib/debounce';
import type { Product } from '@/lib/firebase/firestore/products';
import { usePaginatedProducts } from '@/lib/firebase/firestore/products';
import { Grid3x3, List, Loader2, Search, SlidersHorizontal, Star, Tag, TrendingUp, X, Zap } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'rating' | 'name' | 'popular';
type ViewMode = 'grid' | 'list';

export default function AllProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: products, isLoading: isLoadingProducts, isLoadingMore, loadMore, hasMore } = usePaginatedProducts(20);
  const { addToCart, isAddingToCart } = useCart();
  
  // Initialize state from URL params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchParams.get('q') || '');
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get('minPrice')) || 0,
    Number(searchParams.get('maxPrice')) || 1000000
  ]);
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState<number>(Number(searchParams.get('rating')) || 0);
  const [stockFilter, setStockFilter] = useState<string>(searchParams.get('stock') || 'all');
  const [featuredOnly, setFeaturedOnly] = useState<boolean>(searchParams.get('featured') === 'true');
  const [viewMode, setViewMode] = useState<ViewMode>((searchParams.get('view') as ViewMode) || 'grid');
  const [quickFilter, setQuickFilter] = useState<string | null>(searchParams.get('quick') || null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
    if (priceRange[1] < 1000000) params.set('maxPrice', priceRange[1].toString());
    if (minRating > 0) params.set('rating', minRating.toString());
    if (stockFilter !== 'all') params.set('stock', stockFilter);
    if (featuredOnly) params.set('featured', 'true');
    if (viewMode !== 'grid') params.set('view', viewMode);
    if (quickFilter) params.set('quick', quickFilter);

    const newUrl = params.toString() ? `/products?${params.toString()}` : '/products';
    router.replace(newUrl, { scroll: false });
  }, [searchTerm, selectedCategory, sortBy, priceRange, minRating, stockFilter, featuredOnly, viewMode, quickFilter, router]);

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

    // Quick filters
    if (quickFilter === 'featured') {
      filtered = filtered.filter(p => p.isFeatured === true);
    } else if (quickFilter === 'on-sale') {
      filtered = filtered.filter(p => p.compareAtPrice && p.compareAtPrice > (p.price || 0));
    } else if (quickFilter === 'popular') {
      filtered = filtered.filter(p => (p.salesCount || 0) > 0 || (p.views || 0) > 10);
      // Sort by popularity
      filtered = [...filtered].sort((a, b) => {
        const aScore = (a.salesCount || 0) * 2 + (a.views || 0);
        const bScore = (b.salesCount || 0) * 2 + (b.views || 0);
        return bScore - aScore;
      });
    } else if (quickFilter === 'new-arrivals') {
      // Filter products created in last 30 days
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(p => {
        const createdAt = p.createdAt?.toMillis?.() || p.createdAt?.getTime?.() || 0;
        return createdAt >= thirtyDaysAgo;
      });
    }

    // Search filter
    if (debouncedSearchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (product.category && product.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (product.sku && product.sku.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Price range filter
    filtered = filtered.filter(product => {
      const price = product.price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Rating filter
    if (minRating > 0) {
      filtered = filtered.filter(product => 
        product.averageRating && product.averageRating >= minRating
      );
    }

    // Stock filter
    if (stockFilter === 'in-stock') {
      filtered = filtered.filter(p => (p.stock || 0) > 0);
    } else if (stockFilter === 'low-stock') {
      filtered = filtered.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 5);
    } else if (stockFilter === 'out-of-stock') {
      filtered = filtered.filter(p => (p.stock || 0) === 0);
    }

    // Featured filter
    if (featuredOnly) {
      filtered = filtered.filter(p => p.isFeatured === true);
    }

    // Sort (only if not using quick filter that already sorted)
    if (quickFilter !== 'popular') {
      filtered = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case 'price-low':
            return (a.price || 0) - (b.price || 0);
          case 'price-high':
            return (b.price || 0) - (a.price || 0);
          case 'rating':
            return (b.averageRating || 0) - (a.averageRating || 0);
          case 'name':
            return a.name.localeCompare(b.name);
          case 'popular':
            const aScore = (a.salesCount || 0) * 2 + (a.views || 0);
            const bScore = (b.salesCount || 0) * 2 + (b.views || 0);
            return bScore - aScore;
          case 'oldest':
            return (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0);
          case 'newest':
          default:
            return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
        }
      });
    }

    return filtered;
  }, [products, debouncedSearchTerm, selectedCategory, sortBy, priceRange, minRating, stockFilter, featuredOnly, quickFilter]);

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

          {/* Quick Filter Buttons */}
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              variant={quickFilter === 'featured' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setQuickFilter(quickFilter === 'featured' ? null : 'featured')}
            >
              <Star className="mr-2 h-4 w-4" />
              Featured
            </Button>
            <Button
              variant={quickFilter === 'on-sale' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setQuickFilter(quickFilter === 'on-sale' ? null : 'on-sale')}
            >
              <Tag className="mr-2 h-4 w-4" />
              On Sale
            </Button>
            <Button
              variant={quickFilter === 'popular' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setQuickFilter(quickFilter === 'popular' ? null : 'popular')}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Popular
            </Button>
            <Button
              variant={quickFilter === 'new-arrivals' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setQuickFilter(quickFilter === 'new-arrivals' ? null : 'new-arrivals')}
            >
              <Zap className="mr-2 h-4 w-4" />
              New Arrivals
            </Button>
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
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filters
                    {(selectedCategory !== 'all' || priceRange[0] > 0 || priceRange[1] < 1000000 || minRating > 0 || stockFilter !== 'all' || featuredOnly) && (
                      <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {[
                          selectedCategory !== 'all' ? 1 : 0,
                          priceRange[0] > 0 || priceRange[1] < 1000000 ? 1 : 0,
                          minRating > 0 ? 1 : 0,
                          stockFilter !== 'all' ? 1 : 0,
                          featuredOnly ? 1 : 0
                        ].reduce((a, b) => a + b, 0)}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:w-[400px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filter Products</SheetTitle>
                    <SheetDescription>
                      Refine your search with advanced filters
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    <div>
                      <Label className="text-base font-semibold mb-3 block">Category</Label>
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
                    <Separator />
                    <div>
                      <Label className="text-base font-semibold mb-3 block">
                        Price Range: ₦{priceRange[0].toLocaleString()} - ₦{priceRange[1].toLocaleString()}
                      </Label>
                      <Slider
                        value={priceRange}
                        onValueChange={(value) => setPriceRange(value as [number, number])}
                        max={1000000}
                        min={0}
                        step={1000}
                        className="mt-2"
                      />
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-base font-semibold mb-3 block">Stock Status</Label>
                      <Select value={stockFilter} onValueChange={setStockFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Products</SelectItem>
                          <SelectItem value="in-stock">In Stock</SelectItem>
                          <SelectItem value="low-stock">Low Stock (≤5)</SelectItem>
                          <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-base font-semibold mb-3 block">Minimum Rating</Label>
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
                    <Separator />
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="featured"
                        checked={featuredOnly}
                        onCheckedChange={(checked) => setFeaturedOnly(checked === true)}
                      />
                      <Label htmlFor="featured" className="text-sm font-normal cursor-pointer">
                        Featured products only
                      </Label>
                    </div>
                    <Separator />
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCategory('all');
                        setPriceRange([0, 1000000]);
                        setMinRating(0);
                        setStockFilter('all');
                        setFeaturedOnly(false);
                        setQuickFilter(null);
                      }}
                      className="w-full"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear All Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              <div className="flex gap-2">
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
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="name">Name: A-Z</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="icon"
                    className="rounded-r-none"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="icon"
                    className="rounded-l-none"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            {(selectedCategory !== 'all' || priceRange[0] > 0 || priceRange[1] < 1000000 || minRating > 0 || stockFilter !== 'all' || featuredOnly || quickFilter) && (
              <div className="flex flex-wrap gap-2">
                {quickFilter && (
                  <Badge variant="default" className="gap-1">
                    {quickFilter === 'featured' ? 'Featured' : quickFilter === 'on-sale' ? 'On Sale' : quickFilter === 'popular' ? 'Popular' : 'New Arrivals'}
                    <button onClick={() => setQuickFilter(null)} className="ml-1 hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedCategory !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {PRODUCT_CATEGORIES.find(c => c.value === selectedCategory)?.label || selectedCategory}
                    <button onClick={() => setSelectedCategory('all')} className="ml-1 hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {(priceRange[0] > 0 || priceRange[1] < 1000000) && (
                  <Badge variant="secondary" className="gap-1">
                    ₦{priceRange[0].toLocaleString()} - ₦{priceRange[1].toLocaleString()}
                    <button onClick={() => setPriceRange([0, 1000000])} className="ml-1 hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {minRating > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    {minRating}+ Stars
                    <button onClick={() => setMinRating(0)} className="ml-1 hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {stockFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {stockFilter === 'in-stock' ? 'In Stock' : stockFilter === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
                    <button onClick={() => setStockFilter('all')} className="ml-1 hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {featuredOnly && (
                  <Badge variant="secondary" className="gap-1">
                    Featured Only
                    <button onClick={() => setFeaturedOnly(false)} className="ml-1 hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {isLoadingProducts && (
            <ProductGridSkeleton count={12} viewMode={viewMode} />
          )}

          {!isLoadingProducts && filteredProducts.length > 0 && (
            viewMode === 'grid' ? (
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
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    onAddToCart={handleAddToCart}
                    isAddingToCart={addingProductId === product.id || isAddingToCart}
                    viewMode="list"
                  />
                ))}
              </div>
            )
          )}

          {!isLoadingProducts && filteredProducts.length === 0 && (
            <EmptyState
              type="search"
              searchTerm={searchTerm}
              onClearSearch={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setPriceRange([0, 1000000]);
                setMinRating(0);
                setStockFilter('all');
                setFeaturedOnly(false);
                setQuickFilter(null);
              }}
            />
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