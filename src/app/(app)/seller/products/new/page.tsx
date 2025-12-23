
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, DollarSign, Sparkles, Plus, X, Package } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition, useRef } from "react";
import { getProductDescription } from "@/lib/actions";
import { addProduct as addProductAction } from "@/lib/product-actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useFirebase } from "@/firebase/provider";
import Image from "next/image";
import { PRODUCT_CATEGORIES } from "@/lib/constants/categories";


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
    const [variants, setVariants] = useState<Array<{
        name: string;
        options: Array<{ value: string; priceModifier: string; stock: string; sku: string }>;
    }>>([]);

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
        
        // Add variants to form data if any
        if (variants.length > 0) {
            data.append('variants', JSON.stringify(variants));
        }
        
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
      <header className="p-3 sm:p-4 md:p-6 bg-background border-b">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-headline">Add a New Product</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Fill out the details below to list a new item in your store.</p>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        <form ref={formRef} onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
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
                            <CardTitle>Product Image (Optional)</CardTitle>
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
                    
                    {/* Product Variants */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Variants (Optional)</CardTitle>
                            <CardDescription>Add variants like size, color, material, etc. Each variant can have different prices and stock levels.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {variants.map((variant, variantIdx) => (
                                <div key={variantIdx} className="border rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Input
                                            placeholder="Variant name (e.g., Size, Color)"
                                            value={variant.name}
                                            onChange={(e) => {
                                                const newVariants = [...variants];
                                                newVariants[variantIdx].name = e.target.value;
                                                setVariants(newVariants);
                                            }}
                                            className="max-w-xs"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setVariants(variants.filter((_, i) => i !== variantIdx));
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {variant.options.map((option, optIdx) => (
                                            <div key={optIdx} className="flex gap-2 items-center">
                                                <Input
                                                    placeholder="Option value (e.g., Small, Red)"
                                                    value={option.value}
                                                    onChange={(e) => {
                                                        const newVariants = [...variants];
                                                        newVariants[variantIdx].options[optIdx].value = e.target.value;
                                                        setVariants(newVariants);
                                                    }}
                                                    className="flex-1"
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Price +₦"
                                                    value={option.priceModifier}
                                                    onChange={(e) => {
                                                        const newVariants = [...variants];
                                                        newVariants[variantIdx].options[optIdx].priceModifier = e.target.value;
                                                        setVariants(newVariants);
                                                    }}
                                                    className="w-24"
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Stock"
                                                    value={option.stock}
                                                    onChange={(e) => {
                                                        const newVariants = [...variants];
                                                        newVariants[variantIdx].options[optIdx].stock = e.target.value;
                                                        setVariants(newVariants);
                                                    }}
                                                    className="w-24"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const newVariants = [...variants];
                                                        newVariants[variantIdx].options = newVariants[variantIdx].options.filter((_, i) => i !== optIdx);
                                                        setVariants(newVariants);
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const newVariants = [...variants];
                                                newVariants[variantIdx].options.push({ value: '', priceModifier: '', stock: '', sku: '' });
                                                setVariants(newVariants);
                                            }}
                                        >
                                            <Plus className="h-3 w-3 mr-1" /> Add Option
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setVariants([...variants, { name: '', options: [{ value: '', priceModifier: '', stock: '', sku: '' }] }]);
                                }}
                            >
                                <Plus className="h-4 w-4 mr-2" /> Add Variant
                            </Button>
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
                </div>
            </div>
            <div className="mt-4 sm:mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Link href="/seller/products" className="w-full sm:w-auto">
                    <Button variant="outline" type="button" className="w-full sm:w-auto">Cancel</Button>
                </Link>
                <Button type="submit" disabled={isPending} className="w-full sm:w-auto">{isPending ? 'Saving...' : 'Save Product'}</Button>
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
