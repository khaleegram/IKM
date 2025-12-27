'use client';

import { AudioRecorder } from '@/components/products/AudioRecorder';
import { CategoryPicker } from '@/components/products/CategoryPicker';
import { SimpleDeliverySettings } from '@/components/products/SimpleDeliverySettings';
import { MediaUploader } from '@/components/products/MediaUploader';
import { WhatsAppShareButton } from '@/components/products/WhatsAppShareButton';
import { ElectronicsFields } from '@/components/products/category-fields/ElectronicsFields';
import { FashionFields } from '@/components/products/category-fields/FashionFields';
import { FragranceFields } from '@/components/products/category-fields/FragranceFields';
import { HaircareFields } from '@/components/products/category-fields/HaircareFields';
import { IslamicFields } from '@/components/products/category-fields/IslamicFields';
import { MaterialsFields } from '@/components/products/category-fields/MaterialsFields';
import { SkincareFields } from '@/components/products/category-fields/SkincareFields';
import { SnacksFields } from '@/components/products/category-fields/SnacksFields';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/lib/firebase/auth/use-user';
import type { ProductDeliveryMethods } from '@/lib/firebase/firestore/products';
import { createNorthernProduct } from '@/lib/northern-product-actions';
import { getPublicShippingZones } from '@/lib/shipping-actions';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);

  // Core fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'active' | 'draft' | 'inactive'>('draft');

  // Media
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | undefined>();
  const [audioDescription, setAudioDescription] = useState<string | undefined>();

  // Category-specific fields
  const [fragranceFields, setFragranceFields] = useState({
    volume: '',
    fragranceType: '',
    container: '',
  });
  const [fashionFields, setFashionFields] = useState({
    sizeType: '',
    abayaLength: '',
    standardSize: '',
    setIncludes: '',
    material: '',
  });
  const [snacksFields, setSnacksFields] = useState({
    packaging: '',
    quantity: 1,
    taste: '',
  });
  const [materialsFields, setMaterialsFields] = useState({
    materialType: '',
    fabricLength: '',
    quality: '',
    customMaterialType: '',
  });
  const [skincareFields, setSkincareFields] = useState({
    brand: '',
    type: '',
    size: '',
  });
  const [haircareFields, setHaircareFields] = useState({
    type: '',
    brand: '',
    size: '',
    packageItems: [] as string[],
  });
  const [islamicFields, setIslamicFields] = useState({
    type: '',
    size: '',
    material: '',
  });
  const [electronicsFields, setElectronicsFields] = useState({
    brand: '',
    model: '',
  });

  // Delivery
  const [deliveryFeePaidBy, setDeliveryFeePaidBy] = useState<'seller' | 'buyer'>('buyer');
  const [deliveryMethods, setDeliveryMethods] = useState<ProductDeliveryMethods>({});
  const [hasShippingZones, setHasShippingZones] = useState<boolean | null>(null);

  // Check if seller has shipping zones
  useEffect(() => {
    const checkShippingZones = async () => {
      if (!user?.uid) return;
      try {
        const zones = await getPublicShippingZones(user.uid);
        setHasShippingZones(zones.length > 0);
      } catch (error) {
        console.error('Failed to check shipping zones:', error);
        setHasShippingZones(false);
      }
    };
    checkShippingZones();
  }, [user?.uid]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'You must be logged in to create a product.',
      });
      return;
    }

    // Validation
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Product name is required.',
      });
      return;
    }

    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Valid price is required.',
      });
      return;
    }

    if (!stock || isNaN(parseInt(stock)) || parseInt(stock) < 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Valid stock quantity is required.',
      });
      return;
    }

    if (!category) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please select a category.',
      });
      return;
    }

    if (imageUrls.length === 0 && !videoUrl) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please add at least one photo or video.',
      });
      return;
    }

    // Build product data
    const productData: any = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: parseFloat(price),
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
      stock: parseInt(stock),
      category,
      status,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      videoUrl,
      audioDescription,
      deliveryFeePaidBy,
      deliveryMethods: Object.keys(deliveryMethods).length > 0 ? deliveryMethods : undefined,
    };

    // Add category-specific fields
    if (category === 'fragrance') {
      productData.volume = fragranceFields.volume;
      productData.fragranceType = fragranceFields.fragranceType;
      productData.container = fragranceFields.container;
    } else if (category === 'fashion') {
      productData.sizeType = fashionFields.sizeType;
      productData.abayaLength = fashionFields.abayaLength;
      productData.standardSize = fashionFields.standardSize;
      productData.setIncludes = fashionFields.setIncludes;
      productData.material = fashionFields.material;
    } else if (category === 'snacks') {
      productData.packaging = snacksFields.packaging;
      productData.quantity = snacksFields.quantity;
      productData.taste = snacksFields.taste;
    } else if (category === 'materials') {
      productData.materialType = materialsFields.materialType;
      productData.fabricLength = materialsFields.fabricLength;
      productData.quality = materialsFields.quality;
      if (materialsFields.materialType === 'custom' && materialsFields.customMaterialType) {
        productData.customMaterialType = materialsFields.customMaterialType;
      }
    } else if (category === 'skincare') {
      productData.skincareBrand = skincareFields.brand;
      productData.skincareType = skincareFields.type;
      productData.skincareSize = skincareFields.size;
    } else if (category === 'haircare') {
      productData.haircareType = haircareFields.type;
      productData.haircareBrand = haircareFields.brand;
      productData.haircareSize = haircareFields.size;
      if (haircareFields.type === 'package-deal' && haircareFields.packageItems.length > 0) {
        productData.haircarePackageItems = haircareFields.packageItems;
      }
    } else if (category === 'islamic') {
      productData.islamicType = islamicFields.type;
      productData.islamicSize = islamicFields.size;
      productData.islamicMaterial = islamicFields.material;
    } else if (category === 'electronics') {
      productData.brand = electronicsFields.brand;
      productData.model = electronicsFields.model;
    }

    startTransition(async () => {
      try {
        const result = await createNorthernProduct(productData);
        setCreatedProductId(result.productId);
        setShareLink(result.shareLink);
        
        toast({
          title: 'Product Created!',
          description: 'Your product has been saved successfully.',
        });

        // Redirect after a short delay
        setTimeout(() => {
          router.push('/seller/products');
        }, 2000);
      } catch (error) {
        console.error('Error creating product:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: (error as Error).message || 'Failed to create product. Please try again.',
        });
      }
    });
  };

  const renderCategoryFields = () => {
    if (!category) return null;

    switch (category) {
      case 'fragrance':
        return (
          <FragranceFields
            volume={fragranceFields.volume}
            fragranceType={fragranceFields.fragranceType}
            container={fragranceFields.container}
            onVolumeChange={(v) => setFragranceFields({ ...fragranceFields, volume: v })}
            onTypeChange={(t) => setFragranceFields({ ...fragranceFields, fragranceType: t })}
            onContainerChange={(c) => setFragranceFields({ ...fragranceFields, container: c })}
          />
        );
      case 'fashion':
        return (
          <FashionFields
            sizeType={fashionFields.sizeType}
            abayaLength={fashionFields.abayaLength}
            standardSize={fashionFields.standardSize}
            setIncludes={fashionFields.setIncludes}
            material={fashionFields.material}
            onSizeTypeChange={(s) => setFashionFields({ ...fashionFields, sizeType: s })}
            onAbayaLengthChange={(l) => setFashionFields({ ...fashionFields, abayaLength: l })}
            onStandardSizeChange={(s) => setFashionFields({ ...fashionFields, standardSize: s })}
            onSetIncludesChange={(s) => setFashionFields({ ...fashionFields, setIncludes: s })}
            onMaterialChange={(m) => setFashionFields({ ...fashionFields, material: m })}
          />
        );
      case 'snacks':
        return (
          <SnacksFields
            packaging={snacksFields.packaging}
            quantity={snacksFields.quantity}
            taste={snacksFields.taste}
            onPackagingChange={(p) => setSnacksFields({ ...snacksFields, packaging: p })}
            onQuantityChange={(q) => setSnacksFields({ ...snacksFields, quantity: q })}
            onTasteChange={(t) => setSnacksFields({ ...snacksFields, taste: t })}
          />
        );
      case 'materials':
        return (
          <MaterialsFields
            materialType={materialsFields.materialType}
            fabricLength={materialsFields.fabricLength}
            quality={materialsFields.quality}
            customMaterialType={materialsFields.customMaterialType}
            onMaterialTypeChange={(t) => setMaterialsFields({ ...materialsFields, materialType: t, customMaterialType: t === 'custom' ? materialsFields.customMaterialType : '' })}
            onLengthChange={(l) => setMaterialsFields({ ...materialsFields, fabricLength: l })}
            onQualityChange={(q) => setMaterialsFields({ ...materialsFields, quality: q })}
            onCustomMaterialTypeChange={(c) => setMaterialsFields({ ...materialsFields, customMaterialType: c })}
          />
        );
      case 'skincare':
        return (
          <SkincareFields
            brand={skincareFields.brand}
            type={skincareFields.type}
            size={skincareFields.size}
            onBrandChange={(b) => setSkincareFields({ ...skincareFields, brand: b })}
            onTypeChange={(t) => setSkincareFields({ ...skincareFields, type: t })}
            onSizeChange={(s) => setSkincareFields({ ...skincareFields, size: s })}
          />
        );
      case 'haircare':
        return (
          <HaircareFields
            type={haircareFields.type}
            brand={haircareFields.brand}
            size={haircareFields.size}
            packageItems={haircareFields.packageItems}
            onTypeChange={(t) => setHaircareFields({ ...haircareFields, type: t, packageItems: t === 'package-deal' ? haircareFields.packageItems : [] })}
            onBrandChange={(b) => setHaircareFields({ ...haircareFields, brand: b })}
            onSizeChange={(s) => setHaircareFields({ ...haircareFields, size: s })}
            onPackageItemsChange={(items) => setHaircareFields({ ...haircareFields, packageItems: items })}
          />
        );
      case 'islamic':
        return (
          <IslamicFields
            type={islamicFields.type}
            size={islamicFields.size}
            material={islamicFields.material}
            onTypeChange={(t) => setIslamicFields({ ...islamicFields, type: t })}
            onSizeChange={(s) => setIslamicFields({ ...islamicFields, size: s })}
            onMaterialChange={(m) => setIslamicFields({ ...islamicFields, material: m })}
          />
        );
      case 'electronics':
        return (
          <ElectronicsFields
            brand={electronicsFields.brand}
            model={electronicsFields.model}
            onBrandChange={(b) => setElectronicsFields({ ...electronicsFields, brand: b })}
            onModelChange={(m) => setElectronicsFields({ ...electronicsFields, model: m })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 bg-background border-b">
        <div className="flex items-center gap-4">
          <Link href="/seller/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-headline">Add New Product</h1>
            <p className="text-muted-foreground">Create a new product listing</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          {/* Media Section - Priority */}
          <MediaUploader
            images={imageUrls}
            videoUrl={videoUrl}
            onImagesChange={setImageUrls}
            onVideoChange={setVideoUrl}
          />

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>Enter the basic details about your product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Black Abaya, Kilishi Pack"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (₦) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  required
                  className="text-lg font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Compare at Price (₦) - Optional</Label>
                <Input
                  id="compareAtPrice"
                  type="number"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  placeholder="Original price (for showing discounts)"
                />
                <p className="text-xs text-muted-foreground">The original price to show customers (should be higher than selling price)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity *</Label>
                <Input
                  id="stock"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your product..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Category Picker */}
          <Card>
            <CardHeader>
              <CardTitle>Category *</CardTitle>
              <CardDescription>Select the product category</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryPicker
                selectedCategory={category}
                onCategorySelect={setCategory}
              />
            </CardContent>
          </Card>

          {/* Category-Specific Fields */}
          {category && (
            <Card>
              <CardHeader>
                <CardTitle>Category Details</CardTitle>
                <CardDescription>Fill in the details specific to this category</CardDescription>
              </CardHeader>
              <CardContent>
                {renderCategoryFields()}
              </CardContent>
            </Card>
          )}

          {/* Audio Description */}
          <AudioRecorder
            audioUrl={audioDescription}
            onAudioChange={setAudioDescription}
          />

          {/* Delivery Settings */}
          <SimpleDeliverySettings
            deliveryFeePaidBy={deliveryFeePaidBy}
            deliveryMethods={deliveryMethods}
            hasShippingZones={hasShippingZones ?? false}
            onDeliveryFeePaidByChange={setDeliveryFeePaidBy}
            onDeliveryMethodsChange={setDeliveryMethods}
          />

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1"
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save & Post to Shop
                </>
              )}
            </Button>
            {createdProductId && shareLink && (
              <WhatsAppShareButton
                productId={createdProductId}
                productName={name}
                productImage={imageUrls[0]}
                productPrice={parseFloat(price)}
                disabled={isPending}
              />
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
