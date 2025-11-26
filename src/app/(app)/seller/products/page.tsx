
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, FileWarning, Package, Loader2 } from "lucide-react";
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useProductsBySeller } from '@/lib/firebase/firestore/products';
import { useFirebase } from '@/firebase';


export default function ProductsPage() {
  const { auth } = useFirebase();
  const user = auth.currentUser;
  const { data: products, isLoading, error } = useProductsBySeller(user?.uid);

  const hasProducts = products && products.length > 0;

  const getStatus = (stock: number) => {
    if (stock > 0) return { text: 'Active', variant: 'support' as const };
    return { text: 'Out of Stock', variant: 'destructive' as const };
  }

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
        {isLoading && (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && error && (
          <div className="flex items-center justify-center h-full">
             <Card className="w-full max-w-lg text-center border-dashed shadow-none">
                <CardHeader>
                    <div className="mx-auto bg-destructive/10 rounded-full w-16 h-16 flex items-center justify-center">
                        <FileWarning className="w-8 h-8 text-destructive" />
                    </div>
                </CardHeader>
                <CardContent>
                    <CardTitle className="font-headline text-destructive">An Error Occurred</CardTitle>
                    <CardDescription className="mt-2">{error.message}</CardDescription>
                </CardContent>
            </Card>
          </div>
        )}
        {!isLoading && !hasProducts && !error && (
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
        {hasProducts && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const status = getStatus(product.stock);
              return (
                <Card key={product.id} className="flex flex-col">
                  <CardHeader className="p-0 relative">
                    <Image 
                      src={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/400`} 
                      alt={product.name} 
                      width={600} 
                      height={400} 
                      className="rounded-t-lg aspect-video object-cover" />
                  </CardHeader>
                  <CardContent className="p-4 flex-1">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="font-bold text-primary text-xl mt-1">₦{product.price.toLocaleString()}</p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between items-center">
                      <Badge variant={status.variant}>{status.text}</Badge>
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
            )})}
          </div>
        )}
      </main>
    </div>
  );
}
