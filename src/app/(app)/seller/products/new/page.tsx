
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, DollarSign, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition, useRef } from "react";
import { getProductDescription } from "@/lib/actions";
import { addProduct as addProductAction } from "@/lib/product-actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useFirebase } from "@/firebase";
import Image from "next/image";


export default function NewProductPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { auth } = useFirebase();
    const user = auth.currentUser;
    const [isPending, startTransition] = useTransition();
    const [isGenerating, startGenerating] = useTransition();

    const formRef = useRef<HTMLFormElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [generatedDescription, setGeneratedDescription] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        initialPrice: '',
        lastPrice: '',
        stock: '',
        category: ''
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };


    const handleGenerateDescription = () => {
        if (!formData.name) {
            toast({
                variant: "destructive",
                title: "Product Name Required",
                description: "Please enter a product name to generate a description.",
            });
            return;
        }
        setFormModalOpen(true);
        startGenerating(async () => {
            try {
                const result = await getProductDescription({
                    productName: formData.name,
                    productCategory: formData.category || 'General',
                    keyFeatures: '', // You can add a field for this if needed
                    targetAudience: '' // You can add a field for this if needed
                });
                setGeneratedDescription(result);
            } catch (error) {
                toast({ variant: 'destructive', title: 'An error occurred', description: (error as Error).message });
                setGeneratedDescription("Sorry, something went wrong while generating the description.");
            }
        });
    };
    
    const handleUseDescription = () => {
        setFormData(prev => ({ ...prev, description: generatedDescription }));
        setFormModalOpen(false);
    };


    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            toast({ variant: 'destructive', title: 'Not authenticated', description: 'You must be logged in to add a product.' });
            return;
        }
        
        const data = new FormData(e.currentTarget);
        startTransition(async () => {
            try {
                await addProductAction(user.uid, data);
                toast({
                    title: "Product Added!",
                    description: "Your new product has been successfully added to your store.",
                });
                router.push('/seller/products');
            } catch (error) {
                toast({ variant: 'destructive', title: 'Failed to add product', description: (error as Error).message });
            }
        });
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
        <form ref={formRef} onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Details</CardTitle>
                            <CardDescription>Provide a clear and concise description of your product.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="name">Product Name</Label>
                                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Handmade Ankara Bag" required/>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <Label htmlFor="description">Description</Label>
                                    <Button type="button" variant="ghost" size="sm" onClick={handleGenerateDescription} disabled={isGenerating}>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        {isGenerating ? "Generating..." : "Generate with AI"}
                                    </Button>
                                </div>
                                <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe the product, its features, materials, and what makes it special." rows={6} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Image</CardTitle>
                            <CardDescription>Upload a high-quality image of your product.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div 
                                className="border-2 border-dashed border-muted rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Input 
                                    ref={fileInputRef}
                                    id="image" 
                                    name="image" 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleImageChange} 
                                />
                                {imagePreview ? (
                                    <Image src={imagePreview} alt="Product preview" width={200} height={200} className="mb-4 rounded-md object-contain h-48 w-48" />
                                ) : (
                                    <Upload className="w-10 h-10 text-muted-foreground" />
                                )}
                                <p className="mt-2 text-muted-foreground">
                                    {imagePreview ? 'Click to change image' : 'Drag & drop or click to upload'}
                                </p>
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
                                <Label htmlFor="initialPrice">Initial Price (₦)</Label>
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground mt-2.5" />
                                <Input id="initialPrice" name="initialPrice" type="number" value={formData.initialPrice} onChange={handleInputChange} placeholder="15000" className="pl-8" required/>
                            </div>
                            <div className="relative">
                                <Label htmlFor="lastPrice">Lowest Price (₦)</Label>
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground mt-2.5" />
                                <Input id="lastPrice" name="lastPrice" type="number" value={formData.lastPrice} onChange={handleInputChange} placeholder="12000" className="pl-8" required/>
                            </div>
                             <div>
                                <Label htmlFor="stock">Stock Quantity</Label>
                                <Input id="stock" name="stock" type="number" value={formData.stock} onChange={handleInputChange} placeholder="25" required/>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                         <CardHeader>
                            <CardTitle>Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Label htmlFor="category">Product Category</Label>
                            <Input id="category" name="category" value={formData.category} onChange={handleInputChange} placeholder="e.g., Fashion, Bags" />
                        </CardContent>
                    </Card>
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
                <Link href="/seller/products">
                    <Button variant="outline" type="button">Cancel</Button>
                </Link>
                <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Product'}</Button>
            </div>
        </form>

        <Dialog open={isFormModalOpen} onOpenChange={setFormModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>AI-Generated Description</DialogTitle>
                <DialogDescription>
                  Here's a description for your product. You can edit it before using it.
                </DialogDescription>
              </DialogHeader>
                {isGenerating ? (
                    <div className="py-4 space-y-2">
                        <div className="animate-pulse bg-muted h-4 w-3/4 rounded"></div>
                        <div className="animate-pulse bg-muted h-4 w-full rounded"></div>
                        <div className="animate-pulse bg-muted h-4 w-5/6 rounded"></div>
                    </div>
                ) : (
                    <Textarea 
                        value={generatedDescription}
                        onChange={(e) => setGeneratedDescription(e.target.value)}
                        rows={8}
                        className="my-4"
                    />
                )}
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setFormModalOpen(false)}>Cancel</Button>
                <Button type="button" onClick={handleUseDescription} disabled={isGenerating}>Use This Description</Button>
              </DialogFooter>
            </DialogContent>
        </Dialog>
      </main>
    </div>
    )
}
