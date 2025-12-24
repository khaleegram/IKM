'use client';

import { Button } from "@/components/ui/button";
import { Search, Package, ShoppingCart, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  type?: 'products' | 'cart' | 'orders' | 'wishlist' | 'search';
  title?: string;
  description?: string;
  searchTerm?: string;
  onClearSearch?: () => void;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  type = 'products',
  title,
  description,
  searchTerm,
  onClearSearch,
  actionLabel,
  actionHref,
  icon
}: EmptyStateProps) {
  const getDefaultContent = () => {
    switch (type) {
      case 'search':
        return {
          icon: <Search className="h-12 w-12 text-muted-foreground" />,
          title: title || 'No products found',
          description: description || (
            searchTerm ? (
              <>
                No products found for "<span className="font-medium">{searchTerm}</span>". 
                Try adjusting your search terms or browse all products.
              </>
            ) : (
              'Start searching to find products'
            )
          ),
          action: onClearSearch && (
            <Button variant="outline" onClick={onClearSearch} className="mt-4">
              Clear Search
            </Button>
          )
        };
      case 'cart':
        return {
          icon: <ShoppingCart className="h-12 w-12 text-muted-foreground" />,
          title: title || 'Your cart is empty',
          description: description || 'Add some products to your cart to get started.',
          action: actionHref && (
            <Link href={actionHref}>
              <Button className="mt-4">
                {actionLabel || 'Browse Products'}
              </Button>
            </Link>
          )
        };
      case 'orders':
        return {
          icon: <Package className="h-12 w-12 text-muted-foreground" />,
          title: title || 'No orders yet',
          description: description || 'Your orders will appear here once you make a purchase.',
          action: actionHref && (
            <Link href={actionHref}>
              <Button className="mt-4">
                {actionLabel || 'Start Shopping'}
              </Button>
            </Link>
          )
        };
      case 'wishlist':
        return {
          icon: <ShoppingCart className="h-12 w-12 text-muted-foreground" />,
          title: title || 'Your wishlist is empty',
          description: description || 'Save products you love to your wishlist.',
          action: actionHref && (
            <Link href={actionHref}>
              <Button className="mt-4">
                {actionLabel || 'Browse Products'}
              </Button>
            </Link>
          )
        };
      default:
        return {
          icon: <Package className="h-12 w-12 text-muted-foreground" />,
          title: title || 'No products available',
          description: description || 'Check back soon to discover amazing products from our Nigerian artisans!',
          action: actionHref && (
            <Link href={actionHref}>
              <Button className="mt-4">
                {actionLabel || 'Explore'}
              </Button>
            </Link>
          )
        };
    }
  };

  const content = getDefaultContent();

  return (
    <div className="text-center py-16 space-y-4 animate-in fade-in duration-500">
      <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
        {icon || content.icon}
      </div>
      <h3 className="text-xl font-semibold">{content.title}</h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        {content.description}
      </p>
      {content.action}
    </div>
  );
}

