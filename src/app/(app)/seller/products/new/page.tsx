
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, DollarSign } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";


export default function NewProductPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically handle form submission, e.g., send data to an API
        toast({
            title: "Product Added!",
            description: "Your new product has been successfully added to your store.",
        });
        router.push('/seller/products');
    }

    return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 bg-background border-b">
        <div>
          <h1 className="text-2xl font-bold font-headline">Add a New Product</h1>
          <p className="text-muted-foreground">Fill out the details below to list a new item in your store.</p>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Details</CardTitle>
                            <CardDescription>Provide a clear and concise description of your product.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="productName">Product Name</Label>
                                <Input id="productName" placeholder="e.g., Handmade Ankara Bag" />
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" placeholder="Describe the product, its features, materials, and what makes it special." rows={6} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Images</CardTitle>
                            <CardDescription>Upload high-quality images of your product.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border-2 border-dashed border-muted rounded-lg p-12 flex flex-col items-center justify-center text-center">
                                <Upload className="w-10 h-10 text-muted-foreground" />
                                <p className="mt-4 text-muted-foreground">Drag & drop images here, or</p>
                                <Button type="button" variant="secondary" className="mt-2">Browse Files</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                         <CardHeader>
                            <CardTitle>Pricing & Inventory</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <Label htmlFor="price">Price (₦)</Label>
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground mt-2.5" />
                                <Input id="price" type="number" placeholder="15000" className="pl-8" />
                            </div>
                             <div>
                                <Label htmlFor="stock">Stock Quantity</Label>
                                <Input id="stock" type="number" placeholder="25" />
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                         <CardHeader>
                            <CardTitle>Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Label htmlFor="category">Product Category</Label>
                            <Input id="category" placeholder="e.g., Fashion, Bags" />
                        </CardContent>
                    </Card>
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
                <Link href="/seller/products">
                    <Button variant="outline">Cancel</Button>
                </Link>
                <Button type="submit">Save Product</Button>
            </div>
        </form>
      </main>
    </div>
    )
}
