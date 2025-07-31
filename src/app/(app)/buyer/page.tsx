
'use client';

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, Heart, Shirt, Laptop, Home, BookOpen, Star, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const initialProducts = [
  {
    id: 1,
    name: "Classic Leather Watch",
    price: "₦18,500",
    image: "https://placehold.co/600x400.png",
    hint: "watch",
    isWishlisted: false,
  },
  {
    id: 2,
    name: "Wireless Headphones",
    price: "₦65,500",
    image: "https://placehold.co/600x400.png",
    hint: "headphones",
    isWishlisted: true,
  },
  {
    id: 3,
    name: "Modern Bookshelf",
    price: "₦80,000",
    image: "https://placehold.co/600x400.png",
    hint: "furniture",
    isWishlisted: false,
  },
  {
    id: 4,
    name: "Gourmet Coffee Blend",
    price: "₦12,500",
    image: "https://placehold.co/600x400.png",
    hint: "coffee",
    isWishlisted: false,
  },
];

const categories = [
    { name: "Fashion", icon: Shirt },
    { name: "Electronics", icon: Laptop },
    { name: "Home", icon: Home },
    { name: "Books", icon: BookOpen },
    { name: "See All", icon: ChevronRight },
]

const banners = [
    { id: 1, image: "https://placehold.co/1200x600.png", hint: "sale banner", title: "Free Delivery Weekend", description: "On all orders above ₦50,000" },
    { id: 2, image: "https://placehold.co/1200x600.png", hint: "seller storefront", title: "Featured Seller: KicksRepublic", description: "The best sneakers in town" },
]

export default function BuyerPage() {
    const { toast } = useToast();
    const [products, setProducts] = useState(initialProducts);

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
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 sm:p-6 bg-background border-b sticky top-0 z-20">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold font-headline">Discover</h1>
                <p className="text-muted-foreground">Your daily feed of curated goods.</p>
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
          <Input placeholder="Search for products, sellers, collections..." className="pl-10" />
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        
        {/* Banner Carousel */}
        <section className="p-4 sm:p-6">
            <Carousel opts={{ loop: true }}>
                <CarouselContent>
                    {banners.map(banner => (
                         <CarouselItem key={banner.id}>
                           <Card className="overflow-hidden relative text-white">
                                <Image src={banner.image} alt={banner.title} width={1200} height={600} data-ai-hint={banner.hint} className="brightness-50" />
                                <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black/60 to-transparent">
                                    <h2 className="text-2xl font-bold font-headline">{banner.title}</h2>
                                    <p>{banner.description}</p>
                                </div>
                           </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </section>

        {/* Category Links */}
        <section className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 sm:-mx-6 px-4 sm:px-6">
                {categories.map(cat => (
                    <Link href="#" key={cat.name} className="flex flex-col items-center gap-2 flex-shrink-0 w-20">
                        <div className="w-16 h-16 rounded-full bg-background border flex items-center justify-center">
                            <cat.icon className="h-7 w-7 text-primary"/>
                        </div>
                        <p className="text-xs font-medium text-center">{cat.name}</p>
                    </Link>
                ))}
            </div>
        </section>

        {/* Main Feed */}
        <div className="p-4 sm:p-6 pt-0 space-y-8">
            {/* Standard Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.slice(0,2).map((product) => (
                    <ProductCard key={product.id} product={product} onWishlistToggle={handleWishlistToggle} />
                ))}
            </div>

            {/* New Seller Spotlight Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">New Seller Spotlight</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-center gap-6">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src="https://placehold.co/150x150.png" data-ai-hint="logo business" />
                        <AvatarFallback>AC</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow text-center sm:text-left">
                        <p className="font-bold text-lg">Amina's Creations</p>
                        <p className="text-sm text-muted-foreground mt-1">Stunning, handcrafted jewelry inspired by West African heritage and modern design.</p>
                         <div className="flex gap-2 justify-center sm:justify-start mt-4">
                            <Image src="https://placehold.co/100x100.png" width={80} height={80} alt="product" className="rounded-md" data-ai-hint="jewelry" />
                            <Image src="https://placehold.co/100x100.png" width={80} height={80} alt="product" className="rounded-md" data-ai-hint="earrings" />
                            <Image src="https://placehold.co/100x100.png" width={80} height={80} alt="product" className="rounded-md" data-ai-hint="necklace" />
                         </div>
                    </div>
                </CardContent>
            </Card>

             {/* Top Rated Card */}
            <Card className="bg-gradient-to-br from-accent/20 to-transparent">
                <CardContent className="p-4 flex gap-4 items-center">
                    <Image src="https://placehold.co/200x200.png" width={120} height={120} alt="Top rated product" data-ai-hint="leather bag" className="rounded-lg object-cover" />
                    <div className="space-y-2">
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-accent fill-accent" />)}
                        </div>
                        <p className="font-semibold text-lg font-headline">Hand-Stitched Leather Tote</p>
                        <p className="text-sm text-muted-foreground italic">"The quality is just unreal. Best bag I've ever owned. Worth every penny." - Fatima D.</p>
                        <Button variant="secondary" size="sm" className="mt-2">Shop Now</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Standard Product Grid Continued */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.slice(2).map((product) => (
                    <ProductCard key={product.id} product={product} onWishlistToggle={handleWishlistToggle} />
                ))}
            </div>

            {/* Collection Card */}
            <Card className="overflow-hidden">
                <CardHeader className="p-4 bg-muted/50">
                    <CardTitle className="font-headline">IKM Picks: Rainy Season Essentials</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <Image src="https://placehold.co/200x200.png" width={200} height={200} alt="collection item" data-ai-hint="raincoat" className="rounded-md" />
                        <Image src="https://placehold.co/200x200.png" width={200} height={200} alt="collection item" data-ai-hint="waterproof boots" className="rounded-md" />
                        <Image src="https://placehold.co/200x200.png" width={200} height={200} alt="collection item" data-ai-hint="umbrella" className="rounded-md" />
                        <Image src="https://placehold.co/200x200.png" width={200} height={200} alt="collection item" data-ai-hint="scented candle" className="rounded-md" />
                    </div>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}


const ProductCard = ({ product, onWishlistToggle }: { product: typeof initialProducts[0], onWishlistToggle: (e: React.MouseEvent, id: number) => void }) => {
    const { toast } = useToast();

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toast({
            title: "✅ Item added to cart!",
            duration: 3000,
        });
    }

    return (
        <Link href={`/buyer/product/${product.id}`} className="flex">
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
                onClick={(e) => onWishlistToggle(e, product.id)}
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
    );
}

