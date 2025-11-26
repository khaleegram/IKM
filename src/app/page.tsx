
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IkmLogo } from "@/components/icons";
import Image from 'next/image';
import { Heart, ShoppingCart } from 'lucide-react';

// Mock product data - in a real app, this would come from a database
const products = [
    { id: '1', name: 'Handmade Ankara Bag', price: '₦15,000', image: '1' },
    { id: '2', name: 'Beaded Necklace', price: '₦8,500', image: '2' },
    { id: '3', name: 'Custom Print T-Shirt', price: '₦12,000', image: '3' },
    { id: '4', name: 'Woven Aso-Oke Slippers', price: '₦18,000', image: '4' },
    { id: '5', name: 'Adire Silk Scarf', price: '₦9,500', image: '5' },
    { id: '6', name: 'Leather Talking Drum Bag', price: '₦22,000', image: '6' },
];

export default function StoreHomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 sm:p-6 flex justify-between items-center border-b">
        <Link href="/">
          <IkmLogo className="w-auto h-8" />
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/seller/dashboard">
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
      <main className="flex-1">
        <section className="py-12 px-4 sm:px-6">
            <div className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-bold font-headline">Mary's Store</h1>
                <p className="mt-2 text-lg text-muted-foreground">Handmade Crafts & Apparel</p>
            </div>
            
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <Card key={product.id} className="group overflow-hidden">
                  <Link href={`/product/${product.id}`}>
                    <CardHeader className="p-0 relative">
                      <Image 
                        src={`https://picsum.photos/seed/${product.image}/600/400`} 
                        alt={product.name} 
                        width={600} 
                        height={400} 
                        className="aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                        data-ai-hint="product image"
                      />
                       <Button size="icon" variant="secondary" className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/70 hover:bg-background">
                         <Heart className="h-4 w-4" />
                       </Button>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                      <h3 className="font-semibold text-base sm:text-lg truncate">{product.name}</h3>
                      <p className="font-bold text-primary text-lg sm:text-xl mt-1">{product.price}</p>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
        </section>
      </main>
      <footer className="p-6 text-center text-sm text-muted-foreground border-t">
        <p>&copy; {new Date().getFullYear()} IKM. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
