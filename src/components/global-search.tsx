'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Package, ShoppingCart, Users } from 'lucide-react';
import { useUser } from '@/lib/firebase/auth/use-user';
import { usePathname, useRouter } from 'next/navigation';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import Link from 'next/link';

export function GlobalSearch() {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, startSearch] = useTransition();
  const [results, setResults] = useState<{
    products: any[];
    orders: any[];
    customers: any[];
    totalResults: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine if we're on a seller route
  const isSellerRoute = pathname?.startsWith('/seller');
  const sellerId = isSellerRoute ? user?.uid : undefined;

  useEffect(() => {
    if (query.length >= 2) {
      startSearch(async () => {
        try {
          const res = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, sellerId }),
          });
          if (!res.ok) throw new Error('Search failed');
          const data = await res.json();
          setResults(data.results);
        } catch (error) {
          console.error('Search error:', error);
          setResults(null);
        }
      });
    } else {
      setResults(null);
    }
  }, [query, sellerId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      // Navigate to search results page or filter current page
      if (isSellerRoute) {
        // For seller routes, could navigate to a search results page
        console.log('Search:', query);
      }
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            ref={inputRef}
            placeholder="Search orders, products, customers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            className="pl-10 w-full"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        {isSearching ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : results && results.totalResults > 0 ? (
          <div className="max-h-[400px] overflow-y-auto">
            {results.products.length > 0 && (
              <div className="p-4 border-b">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4" />
                  <span className="text-sm font-semibold">Products ({results.products.length})</span>
                </div>
                <div className="space-y-1">
                  {results.products.slice(0, 3).map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="block p-2 hover:bg-muted rounded text-sm"
                      onClick={() => setIsOpen(false)}
                    >
                      {product.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {results.orders.length > 0 && isSellerRoute && (
              <div className="p-4 border-b">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-4 h-4" />
                  <span className="text-sm font-semibold">Orders ({results.orders.length})</span>
                </div>
                <div className="space-y-1">
                  {results.orders.slice(0, 3).map((order) => (
                    <Link
                      key={order.id}
                      href={`/seller/orders/${order.id}`}
                      className="block p-2 hover:bg-muted rounded text-sm"
                      onClick={() => setIsOpen(false)}
                    >
                      Order #{order.id?.slice(0, 8)} - {order.customerInfo?.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {results.customers.length > 0 && isSellerRoute && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-semibold">Customers ({results.customers.length})</span>
                </div>
                <div className="space-y-1">
                  {results.customers.slice(0, 3).map((customer, index) => (
                    <div
                      key={customer.customerId || index}
                      className="p-2 hover:bg-muted rounded text-sm"
                    >
                      {customer.name} - {customer.email}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : query.length >= 2 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No results found
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Type at least 2 characters to search
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

