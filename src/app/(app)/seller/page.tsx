import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Package, PlusCircle, BarChart2 } from "lucide-react";
import { analyzeSales } from "@/ai/flows/seller-sales-analysis";

const salesData = JSON.stringify([
    { productId: 'p001', productName: 'Artisan Coffee Beans', quantity: 150, price: 20, date: '2023-10-01' },
    { productId: 'p002', productName: 'Handmade Ceramic Mug', quantity: 250, price: 25, date: '2023-10-05' },
    { productId: 'p003', productName: 'Organic Tea Selection', quantity: 100, price: 15, date: '2023-10-12' },
    { productId: 'p001', productName: 'Artisan Coffee Beans', quantity: 120, price: 20, date: '2023-11-01' },
    { productId: 'p002', productName: 'Handmade Ceramic Mug', quantity: 300, price: 25, date: '2023-11-05' },
]);

export default async function SellerPage() {
  const insights = await analyzeSales({ salesData });

  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 sm:p-6 bg-background border-b">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold font-headline">Seller Hub: The Artisan Shop</h1>
            <p className="text-muted-foreground">Your command center for managing your products and sales.</p>
          </div>
          <Button>
            <PlusCircle className="mr-2" />
            Add New Product
          </Button>
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
              <div className="text-2xl font-bold">42</div>
              <p className="text-xs text-muted-foreground">3 new products this month</p>
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
        </div>
      </main>
    </div>
  );
}
