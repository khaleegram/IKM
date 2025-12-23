
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, FileWarning, Package, Loader2, Trash2, Edit, Search, Filter, X, CheckSquare, Square, Copy } from "lucide-react";
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useProductsBySeller, deleteProduct } from '@/lib/firebase/firestore/products';
import { useFirebase } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo, useTransition } from 'react';
import { PRODUCT_CATEGORIES, getCategoryLabel } from '@/lib/constants/categories';
import { duplicateProduct } from '@/lib/product-actions';


export default function ProductsPage() {
  const { auth, firestore } = useFirebase();
  const user = auth.currentUser;
  const { data: products, isLoading, error } = useProductsBySeller(user?.uid);
  const { toast } = useToast();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDuplicating, startDuplicating] = useTransition();
  
  // Filtering and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter(product => {
      // Search filter
      const matchesSearch = !searchTerm || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filter
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      
      // Stock filter
      const matchesStock = stockFilter === 'all' || 
        (stockFilter === 'in-stock' && product.stock > 0) ||
        (stockFilter === 'low-stock' && product.stock > 0 && product.stock <= 5) ||
        (stockFilter === 'out-of-stock' && product.stock === 0);
      
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, selectedCategory, stockFilter]);

  const hasProducts = filteredProducts && filteredProducts.length > 0;
  
  // Get unique categories from products
  const availableCategories = useMemo(() => {
    if (!products) return [];
    const categories = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(categories);
  }, [products]);

  const getStatus = (stock: number) => {
    if (stock > 0) return { text: 'Active', variant: 'support' as const };
    return { text: 'Out of Stock', variant: 'destructive' as const };
  }

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setIsAlertOpen(true);
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete || !user) return;
    try {
      await deleteProduct(firestore, productToDelete, user.uid);
      toast({
        title: "Product Deleted",
        description: "The product has been successfully removed from your store.",
      });
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: (error as Error).message,
      });
    } finally {
      setIsAlertOpen(false);
      setProductToDelete(null);
    }
  }

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0 || !user) return;
    try {
      const { bulkDeleteProducts } = await import('@/lib/bulk-product-actions');
      await bulkDeleteProducts(Array.from(selectedProducts));
      toast({
        title: "Products Deleted",
        description: `Successfully deleted ${selectedProducts.size} product(s).`,
      });
      setSelectedProducts(new Set());
      setIsBulkMode(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: (error as Error).message,
      });
    }
  }

  const handleBulkUpdate = async (updateType: 'price' | 'stock' | 'category', value: string | number) => {
    if (selectedProducts.size === 0 || !user) return;
    try {
      const { bulkUpdateProducts } = await import('@/lib/bulk-product-actions');
      const formData = new FormData();
      formData.append('productIds', JSON.stringify(Array.from(selectedProducts)));
      formData.append('updateType', updateType);
      formData.append('value', value.toString());
      
      await bulkUpdateProducts(formData);
      toast({
        title: "Products Updated",
        description: `Successfully updated ${selectedProducts.size} product(s).`,
      });
      setSelectedProducts(new Set());
      setIsBulkMode(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: (error as Error).message,
      });
    }
  }

  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  }

  const selectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id!)));
    }
  }

  const handleDuplicate = (productId: string) => {
    if (!user) return;
    startDuplicating(async () => {
      try {
        await duplicateProduct(productId, user.uid);
        toast({
          title: "Product Duplicated",
          description: "A copy of the product has been created successfully.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Duplication Failed",
          description: (error as Error).message,
        });
      }
    });
  }

  return (
    <div className="flex flex-col h-full">
      <header className="p-3 sm:p-4 md:p-6 bg-background border-b">
        <div className="flex flex-col gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-headline">My Products</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your inventory and view product performance.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {isBulkMode && selectedProducts.size > 0 && (
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                size="sm"
                className="w-full sm:w-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedProducts.size})
              </Button>
            )}
            <Button
              variant={isBulkMode ? "default" : "outline"}
              onClick={() => {
                setIsBulkMode(!isBulkMode);
                setSelectedProducts(new Set());
              }}
              size="sm"
              className="w-full sm:w-auto"
            >
              {isBulkMode ? <X className="mr-2 h-4 w-4" /> : <CheckSquare className="mr-2 h-4 w-4" />}
              {isBulkMode ? "Cancel" : "Select"}
            </Button>
            <Link href="/seller/products/new" className="w-full sm:w-auto">
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {PRODUCT_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Stock Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="low-stock">Low Stock (≤5)</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {isBulkMode && filteredProducts.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAll}
            >
              {selectedProducts.size === filteredProducts.length ? (
                <><CheckSquare className="mr-2 h-4 w-4" /> Deselect All</>
              ) : (
                <><Square className="mr-2 h-4 w-4" /> Select All</>
              )}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedProducts.size} of {filteredProducts.length} selected
            </span>
          </div>
        )}
      </header>
      <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
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
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const status = getStatus(product.stock);
              const isSelected = selectedProducts.has(product.id!);
              return (
                <Card 
                  key={product.id} 
                  className={`flex flex-col transition-all ${
                    isBulkMode ? 'cursor-pointer hover:border-primary' : ''
                  } ${isSelected ? 'border-primary ring-2 ring-primary' : ''}`}
                  onClick={() => isBulkMode && toggleProductSelection(product.id!)}
                >
                  <CardHeader className="p-0 relative">
                    {isBulkMode && (
                      <div className="absolute top-2 left-2 z-10">
                        {isSelected ? (
                          <div className="bg-primary text-primary-foreground rounded-full p-1">
                            <CheckSquare className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="bg-background border rounded-full p-1">
                            <Square className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    )}
                    <Image 
                      src={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/400`} 
                      alt={product.name} 
                      width={600} 
                      height={400} 
                      className="rounded-t-lg aspect-video object-cover" />
                    {product.category && (
                      <Badge className="absolute top-2 right-2" variant="secondary">
                        {getCategoryLabel(product.category)}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 flex-1">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="font-bold text-primary text-xl mt-1">₦{product.price.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">Stock: {product.stock}</p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between items-center">
                      <Badge variant={status.variant}>{status.text}</Badge>
                      {!isBulkMode && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/seller/products/edit/${product.id}`}>
                                      <Edit className="mr-2 h-4 w-4" /> Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicate(product.id!)} disabled={isDuplicating}>
                                  <Copy className="mr-2 h-4 w-4" /> {isDuplicating ? 'Duplicating...' : 'Duplicate'}
                                </DropdownMenuItem>
                                <DropdownMenuItem>View Performance</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(product.id!)}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                  </CardFooter>
                </Card>
            )})}
          </div>
        )}
        
        {!isLoading && !hasProducts && !error && searchTerm && (
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-lg text-center border-dashed shadow-none">
              <CardContent className="pt-6">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <CardTitle className="font-headline">No products found</CardTitle>
                <CardDescription className="mt-2">
                  No products match your search criteria. Try adjusting your filters.
                </CardDescription>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setStockFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this product from your store.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Yes, delete product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
