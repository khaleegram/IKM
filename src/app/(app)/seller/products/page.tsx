
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, FileWarning } from "lucide-react";
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock product data - in a real app, this would come from a database
const products = [
    { id: '1', name: 'Handmade Ankara Bag', price: '₦15,000', stock: 25, status: 'Active', image: '/placeholder-bag.jpg' },
    { id: '2', name: 'Beaded Necklace', price: '₦8,500', stock: 0, status: 'Out of Stock', image: '/placeholder-necklace.jpg' },
    { id: '3', name: 'Custom Print T-Shirt', price: '₦12,000', stock: 150, status: 'Active', image: '/placeholder-shirt.jpg' },
];

export default function ProductsPage() {
  const hasProducts = products.length > 0;

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 bg-background border-b flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">My Products</h1>
          <p className="text-muted-foreground">Manage your inventory and view product performance.</p>
        </div>
        <Link href="/seller/products/new">
          <Button>
            <Plus className="mr-2" /> Add Product
          </Button>
        </Link>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        {hasProducts ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Card key={product.id} className="flex flex-col">
                <CardHeader className="p-0 relative">
                  <Image src={`https://picsum.photos/seed/${product.id}/600/400`} alt={product.name} width={600} height={400} className="rounded-t-lg aspect-video object-cover" />
                </CardHeader>
                <CardContent className="p-4 flex-1">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="font-bold text-primary text-xl mt-1">{product.price}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between items-center">
                    <Badge variant={product.status === 'Active' ? 'support' : 'destructive'}>{product.status}</Badge>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>View Performance</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-lg text-center border-dashed shadow-none">
              <CardHeader>
                <div className="mx-auto bg-secondary rounded-full w-16 h-16 flex items-center justify-center">
                    <Package className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="font-headline">You have no products yet</CardTitle>
                <CardDescription className="mt-2">Get started by adding your first product to your store.</CardDescription>
              </CardContent>
              <CardFooter className="justify-center">
                <Link href="/seller/products/new">
                    <Button>
                        <Plus className="mr-2" /> Add Your First Product
                    </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
