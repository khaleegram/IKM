
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, DollarSign, Sparkles, Loader2, Save, Eye, EyeOff, Package, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition, useEffect, useRef } from "react";
import { getProductDescription } from "@/lib/actions";
import { updateProduct as updateProductAction } from "@/lib/product-actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useFirebase } from "@/firebase/provider";
import { useProduct } from "@/lib/firebase/firestore/products";
import Image from "next/image";
import { PRODUCT_CATEGORIES } from "@/lib/constants/categories";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";


export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;
    const { toast } = useToast();
    const { auth } = useFirebase();
    const user = auth.currentUser;

    const { data: product, isLoading: isLoadingProduct } = useProduct(productId);

    const [isPending, startTransition] = useTransition();
    const [isGenerating, startGenerating] = useTransition();

    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [generatedDescription, setGeneratedDescription] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        compareAtPrice: '',
        stock: '',
        sku: '',
        category: '',
        status: 'active' as 'active' | 'draft' | 'inactive',
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showComparePrice, setShowComparePrice] = useState(false);

    useEffect(() => {
      if(product) {
        setFormData({
            name: product.name || '',
            description: product.description || '',
            price: product.price?.toString() || '',
            compareAtPrice: product.compareAtPrice?.toString() || '',
            stock: product.stock?.toString() || '',
            sku: product.sku || '',
            category: product.category || '',
            status: product.status || 'active',
        })
        if (product.imageUrl) {
            setImagePreview(product.imageUrl);
        }
        setShowComparePrice(!!product.compareAtPrice);
      }
    }, [product]);

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
                    keyFeatures: '',
                    targetAudience: ''
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
            toast({ variant: 'destructive', title: 'Not authenticated', description: 'You must be logged in to update a product.' });
            return;
        }
        
        const data = new FormData(e.currentTarget);
        startTransition(async () => {
            try {
                await updateProductAction(productId, user.uid, data);
                toast({
                    title: "Product Updated!",
                    description: "Your product has been successfully updated.",
                });
                router.push('/seller/products');
            } catch (error) {
                toast({ variant: 'destructive', title: 'Failed to update product', description: (error as Error).message });
            }
        });
    }

    if (isLoadingProduct) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        )
    }

    if (!product) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Product not found.</p>
            </div>
        )
    }

    // Calculate discount percentage
    const discountPercent = formData.price && formData.compareAtPrice && parseFloat(formData.compareAtPrice) > parseFloat(formData.price)
        ? Math.round(((parseFloat(formData.compareAtPrice) - parseFloat(formData.price)) / parseFloat(formData.compareAtPrice)) * 100)
        : 0;

    return (
    <div className="flex flex-col h-full bg-muted/30">
      <header className="p-4 md:p-6 bg-background border-b sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-headline">Edit Product</h1>
            <p className="text-sm text-muted-foreground mt-1">Update product details for "{product.name}"</p>
          </div>
          <div className="flex gap-2">
            <Link href="/seller/products">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button 
              type="submit" 
              form="product-form"
              disabled={isPending}
              onClick={() => document.getElementById('product-form')?.requestSubmit()}
            >
              {isPending ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <form id="product-form" onSubmit={handleSubmit}>
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing & Inventory</TabsTrigger>
                  <TabsTrigger value="variants">Variants (Optional)</TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Product Information</CardTitle>
                      <CardDescription>Enter the basic details about your product</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="name">Product Name *</Label>
                        <Input 
                          id="name" 
                          name="name" 
                          value={formData.name} 
                          onChange={handleInputChange} 
                          placeholder="e.g., Handmade Ankara Bag" 
                          required
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <Label htmlFor="description">Description</Label>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleGenerateDescription} 
                            disabled={isGenerating || !formData.name}
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            {isGenerating ? "Generating..." : "AI Generate"}
                          </Button>
                        </div>
                        <Textarea 
                          id="description" 
                          name="description" 
                          value={formData.description} 
                          onChange={handleInputChange} 
                          placeholder="Describe your product, its features, materials, and what makes it special..." 
                          rows={6}
                          className="mt-1"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select 
                            name="category" 
                            value={formData.category} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {PRODUCT_CATEGORIES.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.icon} {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="sku">SKU (Optional)</Label>
                          <Input 
                            id="sku" 
                            name="sku" 
                            value={formData.sku} 
                            onChange={handleInputChange} 
                            placeholder="e.g., ANK-BAG-001" 
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Product Image</CardTitle>
                      <CardDescription>Upload a high-quality image of your product</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="border-2 border-dashed border-muted rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors bg-muted/30"
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
                          <div className="relative w-full max-w-md">
                            <Image 
                              src={imagePreview} 
                              alt="Product preview" 
                              width={400} 
                              height={400} 
                              className="mb-4 rounded-lg object-contain h-64 w-full" 
                            />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setImagePreview(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                            <p className="text-sm font-medium mb-1">Click to upload image</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Pricing & Inventory Tab */}
                <TabsContent value="pricing" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pricing</CardTitle>
                      <CardDescription>Set your product price and optional compare price</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative">
                        <Label htmlFor="price">Selling Price (₦) *</Label>
                        <div className="relative mt-1">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="price" 
                            name="price" 
                            type="number" 
                            value={formData.price} 
                            onChange={handleInputChange} 
                            placeholder="15000" 
                            className="pl-8" 
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="show-compare-price"
                            checked={showComparePrice}
                            onCheckedChange={setShowComparePrice}
                          />
                          <Label htmlFor="show-compare-price" className="cursor-pointer">
                            Show compare at price (for discounts)
                          </Label>
                        </div>
                      </div>

                      {showComparePrice && (
                        <div className="relative">
                          <Label htmlFor="compareAtPrice">Compare at Price (₦)</Label>
                          <div className="relative mt-1">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="compareAtPrice" 
                              name="compareAtPrice" 
                              type="number" 
                              value={formData.compareAtPrice} 
                              onChange={handleInputChange} 
                              placeholder="20000" 
                              className="pl-8"
                            />
                          </div>
                          {discountPercent > 0 && (
                            <Badge variant="destructive" className="mt-2">
                              {discountPercent}% OFF
                            </Badge>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            The original price to show customers (should be higher than selling price)
                          </p>
                        </div>
                      )}

                      <Separator />

                      <div>
                        <Label htmlFor="stock">Stock Quantity *</Label>
                        <Input 
                          id="stock" 
                          name="stock" 
                          type="number" 
                          value={formData.stock} 
                          onChange={handleInputChange} 
                          placeholder="25" 
                          className="mt-1"
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter 0 if out of stock
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Variants Tab - Same as new product page */}
                <TabsContent value="variants" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Product Variants</CardTitle>
                      <CardDescription>Variants are not editable in this version. Use the new product form to add variants.</CardDescription>
                    </CardHeader>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Product Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      name="status" 
                      value={formData.status} 
                      onValueChange={(value: 'active' | 'draft' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-green-600" />
                            Active
                          </div>
                        </SelectItem>
                        <SelectItem value="draft">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-yellow-600" />
                            Draft
                          </div>
                        </SelectItem>
                        <SelectItem value="inactive">
                          <div className="flex items-center gap-2">
                            <EyeOff className="h-4 w-4 text-gray-600" />
                            Inactive
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formData.status === 'active' && 'Product will be visible to customers'}
                      {formData.status === 'draft' && 'Product saved but not visible to customers'}
                      {formData.status === 'inactive' && 'Product hidden from customers'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">{formData.name || 'Product Name'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-lg font-bold text-primary">
                        ₦{formData.price ? parseFloat(formData.price).toLocaleString() : '0'}
                      </p>
                      {formData.compareAtPrice && parseFloat(formData.compareAtPrice) > parseFloat(formData.price || '0') && (
                        <>
                          <p className="text-sm text-muted-foreground line-through">
                            ₦{parseFloat(formData.compareAtPrice).toLocaleString()}
                          </p>
                          {discountPercent > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              -{discountPercent}%
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {formData.stock && (
                    <div className="text-sm text-muted-foreground">
                      Stock: {formData.stock}
                    </div>
                  )}
                  {formData.category && (
                    <div className="text-sm text-muted-foreground">
                      Category: {PRODUCT_CATEGORIES.find(c => c.value === formData.category)?.label}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>

        <Dialog open={isFormModalOpen} onOpenChange={setFormModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>AI-Generated Description</DialogTitle>
              <DialogDescription>
                Review and edit the generated description before using it.
              </DialogDescription>
            </DialogHeader>
            {isGenerating ? (
              <div className="py-8 space-y-3">
                <div className="animate-pulse bg-muted h-4 w-3/4 rounded"></div>
                <div className="animate-pulse bg-muted h-4 w-full rounded"></div>
                <div className="animate-pulse bg-muted h-4 w-5/6 rounded"></div>
              </div>
            ) : (
              <Textarea 
                value={generatedDescription}
                onChange={(e) => setGeneratedDescription(e.target.value)}
                rows={10}
                className="my-4"
              />
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setFormModalOpen(false)}>Cancel</Button>
              <Button type="button" onClick={handleUseDescription} disabled={isGenerating}>
                Use This Description
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
    )
}
