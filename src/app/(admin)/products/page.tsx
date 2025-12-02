
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package } from "lucide-react";

export default function AdminProductsPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 bg-background border-b">
        <div>
          <h1 className="text-2xl font-bold font-headline">All Products</h1>
          <p className="text-muted-foreground">Manage all products listed on the marketplace.</p>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <Card className="text-center border-dashed">
            <CardHeader>
                <div className="mx-auto bg-secondary rounded-full w-16 h-16 flex items-center justify-center">
                    <Package className="w-8 h-8 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent>
                <CardTitle className="font-headline">Products Page</CardTitle>
                <CardDescription className="mt-2">This page is under construction. Product management will be available here soon.</CardDescription>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
