
'use client';

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const initialProducts = [
    {
        id: 2,
        name: "Wireless Headphones",
        price: "$99.99",
        image: "https://placehold.co/600x400.png",
        hint: "headphones",
        isWishlisted: true,
    },
    {
        id: 6,
        name: "Scented Candle Set",
        price: "$35.00",
        image: "https://placehold.co/600x400.png",
        hint: "home decor",
        isWishlisted: true,
    },
];

export default function WishlistPage() {
    const { toast } = useToast();
    const [products, setProducts] = useState(initialProducts);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toast({
            title: "✅ Item added to cart!",
            duration: 3000,
        });
    }

    const handleWishlistToggle = (e: React.MouseEvent, productId: number) => {
        e.preventDefault();
        e.stopPropagation();
        setProducts(currentProducts => currentProducts.filter(p => p.id !== productId));
        toast({
            title: "Removed from Wishlist",
            duration: 2000,
        });
    }

  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 sm:p-6 bg-background border-b">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold font-headline">My Wishlist</h1>
                <p className="text-muted-foreground">Your collection of saved items.</p>
            </div>
             <Link href="/buyer/cart">
                <Button variant="outline" size="icon">
                    <ShoppingCart />
                    <span className="sr-only">Shopping Cart</span>
                </Button>
            </Link>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
                <Link key={product.id} href={`/buyer/product/${product.id}`} className="flex">
                <Card className="overflow-hidden transition-shadow hover:shadow-lg w-full flex flex-col group/product">
                    <CardHeader className="p-0 relative">
                    <Image
                        src={product.image}
                        alt={product.name}
                        width={600}
                        height={400}
                        className="object-cover w-full h-48"
                        data-ai-hint={product.hint}
                    />
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="absolute top-2 right-2 rounded-full bg-background/70 hover:bg-background"
                        onClick={(e) => handleWishlistToggle(e, product.id)}
                    >
                        <Heart className={cn("h-5 w-5 text-destructive", product.isWishlisted && "fill-destructive")} />
                    </Button>
                    </CardHeader>
                    <CardContent className="p-4 flex-grow">
                    <CardTitle className="text-lg font-semibold font-headline">{product.name}</CardTitle>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between items-center">
                    <p className="font-semibold text-primary">{product.price}</p>
                    <Button onClick={handleAddToCart}>Add to Cart</Button>
                    </CardFooter>
                </Card>
                </Link>
            ))}
            </div>
        ) : (
            <div className="text-center py-20">
                <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h2 className="mt-4 text-xl font-semibold">Your wishlist is empty</h2>
                <p className="mt-2 text-sm text-muted-foreground">Tap the heart icon on products to save them for later.</p>
                <Link href="/buyer">
                    <Button className="mt-6">Discover Products</Button>
                </Link>
            </div>
        )}
      </main>
    </div>
  );
}
