
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Package, Plus, Pencil, BarChart2 } from "lucide-react";
import { analyzeSales } from "@/ai/flows/seller-sales-analysis";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const salesData = JSON.stringify([
    { productId: 'p001', productName: 'Artisan Coffee Beans', quantity: 150, price: 20, date: '2023-10-01' },
    { productId: 'p002', productName: 'Handmade Ceramic Mug', quantity: 250, price: 25, date: '2023-10-05' },
    { productId: 'p003', productName: 'Organic Tea Selection', quantity: 100, price: 15, date: '2023-10-12' },
    { productId: 'p001', productName: 'Artisan Coffee Beans', quantity: 120, price: 20, date: '2023-11-01' },
    { productId: 'p002', productName: 'Handmade Ceramic Mug', quantity: 300, price: 25, date: '2023-11-05' },
]);

const products = [
    { id: 'p001', name: 'Artisan Coffee Beans', image: 'https://placehold.co/100x100.png', stock: 82, active: true },
    { id: 'p002', name: 'Handmade Ceramic Mug', image: 'https://placehold.co/100x100.png', stock: 15, active: true },
    { id: 'p003', name: 'Organic Tea Selection', image: 'https://placehold.co/100x100.png', stock: 40, active: false },
    { id: 'p004', name: 'Gourmet Chocolate Bar', image: 'https://placehold.co/100x100.png', stock: 120, active: true },
];

export default async function SellerPage() {
  const insights = await analyzeSales({ salesData });

  return (
    <div className="flex flex-col h-full bg-muted/40 relative">
      <header className="p-4 sm:p-6 bg-background border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold font-headline">Seller Hub: The Artisan Shop</h1>
            <p className="text-muted-foreground">Your command center for managing your products and sales.</p>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$16,250.00</div>
              <p className="text-xs text-muted-foreground">+18.2% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground">3 active</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2 lg:col-span-1">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">5 waiting for shipment</p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="font-headline">Co-Pilot Insights</CardTitle>
              <CardDescription>AI-powered analysis of your recent sales data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">Summary</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{insights.summary}</p>
              </div>
              <div>
                <h3 className="font-semibold">Insights & Recommendations</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{insights.insights}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="font-headline">My Products</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ul className="divide-y divide-border">
                    {products.map((product) => (
                        <li key={product.id} className="flex items-center gap-4 p-4 flex-wrap">
                            <Image
                                src={product.image}
                                alt={product.name}
                                width={60}
                                height={60}
                                className="rounded-md object-cover"
                            />
                            <div className="flex-grow">
                                <p className="font-semibold">{product.name}</p>
                                <p className="text-sm text-muted-foreground">{product.stock} in stock</p>
                            </div>
                            <div className="flex items-center gap-4 ml-auto">
                               <Switch defaultChecked={product.active} />
                                <Button variant="ghost" size="icon">
                                    <Pencil className="h-5 w-5" />
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
          </Card>

        </div>
      </main>
      <Link href="/seller/add-product" className="fixed bottom-6 right-6">
        <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  );
}
