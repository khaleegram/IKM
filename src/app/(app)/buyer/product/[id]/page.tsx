
'use client';

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export default function ProductDetailPage({ params }: { params: { id: string } }) {

  // Mock data - in a real app, you'd fetch this based on params.id
  const product = {
    id: params.id,
    name: "Classic Leather Watch",
    price: "₦18,500",
    seller: "KicksRepublic",
    rating: 4.5,
    reviews: 128,
    description: "Discover timeless elegance with the Classic Leather Watch. Featuring a genuine leather strap and a precision quartz movement, this watch is the perfect accessory for any occasion. Its minimalist dial and stainless steel case offer a sophisticated look that never goes out of style. Water-resistant and durable, it's designed for everyday wear.",
    images: [
      "https://placehold.co/600x600.png",
      "https://placehold.co/600x600.png",
      "https://placehold.co/600x600.png",
    ]
  };

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 border-b flex items-center gap-4">
        <Link href="/buyer">
          <Button variant="ghost" size="icon">
            <ArrowLeft />
          </Button>
        </Link>
        <h1 className="text-xl font-bold font-headline">Product Details</h1>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <Carousel className="w-full">
                <CarouselContent>
                  {product.images.map((img, index) => (
                    <CarouselItem key={index}>
                      <Card className="overflow-hidden">
                        <CardContent className="p-0">
                          <Image
                            src={img}
                            alt={`${product.name} image ${index + 1}`}
                            width={600}
                            height={600}
                            className="object-cover w-full aspect-square"
                            data-ai-hint="watch product photo"
                          />
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            </div>
            <div className="flex flex-col gap-4">
              <h2 className="text-3xl font-bold font-headline">{product.name}</h2>
              <p className="text-3xl font-semibold text-primary">{product.price}</p>
              <div className="text-sm text-muted-foreground">
                Sold by: <Link href="#" className="text-accent hover:underline">{product.seller}</Link>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'text-accent fill-accent' : 'text-muted-foreground'}`} />
                  ))}
                </div>
                <span className="text-muted-foreground text-sm">{product.rating} stars ({product.reviews} reviews)</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Product Description</h3>
                <p className="text-muted-foreground text-sm">{product.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-medium">Quantity:</p>
                <div className="flex items-center gap-2 border rounded-md">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">1</span>
                   <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button size="lg" className="w-full mt-auto">Add to Cart</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
