
'use client';

import Link from 'next/link';
import { ArrowLeft, Eye, Store, TrendingUp, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import Image from 'next/image';

const kpiData = {
  '7d': { views: '1.2k', visits: '450', sales: '₦250,000', conversion: '3.5%' },
  '30d': { views: '5.8k', visits: '1.9k', sales: '₦1,625,000', conversion: '4.1%' },
  '90d': { views: '15.2k', visits: '4.5k', sales: '₦4,800,000', conversion: '3.8%' },
};

const chartData = [
  { name: 'Wk 1', sales: 350000 },
  { name: 'Wk 2', sales: 410000 },
  { name: 'Wk 3', sales: 380000 },
  { name: 'Wk 4', sales: 485000 },
];

const topProducts = [
    { id: 'p002', name: 'Handmade Ceramic Mug', image: 'https://placehold.co/100x100.png', hint: 'mug', sold: 550, revenue: 13750000 },
    { id: 'p001', name: 'Artisan Coffee Beans', image: 'https://placehold.co/100x100.png', hint: 'coffee beans', sold: 270, revenue: 5400000 },
    { id: 'p003', name: 'Organic Tea Selection', image: 'https://placehold.co/100x100.png', hint: 'tea box', sold: 100, revenue: 1500000 },
]

export default function SellerAnalyticsPage() {
  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 sm:p-6 bg-background border-b flex items-center gap-4 sticky top-0 z-10">
        <Link href="/seller">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-grow">
          <h1 className="text-xl font-bold font-headline">Analytics Dashboard</h1>
        </div>
        <div className="w-48">
            <Select defaultValue="30d">
                <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiData['30d'].views}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Store Visits</CardTitle>
                    <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiData['30d'].visits}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiData['30d'].sales}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiData['30d'].conversion}</div>
                </CardContent>
            </Card>
        </div>

        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="font-headline">Sales Trend</CardTitle>
                <CardDescription>Your total sales revenue over the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-80 w-full">
                    <ResponsiveContainer>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₦${value/1000}k`}/>
                            <Tooltip
                                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                }}
                            />
                            <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        <Card className="mt-6">
             <CardHeader>
                <CardTitle className="font-headline">Top Performers</CardTitle>
                <CardDescription>Your best-selling products in the selected period.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <ul className="divide-y divide-border">
                    {topProducts.map(p => (
                        <li key={p.id} className="flex items-center justify-between p-4 flex-wrap gap-2">
                           <div className="flex items-center gap-4">
                               <Image src={p.image} alt={p.name} data-ai-hint={p.hint} width={50} height={50} className="rounded-md" />
                                <div>
                                    <p className="font-semibold">{p.name}</p>
                                    <p className="text-xs text-muted-foreground">{p.sold.toLocaleString()} units sold</p>
                                </div>
                            </div>
                            <p className="font-bold text-base text-support">+ ₦{p.revenue.toLocaleString()}</p>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
