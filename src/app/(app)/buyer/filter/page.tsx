
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const categories = ["Fashion", "Electronics", "Home", "Books", "Beauty", "Sports"];

const StarRatingSelector = ({ rating, setRating }: { rating: number, setRating: (rating: number) => void }) => {
  return (
    <div className="flex items-center gap-2">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        return (
          <button
            key={starValue}
            type="button"
            onClick={() => setRating(starValue)}
            className="focus:outline-none flex items-center gap-1"
          >
            <Star
              className={cn(
                'w-6 h-6 cursor-pointer transition-colors',
                starValue <= rating ? 'text-accent fill-accent' : 'text-muted-foreground/30'
              )}
            />
          </button>
        );
      })}
       <span className="text-sm text-muted-foreground">{rating > 0 && `${rating} Stars & Up`}</span>
    </div>
  );
};


export default function FilterPage() {
  const { toast } = useToast();
  const [priceRange, setPriceRange] = useState([5000, 50000]);
  const [sellerRating, setSellerRating] = useState(0);

  const handleShowResults = () => {
    toast({
      title: "Filters Applied",
      description: "Showing results based on your selection.",
      duration: 3000,
    });
  }

  const handleClear = () => {
    setPriceRange([0, 100000]);
    setSellerRating(0);
    // You would also clear category and other states here
     toast({
      title: "Filters Cleared",
      description: "Showing all results.",
      duration: 3000,
    });
  }

  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 sm:p-6 bg-background border-b flex items-center gap-4 sticky top-0 z-10">
        <Link href="/buyer">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold font-headline">Filter & Sort</h1>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-lg">Sort By</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup defaultValue="relevance">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="relevance" id="r1" />
                    <Label htmlFor="r1">Relevance</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="newest" id="r2" />
                    <Label htmlFor="r2">Newest</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="price_asc" id="r3" />
                    <Label htmlFor="r3">Price: Low to High</Label>
                  </div>
                   <div className="flex items-center space-x-2">
                    <RadioGroupItem value="price_desc" id="r4" />
                    <Label htmlFor="r4">Price: High to Low</Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-lg">Price Range</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <Slider
                defaultValue={priceRange}
                max={100000}
                step={1000}
                onValueChange={setPriceRange}
                className="mb-4"
              />
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <Input className="w-24 h-8" value={`₦${priceRange[0].toLocaleString()}`} readOnly />
                <Input className="w-24 h-8 text-right" value={`₦${priceRange[1].toLocaleString()}`} readOnly />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-lg">Categories</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {categories.map((cat) => (
                 <div key={cat} className="flex items-center space-x-2">
                    <Checkbox id={cat.toLowerCase()} />
                    <Label htmlFor={cat.toLowerCase()}>{cat}</Label>
                  </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-lg">Seller Rating</CardTitle>
            </CardHeader>
            <CardContent>
                <StarRatingSelector rating={sellerRating} setRating={setSellerRating} />
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle className="font-headline text-lg">Location</CardTitle>
            </CardHeader>
            <CardContent>
                <Input placeholder="Enter a city e.g. Abuja" />
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="sticky bottom-0 bg-background border-t p-4 z-10">
        <div className="max-w-2xl mx-auto flex gap-4">
            <Button variant="outline" className="flex-1" onClick={handleClear}>Clear All</Button>
            <Button className="flex-1" size="lg" onClick={handleShowResults}>Show Results</Button>
        </div>
      </footer>
    </div>
  );
}
