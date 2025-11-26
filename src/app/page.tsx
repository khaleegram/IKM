
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { ShoppingCart, Loader2, ArrowRight, Search, Sparkles } from 'lucide-react';
import { useAllProducts } from '@/lib/firebase/firestore/products';
import { useCart } from '@/lib/cart-context';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export default function StoreHomePage() {
  const { data: products, isLoading: isLoadingProducts } = useAllProducts(8); // Limit to 8 products for the homepage
  const { addToCart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');

  const isLoading = isLoadingProducts;

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <section className="bg-muted/40">
        <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center py-16 sm:py-24 px-4">
          <div className="flex flex-col items-start text-left">
            <h1 className="text-4xl lg:text-6xl font-bold font-headline tracking-tight leading-tight">
              Unique Finds,
              <br />
              <span className="text-primary">Nigerian Hands.</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-md">
              Discover and shop for incredible products from independent sellers and artisans all across Nigeria.
            </p>
            <div className="w-full max-w-md mt-8 flex gap-2">
                <Link href="/stores" className="w-full">
                    <Button size="lg" className="w-full">
                        <Sparkles className="mr-2 h-5 w-5" />
                        Explore Stores
                    </Button>
                </Link>
                <Link href="/seller/dashboard" className="w-full">
                   <Button size="lg" variant="outline" className="w-full">Become a Seller</Button>
                </Link>
            </div>
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-4">
            <div className="space-y-4">
                <Image src="https://picsum.photos/seed/fashion/600/400" alt="Product 1" width={600} height={400} className="rounded-lg shadow-lg object-cover aspect-video" data-ai-hint="fashion accessory" />
                <Image src="https://picsum.photos/seed/crafts/600/800" alt="Product 2" width={600} height={800} className="rounded-lg shadow-lg object-cover aspect-[3/4]" data-ai-hint="handmade craft" />
            </div>
             <div className="space-y-4 pt-12">
                <Image src="https://picsum.photos/seed/pottery/600/800" alt="Product 3" width={600} height={800} className="rounded-lg shadow-lg object-cover aspect-[3/4]" data-ai-hint="pottery art" />
                <Image src="https://picsum.photos/seed/art/600/400" alt="Product 4" width={600} height={400} className="rounded-lg shadow-lg object-cover aspect-video" data-ai-hint="local art" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-3xl font-bold font-headline text-center sm:text-left">Featured Products</h2>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search products..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && filteredProducts.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="group overflow-hidden relative">
                  <Link href={`/product/${product.id}`}>
                    <CardHeader className="p-0">
                      <Image 
                        src={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/400`} 
                        alt={product.name} 
                        width={600} 
                        height={400} 
                        className="aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                        data-ai-hint="product image"
                      />
                    </CardHeader>
                  </Link>
                  <CardContent className="p-3 sm:p-4">
                    <h3 className="font-semibold text-base sm:text-lg truncate">{product.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <p className="font-bold text-primary text-lg sm:text-xl">₦{product.price.toLocaleString()}</p>
                      <Button size="icon" className="h-8 w-8" onClick={() => addToCart(product)}>
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {!isLoading && (products.length === 0 || filteredProducts.length === 0) && (
            <div className="text-center text-muted-foreground py-16">
              {products.length > 0 && filteredProducts.length === 0 ? (
                <p className="text-lg">No products found for "{searchTerm}".</p>
              ) : (
                <>
                  <p className="text-lg">No products have been listed yet.</p>
                  <p>Check back soon to see what our sellers have to offer!</p>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
