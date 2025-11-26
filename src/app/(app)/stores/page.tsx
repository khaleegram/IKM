
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Store, ArrowRight } from 'lucide-react';
import { useAllUserProfiles } from '@/lib/firebase/firestore/users';

export default function StoresPage() {
  const { data: users, isLoading: isLoadingUsers } = useAllUserProfiles();

  const stores = users.filter(u => u.storeName);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold font-headline">Store Directory</h1>
            <p className="mt-2 text-lg text-muted-foreground">Browse all the amazing independent sellers on our platform.</p>
        </div>
        
        {isLoadingUsers && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        )}

        {!isLoadingUsers && stores && stores.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <Card key={store.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl flex items-center gap-3">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                            <Store className="h-6 w-6 text-secondary-foreground" />
                        </div>
                        <span>{store.storeName}</span>
                    </CardTitle>
                    <CardDescription className="line-clamp-3 h-[60px]">{store.storeDescription}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex items-end">
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
        {!isLoadingUsers && (!stores || stores.length === 0) && (
          <div className="text-center text-muted-foreground py-16">
            <p className="text-lg">No stores have been set up yet.</p>
            <p>Are you a seller? <Link href="/seller/dashboard" className="text-primary hover:underline">Set up your store now!</Link></p>
          </div>
        )}
    </div>
  );
}
