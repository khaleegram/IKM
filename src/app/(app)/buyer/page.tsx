import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const products = [
  {
    id: 1,
    name: "Classic Leather Watch",
    price: "$150.00",
    image: "https://placehold.co/600x400.png",
    hint: "watch",
  },
  {
    id: 2,
    name: "Wireless Headphones",
    price: "$99.99",
    image: "https://placehold.co/600x400.png",
    hint: "headphones",
  },
  {
    id: 3,
    name: "Modern Bookshelf",
    price: "$250.00",
    image: "https://placehold.co/600x400.png",
    hint: "furniture",
  },
  {
    id: 4,
    name: "Gourmet Coffee Blend",
    price: "$25.50",
    image: "https://placehold.co/600x400.png",
    hint: "coffee",
  },
  {
    id: 5,
    name: "Yoga Mat",
    price: "$40.00",
    image: "https://placehold.co/600x400.png",
    hint: "fitness",
  },
  {
    id: 6,
    name: "Scented Candle Set",
    price: "$35.00",
    image: "https://placehold.co/600x400.png",
    hint: "home decor",
  },
  {
    id: 7,
    name: "Portable Blender",
    price: "$55.00",
    image: "https://placehold.co/600x400.png",
    hint: "kitchen appliance",
  },
  {
    id: 8,
    name: "Hardcover Journal",
    price: "$18.00",
    image: "https://placehold.co/600x400.png",
    hint: "stationery",
  },
];

export default function BuyerPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 border-b">
        <h1 className="text-2xl font-bold font-headline">Marketplace</h1>
        <p className="text-muted-foreground">Discover products from thousands of sellers.</p>
        <div className="relative mt-4 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search for products..." className="pl-10" />
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden transition-shadow hover:shadow-lg">
              <CardHeader className="p-0">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={600}
                  height={400}
                  className="object-cover w-full h-48"
                  data-ai-hint={product.hint}
                />
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-lg font-semibold font-headline">{product.name}</CardTitle>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <p className="font-semibold text-primary">{product.price}</p>
                <Button>Add to Cart</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
