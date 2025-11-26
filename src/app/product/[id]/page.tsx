
'use client';

import { Button } from "@/components/ui/button";
import { IkmLogo } from "@/components/icons";
import { Heart, ShoppingCart, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useProduct } from "@/lib/firebase/firestore/products";
import React from "react";
import { useCart } from "@/lib/cart-context";

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const resolvedParams = React.use(params);
  const { data: product, isLoading, error } = useProduct(resolvedParams.id);
  const { addToCart } = useCart();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!product || error) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 sm:p-6 flex justify-between items-center border-b">
        <Link href="/">
            <IkmLogo className="w-auto h-8" />
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost">Seller Hub</Button>
          </Link>
          <Link href="/wishlist">
            <Button>My Wishlist</Button>
          </Link>
          <Link href="/cart">
              <Button size="icon" variant="outline">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Shopping Cart</span>
              </Button>
            </Link>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div>
                <Card className="overflow-hidden">
                    <CardContent className="p-0">
                         <Image 
                            src={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/600`}
                            alt={product.name} 
                            width={600} 
                            height={600} 
                            className="w-full h-full object-cover aspect-square"
                            data-ai-hint="product image"
                         />
                    </CardContent>
                </Card>
            </div>
            <div className="flex flex-col justify-center">
                <h1 className="text-3xl sm:text-4xl font-bold font-headline">{product.name}</h1>
                <p className="font-bold text-primary text-3xl mt-2">₦{product.price.toLocaleString()}</p>
                <p className="mt-4 text-muted-foreground text-base leading-relaxed">
                    {product.description}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <Button size="lg" className="w-full sm:w-auto" onClick={() => addToCart(product)}>
                        <ShoppingCart className="mr-2"/>
                        Add to Cart
                    </Button>
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                        <Heart className="mr-2" />
                        Save to Wishlist
                    </Button>
                </div>
            </div>
        </div>
      </main>
      <footer className="p-6 text-center text-sm text-muted-foreground border-t">
        <p>&copy; {new Date().getFullYear()} IKM. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
