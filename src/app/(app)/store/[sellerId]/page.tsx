'use client';

import { EmptyState } from '@/components/empty-state';
import { ProductGridSkeleton } from '@/components/loading-skeleton';
import { ProductCard } from '@/components/product-card';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from '@/lib/cart-context';
import { PRODUCT_CATEGORIES } from '@/lib/constants/categories';
import { useProductsBySeller } from '@/lib/firebase/firestore/products';
import { useStoreByUserId } from '@/lib/firebase/firestore/stores';
import { Clock, Facebook, Grid3x3, Instagram, List, Mail, MapPin, Phone, Store, Twitter } from 'lucide-react';
import { notFound, useParams } from 'next/navigation';
import { useMemo, useState } from 'react';


export default function SellerStorePage() {
  const params = useParams();
  const sellerId = params.sellerId as string;

  const { data: products, isLoading: isLoadingProducts } = useProductsBySeller(sellerId);
  const { data: store, isLoading: isLoadingStore } = useStoreByUserId(sellerId);
  const { addToCart, isAddingToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'name'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  const isLoading = isLoadingProducts || isLoadingStore;
  
  if (!isLoading && !store) {
    notFound();
  }

  // Apply storefront settings
  const primaryColor = store?.primaryColor || '#000000';
  const secondaryColor = store?.secondaryColor || '#666666';
  const fontFamily = store?.fontFamily || 'Inter';
  const layout = store?.storeLayout || store?.layout || 'grid';

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products || [];

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
        default:
          return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
      }
    });

    return filtered;
  }, [products, selectedCategory, sortBy]);

  const handleAddToCart = (product: any) => {
    setAddingProductId(product.id);
    addToCart(product);
    setTimeout(() => setAddingProductId(null), 500);
  };

  return (
    <div style={{ fontFamily }}>
      {/* Store Header with Banner */}
      {!isLoading && store && (
        <div 
          className="relative w-full h-48 sm:h-64 md:h-80 bg-gradient-to-r from-primary/10 to-primary/5"
          style={{ 
            backgroundImage: store.storeBannerUrl ? `url(${store.storeBannerUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative container mx-auto px-4 h-full flex flex-col items-center justify-center text-center">
            {store.storeLogoUrl ? (
              <img 
                src={store.storeLogoUrl} 
                alt={store.storeName}
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-white shadow-lg mb-4 object-cover"
              />
            ) : (
              <div 
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-full mb-4 flex items-center justify-center border-4 border-white shadow-lg"
                style={{ backgroundColor: secondaryColor }}
              >
                <Store className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
              </div>
            )}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-2">
              {store.storeName}
            </h1>
            {store.storeDescription && (
              <p className="text-white/90 text-sm sm:text-base max-w-2xl drop-shadow">
                {store.storeDescription}
              </p>
            )}
          </div>
        </div>
      )}

      <section className="py-8 sm:py-12 px-3 sm:px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Store Info Sidebar */}
          {!isLoading && store && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              <div className="lg:col-span-1">
                <Card className="p-4 space-y-4">
                  <h3 className="font-semibold text-lg mb-4">Store Information</h3>
                  
                  {store.storeLocation && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                      <div>
                        <p className="font-medium">{store.storeLocation.city}</p>
                        <p className="text-muted-foreground">{store.storeLocation.state}</p>
                      </div>
                    </div>
                  )}

                  {store.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4" style={{ color: primaryColor }} />
                      <a href={`tel:${store.phone}`} className="hover:underline">{store.phone}</a>
                    </div>
                  )}

                  {store.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4" style={{ color: primaryColor }} />
                      <a href={`mailto:${store.email}`} className="hover:underline">{store.email}</a>
                    </div>
                  )}

                  {store.pickupAddress && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                      <div>
                        <p className="font-medium">Pickup Address:</p>
                        <p className="text-muted-foreground">{store.pickupAddress}</p>
                      </div>
                    </div>
                  )}

                  {store.storeHours && (
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4" style={{ color: primaryColor }} />
                        <p className="font-medium">Store Hours</p>
                      </div>
                      {Object.entries(store.storeHours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between">
                          <span className="capitalize">{day}:</span>
                          <span className="text-muted-foreground">{hours || 'Closed'}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Social Media Links */}
                  {(store.facebookUrl || store.instagramUrl || store.twitterUrl || store.tiktokUrl) && (
                    <div className="flex gap-2 pt-2">
                      {store.facebookUrl && (
                        <a href={store.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-70">
                          <Facebook className="h-5 w-5" style={{ color: primaryColor }} />
                        </a>
                      )}
                      {store.instagramUrl && (
                        <a href={store.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-70">
                          <Instagram className="h-5 w-5" style={{ color: primaryColor }} />
                        </a>
                      )}
                      {store.twitterUrl && (
                        <a href={store.twitterUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-70">
                          <Twitter className="h-5 w-5" style={{ color: primaryColor }} />
                        </a>
                      )}
                    </div>
                  )}
                </Card>
              </div>

              {/* Products Section */}
              <div className="lg:col-span-3">
                {/* Filters and Sort */}
                {!isLoading && products && products.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {PRODUCT_CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="name">Name: A-Z</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex border rounded-md ml-auto">
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
                )}

                {/* Loading State */}
                {isLoading && (
                  <ProductGridSkeleton count={8} />
                )}

                {/* Products Grid */}
                {!isLoading && filteredProducts.length > 0 && (
                  viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
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

                {/* Empty State */}
                {!isLoading && filteredProducts.length === 0 && (
                  <EmptyState
                    type="products"
                    title={selectedCategory !== 'all' ? 'No products in this category' : 'No products available'}
                    description={selectedCategory !== 'all' 
                      ? 'Try selecting a different category or check back later.'
                      : 'This store has no products yet. Check back soon!'}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
