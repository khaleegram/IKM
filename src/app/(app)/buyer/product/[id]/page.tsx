
'use client';

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, Minus, Plus, ShoppingCart, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


export default function ProductDetailPage({ params }: { params: { id: string } }) {

  const { toast } = useToast();

  const handleAddToCart = () => {
    toast({
      title: "✅ Item added to cart!",
      duration: 3000,
    });
  }

  // Mock data - in a real app, you'd fetch this based on params.id
  const product = {
    id: params.id,
    name: "Classic Leather Watch",
    price: "₦18,500",
    seller: "KicksRepublic",
    sellerId: "seller123",
    rating: 4.5,
    reviews: 128,
    description: "Discover timeless elegance with the Classic Leather Watch. Featuring a genuine leather strap and a precision quartz movement, this watch is the perfect accessory for any occasion. Its minimalist dial and stainless steel case offer a sophisticated look that never goes out of style. Water-resistant and durable, it's designed for everyday wear.",
    images: [
      "https://placehold.co/600x600.png",
      "https://placehold.co/600x600.png",
      "https://placehold.co/600x600.png",
    ]
  };

  const reviews = [
      {
          id: 1,
          author: 'Binta A.',
          rating: 5,
          date: '2 weeks ago',
          text: 'Absolutely love this watch! The quality is amazing for the price. It looks even better in person. Shipping was fast too.'
      },
      {
          id: 2,
          author: 'Chinedu E.',
          rating: 4,
          date: '1 month ago',
          text: 'Great watch, very stylish and comfortable. The leather strap is a bit stiff at first but softens up nicely. Good value.'
      }
  ]

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/buyer">
              <Button variant="ghost" size="icon">
                <ArrowLeft />
              </Button>
            </Link>
            <h1 className="text-lg font-bold font-headline truncate">Product Details</h1>
          </div>
          <Link href="/buyer/cart">
            <Button variant="ghost" size="icon">
                <ShoppingCart />
                <span className="sr-only">Shopping Cart</span>
            </Button>
          </Link>
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
              <h2 className="text-2xl sm:text-3xl font-bold font-headline">{product.name}</h2>
              <p className="text-2xl sm:text-3xl font-semibold text-primary">{product.price}</p>
              <div className="text-sm text-muted-foreground">
                Sold by: <Link href="#" className="text-accent hover:underline">{product.seller}</Link>
              </div>
               <Link href={`/messages/${product.sellerId}`}>
                <Button variant="outline" className="w-full sm:w-auto">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat with Seller
                </Button>
              </Link>
              <div className="flex items-center gap-2 flex-wrap">
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
              <Button size="lg" className="w-full mt-auto" onClick={handleAddToCart}>Add to Cart</Button>
            </div>
          </div>
          
          <Separator className="my-8" />

          <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl">Ratings & Reviews</CardTitle>
                <div className="flex items-center gap-2 pt-2">
                    <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'text-accent fill-accent' : 'text-muted-foreground/50'}`} />
                    ))}
                    </div>
                    <span className="text-muted-foreground text-sm">Overall {product.rating} from {product.reviews} reviews</span>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {reviews.map((review) => (
                    <div key={review.id} className="grid gap-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{review.author}</p>
                                <div className="flex items-center gap-2">
                                     <div className="flex items-center gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-accent fill-accent' : 'text-muted-foreground/50'}`} />
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{review.date}</p>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.text}</p>
                    </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
