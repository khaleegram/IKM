
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

// Mock data, in a real app you'd fetch this based on params.id
const orderToReview = {
  productId: 'prod123',
  productName: 'Classic Leather Watch',
  productImage: 'https://placehold.co/200x200.png',
  riderName: 'Jide Okoro',
  riderImage: 'https://placehold.co/100x100.png',
};

const StarRating = ({ rating, setRating }: { rating: number, setRating: (rating: number) => void }) => {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        return (
          <button
            key={starValue}
            type="button"
            onClick={() => setRating(starValue)}
            className="focus:outline-none"
          >
            <Star
              className={cn(
                'w-8 h-8 cursor-pointer transition-colors',
                starValue <= rating ? 'text-accent fill-accent' : 'text-muted-foreground/30'
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

export default function WriteReviewPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const [productRating, setProductRating] = useState(0);
  const [riderRating, setRiderRating] = useState(0);

  const handleSubmitReview = () => {
    toast({
      title: '🎉 Review Submitted!',
      description: 'Thank you for your feedback. It helps our community grow.',
      duration: 5000,
    });
  };

  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 sm:p-6 bg-background border-b flex items-center gap-4">
        <Link href={`/buyer/orders/${params.id}`}>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold font-headline">Submit Your Review</h1>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-lg">How was your experience?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Review Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Image
                    src={orderToReview.productImage}
                    alt={orderToReview.productName}
                    width={80}
                    height={80}
                    className="rounded-md object-cover"
                    data-ai-hint="watch product photo"
                  />
                  <div>
                    <p className="text-sm text-muted-foreground">Product</p>
                    <p className="font-semibold">{orderToReview.productName}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-sm">Your product rating:</p>
                  <StarRating rating={productRating} setRating={setProductRating} />
                </div>
                <div className="space-y-2">
                  <Textarea placeholder="Tell us about the product..." rows={4} />
                </div>
              </div>

              <Separator />

              {/* Rider Review Section */}
              <div className="space-y-4">
                 <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={orderToReview.riderImage} alt={orderToReview.riderName} data-ai-hint="person portrait" />
                    <AvatarFallback>{orderToReview.riderName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery by</p>
                    <p className="font-semibold">{orderToReview.riderName}</p>
                  </div>
                </div>
                <div className="space-y-2">
                   <p className="font-medium text-sm">Your delivery rating:</p>
                  <StarRating rating={riderRating} setRating={setRiderRating} />
                </div>
                <div className="space-y-2">
                  <Textarea placeholder="How was the delivery?" rows={4} />
                </div>
              </div>

              <div className="pt-4">
                <Button size="lg" className="w-full" onClick={handleSubmitReview}>
                  Submit Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
