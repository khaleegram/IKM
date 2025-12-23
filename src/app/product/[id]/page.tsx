
'use client';

import { Button } from "@/components/ui/button";
import { ShoppingCart, Store } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useProduct } from "@/lib/firebase/firestore/products";
import React from "react";
import { useCart } from "@/lib/cart-context";
import { useUserProfile } from "@/lib/firebase/firestore/users";
import { ProductReviews } from "@/components/product-reviews";
import { ProductImageGallery } from "@/components/product-image-gallery";
import { ProductRecommendations } from "@/components/product-recommendations";
import { Star, Heart } from "lucide-react";
import { useIsInWishlist } from "@/lib/firebase/firestore/wishlist";
import { addToWishlist, removeFromWishlist } from "@/lib/wishlist-actions";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition, useEffect } from "react";
import { useUser } from "@/lib/firebase/auth/use-user";
import { trackProductView } from "@/lib/product-analytics-actions";
import { Share2 } from "lucide-react";
import { shareProduct } from "@/lib/share-actions";
import { recordRecentlyViewedProduct } from "@/lib/recently-viewed-actions";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const { user } = useUser();
  const { data: product, isLoading, error } = useProduct(productId);
  const { data: sellerProfile } = useUserProfile(product?.sellerId);
  const { addToCart } = useCart();
  const { isInWishlist, isLoading: isLoadingWishlist } = useIsInWishlist(user?.uid, productId);
  const { toast } = useToast();
  const [isToggling, startToggleTransition] = useTransition();

  // Track product view
  useEffect(() => {
    if (product && user?.uid && product.id) {
      trackProductView(product.id).catch(() => {
        // Failed to track product view
      });
    }
  }, [product?.id, user?.uid]);

  if (!product && error) {
    notFound();
  }

  return (
      <main className="flex-1 p-3 sm:p-4 md:p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-12">
            <div>
                {isLoading || !product ? (
                    <Skeleton className="w-full aspect-square" />
                ) : (
                    <ProductImageGallery
                        images={product.imageUrl ? [product.imageUrl] : []}
                        productName={product.name}
                        defaultImage={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/600`}
                    />
                )}
            </div>
            <div className="flex flex-col justify-center">
                {isLoading || !product ? (
                    <>
                        <Skeleton className="h-10 w-3/4 mb-4" />
                        <Skeleton className="h-4 w-1/2 mb-6" />
                        <Skeleton className="h-8 w-32 mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-5/6 mb-8" />
                        <Skeleton className="h-12 w-40 mb-3" />
                        <Skeleton className="h-4 w-32" />
                    </>
                ) : (
                    <>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline">{product.name}</h1>
                        {sellerProfile && (
                            <Link href={`/store/${product.sellerId}`} className="mt-2 block">
                                <span className="text-sm sm:text-base text-muted-foreground hover:text-primary">Sold by {sellerProfile.storeName}</span>
                            </Link>
                        )}
                        <div className="flex items-center gap-3 mt-3 sm:mt-4">
                            <p className="font-bold text-primary text-2xl sm:text-3xl">₦{product.price.toLocaleString()}</p>
                            {product.averageRating && product.reviewCount ? (
                                <div className="flex items-center gap-1">
                                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                    <span className="font-semibold">{product.averageRating.toFixed(1)}</span>
                                    <span className="text-sm text-muted-foreground">({product.reviewCount})</span>
                                </div>
                            ) : null}
                        </div>
                        <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                            {product.description}
                        </p>
                        <div className="mt-6 sm:mt-8 flex flex-col gap-3">
                            <Button size="lg" className="w-full text-base sm:text-lg" onClick={() => addToCart(product)}>
                                <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5"/>
                                Add to Cart
                            </Button>
                            <div className="flex gap-3">
                                <Link href="/cart" className="flex-1">
                                    <Button size="lg" variant="outline" className="w-full text-base sm:text-lg">
                                        Go to Cart
                                    </Button>
                                </Link>
                                <div className="flex gap-3">
                                    {user && (
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="text-base sm:text-lg"
                                            onClick={() => {
                                                startToggleTransition(async () => {
                                                    try {
                                                        if (isInWishlist) {
                                                            await removeFromWishlist(productId);
                                                            toast({ title: "Removed from Wishlist", description: "Product removed from your wishlist." });
                                                        } else {
                                                            await addToWishlist(productId);
                                                            toast({ title: "Added to Wishlist", description: "Product added to your wishlist." });
                                                        }
                                                    } catch (error) {
                                                        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
                                                    }
                                                });
                                            }}
                                            disabled={isToggling || isLoadingWishlist}
                                        >
                                            <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                                        </Button>
                                    )}
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="text-base sm:text-lg"
                                        onClick={() => {
                                            shareProduct(product.name, productId);
                                            toast({ title: "Link Copied!", description: "Product link has been copied to clipboard." });
                                        }}
                                    >
                                        <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        {sellerProfile && (
                             <Link href={`/store/${product.sellerId}`} className="mt-4">
                                <Button variant="link" className="p-0 h-auto">
                                    <Store className="mr-2 h-4 w-4"/>
                                    View Seller's Store
                                </Button>
                            </Link>
                        )}
                    </>
                )}
            </div>
        </div>
        
        {/* Reviews Section */}
        <div className="max-w-6xl mx-auto mt-8 sm:mt-12">
          <ProductReviews productId={productId} />
        </div>
      </main>
  );
}
