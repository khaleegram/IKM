
import { Button } from "@/components/ui/button";
import { IkmLogo } from "@/components/icons";
import { Heart, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

// Mock product data - in a real app, this would come from a database
const products = [
    { id: '1', name: 'Handmade Ankara Bag', price: '₦15,000', description: 'A beautifully handcrafted bag made with authentic Ankara fabric. Perfect for any occasion, combining traditional style with modern functionality. Features a spacious interior and a durable leather strap.', image: '1' },
    { id: '2', name: 'Beaded Necklace', price: '₦8,500', description: 'An elegant, multi-strand beaded necklace, handcrafted by local artisans. Adds a vibrant splash of color to any outfit.', image: '2' },
    { id: '3', name: 'Custom Print T-Shirt', price: '₦12,000', description: 'High-quality cotton t-shirt featuring a unique, custom-designed print inspired by Nigerian culture. Soft, breathable, and durable.', image: '3' },
    { id: '4', name: 'Woven Aso-Oke Slippers', price: '₦18,000', description: 'Comfortable and stylish slippers made from traditional Aso-Oke fabric. Features a non-slip sole and a cushioned footbed for all-day comfort.', image: '4' },
    { id: '5', name: 'Adire Silk Scarf', price: '₦9,500', description: 'A luxurious silk scarf hand-dyed with traditional Adire patterns. This versatile accessory can be styled in numerous ways.', image: '5' },
    { id: '6', name: 'Leather Talking Drum Bag', price: '₦22,000', description: 'A unique, drum-shaped handbag made from genuine leather, inspired by the iconic Nigerian talking drum. A true statement piece.', image: '6' },
];

const getProductById = (id: string) => {
    return products.find(p => p.id === id);
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = getProductById(params.id);

  if (!product) {
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
          <Link href="#">
            <Button>My Wishlist</Button>
          </Link>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div>
                <Card className="overflow-hidden">
                    <CardContent className="p-0">
                         <Image 
                            src={`https://picsum.photos/seed/${product.image}/600/600`}
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
                <p className="font-bold text-primary text-3xl mt-2">{product.price}</p>
                <p className="mt-4 text-muted-foreground text-base leading-relaxed">
                    {product.description}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <Button size="lg" className="w-full sm:w-auto">
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
        <p>&copy; {new Date().getFullYear()} Mary's Store. Powered by IKM.</p>
      </footer>
    </div>
  );
}
