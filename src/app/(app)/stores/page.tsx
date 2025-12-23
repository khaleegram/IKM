'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, ArrowRight, Search, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAllStores } from '@/lib/firebase/firestore/stores';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

export default function StoresPage() {
  const { data: stores, isLoading: isLoadingStores, error } = useAllStores();
  const [searchTerm, setSearchTerm] = useState('');

  // Debug logging - more detailed
  useEffect(() => {
    if (!isLoadingStores) {
      console.log('📊 Stores Page Debug:');
      console.log('  - Total stores fetched:', stores?.length || 0);
      if (stores && stores.length > 0) {
        console.log('  - All stores:', stores.map(s => ({ id: s.id, storeName: s.storeName, userId: s.userId, hasDescription: !!s.storeDescription })));
        console.log('  - Sample store data:', {
          id: stores[0].id,
          storeName: stores[0].storeName,
          storeDescription: stores[0].storeDescription,
          storeLogoUrl: stores[0].storeLogoUrl,
          storeBannerUrl: stores[0].storeBannerUrl,
          storeLocation: stores[0].storeLocation,
        });
      }
      if (error) {
        console.error('  - Error:', error);
      }
    }
  }, [stores, isLoadingStores, error]);
  
  const filteredStores = (stores || []).filter(store =>
    store.storeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.storeDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.storeLocation?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.storeLocation?.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
        <div className="mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-headline">Store Directory</h1>
            <p className="mt-2 text-sm sm:text-base md:text-lg text-muted-foreground">Browse all the amazing independent sellers on our platform.</p>
        </div>

        <div className="mb-6">
            <div className="relative w-full max-w-sm mx-auto sm:mx-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search stores..."
                    className="pl-9 text-sm sm:text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        
        {isLoadingStores && (
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="flex flex-col">
                <Skeleton className="w-full h-32 rounded-t-lg" />
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full mt-3" />
                  <Skeleton className="h-4 w-5/6 mt-2" />
                </CardHeader>
                <CardContent className="pt-0">
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center text-destructive py-16">
            <p className="text-lg font-semibold">Error loading stores</p>
            <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
            <p className="text-xs text-muted-foreground mt-4">Please check your connection and try refreshing the page.</p>
          </div>
        )}

        {!isLoadingStores && !error && filteredStores.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredStores.map((store) => (
              <Card key={store.id} className="flex flex-col hover:shadow-lg transition-shadow">
                  {store.storeBannerUrl && (
                    <div className="relative w-full h-32 overflow-hidden rounded-t-lg">
                      <Image
                        src={store.storeBannerUrl}
                        alt={`${store.storeName} banner`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      {store.storeLogoUrl ? (
                        <div className="relative flex-shrink-0 h-16 w-16 rounded-full overflow-hidden border-2 border-background">
                          <Image
                            src={store.storeLogoUrl}
                            alt={`${store.storeName} logo`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
                          <Store className="h-8 w-8 text-secondary-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="font-headline text-xl line-clamp-2">
                          {store.storeName}
                        </CardTitle>
                        {store.storeLocation && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            <span className="line-clamp-1">
                              {[store.storeLocation.city, store.storeLocation.state].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {store.storeDescription && (
                      <CardDescription className="line-clamp-3 mt-3">
                        {store.storeDescription}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex-grow flex items-end pt-0">
                    <Link href={`/store/${store.id}`} className="w-full">
                        <Button variant="outline" className="w-full">
                            Visit Store <ArrowRight className="ml-2 h-4 w-4"/>
                        </Button>
                    </Link>
                  </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {!isLoadingStores && !error && ((stores?.length || 0) === 0 || filteredStores.length === 0) && (
            <div className="text-center text-muted-foreground py-16">
                {(stores?.length || 0) > 0 && filteredStores.length === 0 ? (
                    <>
                        <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-lg font-semibold">No stores found for "{searchTerm}"</p>
                        <p className="text-sm mt-2">Try a different search term</p>
                    </>
                ) : (
                    <>
                        <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-lg font-semibold">No stores have been set up yet</p>
                        <p className="text-sm mt-2">
                            Are you a seller?{' '}
                            <Link href="/seller/dashboard" className="text-primary hover:underline font-medium">
                                Set up your store now!
                            </Link>
                        </p>
                    </>
                )}
            </div>
        )}
    </div>
  );
}
