
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { ShoppingCart, Loader2, Store } from 'lucide-react';
import { useProductsBySeller } from '@/lib/firebase/firestore/products';
import { useStoreByUserId } from '@/lib/firebase/firestore/stores';
import { useCart } from '@/lib/cart-context';
import { useParams, notFound } from 'next/navigation';


export default function SellerStorePage() {
  const params = useParams();
  const sellerId = params.sellerId as string;

  const { data: products, isLoading: isLoadingProducts } = useProductsBySeller(sellerId);
  const { data: store, isLoading: isLoadingStore } = useStoreByUserId(sellerId);
  const { addToCart } = useCart();

  const isLoading = isLoadingProducts || isLoadingStore;
  
  if (!isLoading && !store) {
    notFound();
  }

  // Apply storefront settings
  const primaryColor = store?.primaryColor || '#000000';
  const secondaryColor = store?.secondaryColor || '#666666';
  const fontFamily = store?.fontFamily || 'Inter';
  const layout = store?.storeLayout || store?.layout || 'grid';

  // Determine grid class based on layout
  const gridClass = layout === 'masonry' 
    ? 'max-w-7xl mx-auto columns-2 sm:columns-3 md:columns-4 gap-3 sm:gap-4 md:gap-6'
    : layout === 'list'
    ? 'max-w-7xl mx-auto space-y-4'
    : 'max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6';

  return (
    <>
        <section 
          className="py-8 sm:py-12 px-3 sm:px-4 md:px-6"
          style={{ fontFamily }}
        >
            {isLoading && (
              <div className="flex justify-center items-center h-64 sm:h-96">
                <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 animate-spin" style={{ color: primaryColor }} />
              </div>
            )}
            {!isLoading && store && (
                <div className="text-center mb-8 sm:mb-12">
                    <div 
                      className="inline-block h-16 w-16 sm:h-20 sm:w-20 rounded-full mb-3 sm:mb-4 flex items-center justify-center"
                      style={{ backgroundColor: secondaryColor }}
                    >
                        <Store className="h-8 w-8 sm:h-10 sm:w-10" style={{ color: primaryColor }} />
                    </div>
                    <h1 
                      className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold px-4"
                      style={{ color: primaryColor }}
                    >
                      {store.storeName}
                    </h1>
                    <p 
                      className="mt-2 text-sm sm:text-base md:text-lg max-w-3xl mx-auto px-4"
                      style={{ color: secondaryColor }}
                    >
                      {store.storeDescription}
                    </p>
                </div>
            )}
            
            {!isLoading && products && products.length > 0 && (
              <div className={gridClass}>
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
                            <p className="font-bold text-lg sm:text-xl" style={{ color: primaryColor }}>
                              ₦{product.price.toLocaleString()}
                            </p>
                             <Button 
                               size="icon" 
                               className="h-8 w-8" 
                               onClick={() => addToCart(product)}
                               style={{ backgroundColor: primaryColor, color: '#fff' }}
                             >
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
