
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { ShoppingCart, Loader2, Store } from 'lucide-react';
import { useProductsBySeller } from '@/lib/firebase/firestore/products';
import { useUserProfile } from '@/lib/firebase/firestore/users';
import { useCart } from '@/lib/cart-context';
import { useParams, notFound } from 'next/navigation';


export default function SellerStorePage() {
  const params = useParams();
  const sellerId = params.sellerId as string;

  const { data: products, isLoading: isLoadingProducts } = useProductsBySeller(sellerId);
  const { data: sellerProfile, isLoading: isLoadingProfile } = useUserProfile(sellerId);
  const { addToCart } = useCart();

  const isLoading = isLoadingProducts || isLoadingProfile;
  
  if (!isLoading && !sellerProfile) {
    notFound();
  }

  return (
    <>
        <section className="py-12 px-4 sm:px-6">
            {isLoading && (
              <div className="flex justify-center items-center h-96">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
            )}
            {!isLoading && sellerProfile && (
                <div className="text-center mb-12">
                    <div className="inline-block h-20 w-20 rounded-full bg-secondary mb-4 flex items-center justify-center">
                        <Store className="h-10 w-10 text-secondary-foreground" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold font-headline">{sellerProfile.storeName}</h1>
                    <p className="mt-2 text-lg text-muted-foreground max-w-3xl mx-auto">{sellerProfile.storeDescription}</p>
                </div>
            )}
            
            {!isLoading && products && products.length > 0 && (
              <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
                <h2 className="text-xl font-semibold">This store has no products yet.</h2>
                <p className="mt-2">Check back soon to see what they have to offer!</p>
              </div>
            )}
        </section>
    </>
  );
}
