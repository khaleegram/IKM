'use client';

import { ProductComparison, useProductComparison } from '@/components/product-comparison';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import Link from "next/link";

export default function ComparePage() {
  const { comparisonIds, removeFromComparison, clearComparison } = useProductComparison();

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
      <header className="mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline">Compare Products</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Compare up to 4 products side by side.
          </p>
        </div>
      </header>

      <ProductComparison
        productIds={comparisonIds}
        onRemove={removeFromComparison}
        onClear={clearComparison}
      />

      {comparisonIds.length === 0 && (
        <Card className="mt-6">
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <CardTitle className="font-headline mb-2">No products to compare</CardTitle>
            <CardDescription>
              Add products to compare by clicking the "Compare" button on product pages.
            </CardDescription>
            <Link href="/products" className="mt-4 inline-block">
              <Button>Browse Products</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

