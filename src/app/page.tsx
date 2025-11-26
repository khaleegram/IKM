
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IkmLogo } from "@/components/icons";
import Image from 'next/image';
import { ShoppingCart, Loader2, ArrowRight } from 'lucide-react';
import { useAllProducts } from '@/lib/firebase/firestore/products';
import { useAllUserProfiles } from '@/lib/firebase/firestore/users';
import { useCart } from '@/lib/cart-context';

export default function StoreHomePage() {
  const { data: products, isLoading: isLoadingProducts } = useAllProducts(8); // Limit to 8 products for the homepage
  const { addToCart } = useCart();

  const isLoading = isLoadingProducts;

  return (
    <>
        <section className="py-12 px-4 sm:px-6">
            <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-bold font-headline">Welcome to IKM Marketplace</h1>
                <p className="mt-2 text-lg text-muted-foreground">Discover unique products from independent sellers across Nigeria.</p>
                 <Link href="/stores">
                    <Button className="mt-6" size="lg">
                        Browse All Stores <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </Link>
            </div>
            
            <div className="max-w-7xl mx-auto">
                <h2 className="text-2xl font-bold font-headline mb-6">Featured Products</h2>
                {isLoading && (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  </div>
                )}

                {!isLoading && products && products.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {products.map((product) => (
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
                 {!isLoading && (!products || products.length === 0) && (
                  <div className="text-center text-muted-foreground py-16">
                    <p className="text-lg">No products have been listed yet.</p>
                    <p>Check back soon to see what our sellers have to offer!</p>
                  </div>
                )}
            </div>
        </section>
    </>
  );
}
