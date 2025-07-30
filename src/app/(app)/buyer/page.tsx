
'use client';

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const initialProducts = [
  {
    id: 1,
    name: "Classic Leather Watch",
    price: "$150.00",
    image: "https://placehold.co/600x400.png",
    hint: "watch",
    isWishlisted: false,
  },
  {
    id: 2,
    name: "Wireless Headphones",
    price: "$99.99",
    image: "https://placehold.co/600x400.png",
    hint: "headphones",
    isWishlisted: true,
  },
  {
    id: 3,
    name: "Modern Bookshelf",
    price: "$250.00",
    image: "https://placehold.co/600x400.png",
    hint: "furniture",
    isWishlisted: false,
  },
  {
    id: 4,
    name: "Gourmet Coffee Blend",
    price: "$25.50",
    image: "https://placehold.co/600x400.png",
    hint: "coffee",
    isWishlisted: false,
  },
  {
    id: 5,
    name: "Yoga Mat",
    price: "$40.00",
    image: "https://placehold.co/600x400.png",
    hint: "fitness",
    isWishlisted: false,
  },
  {
    id: 6,
    name: "Scented Candle Set",
    price: "$35.00",
    image: "https://placehold.co/600x400.png",
    hint: "home decor",
    isWishlisted: true,
  },
  {
    id: 7,
    name: "Portable Blender",
    price: "$55.00",
    image: "https://placehold.co/600x400.png",
    hint: "kitchen appliance",
    isWishlisted: false,
  },
  {
    id: 8,
    name: "Hardcover Journal",
    price: "$18.00",
    image: "https://placehold.co/600x400.png",
    hint: "stationery",
    isWishlisted: false,
  },
];

export default function BuyerPage() {
    const { toast } = useToast();
    const [products, setProducts] = useState(initialProducts);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        toast({
            title: "✅ Item added to cart!",
            duration: 3000,
        });
    }
    
    const handleWishlistToggle = (e: React.MouseEvent, productId: number) => {
        e.preventDefault();
        e.stopPropagation();
        setProducts(currentProducts => {
            const newProducts = currentProducts.map(p => {
                if (p.id === productId) {
                    return { ...p, isWishlisted: !p.isWishlisted };
                }
                return p;
            });
            const product = newProducts.find(p => p.id === productId);
            if(product?.isWishlisted) {
                 toast({
                    title: "❤️ Added to Wishlist",
                    duration: 2000,
                });
            }
            return newProducts;
        });
    }

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 border-b">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold font-headline">Marketplace</h1>
                <p className="text-muted-foreground">Discover products from thousands of sellers.</p>
            </div>
             <Link href="/buyer/cart">
                <Button variant="outline" size="icon">
                    <ShoppingCart />
                    <span className="sr-only">Shopping Cart</span>
                </Button>
            </Link>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search for products..." className="pl-10" />
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
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
      </main>
    </div>
  );
}
