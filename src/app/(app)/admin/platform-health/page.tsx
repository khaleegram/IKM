
'use client';

import Link from 'next/link';
import { ArrowLeft, Users, Percent, DollarSign, LineChart, TrendingUp, UserCheck, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, FunnelChart, Funnel, LabelList, Tooltip as RechartsTooltip, Cell } from 'recharts';
import Image from 'next/image';

const kpiData = {
  userGrowth: '12.5%',
  engagementRate: '68%',
  gmv: '₦15,000,000',
  revenue: '₦1,500,000',
};

const funnelData = [
  { value: 10000, name: 'Visited', fill: 'hsl(var(--primary))' },
  { value: 7500, name: 'Viewed Product', fill: 'hsl(var(--primary) / 0.8)' },
  { value: 2500, name: 'Added to Cart', fill: 'hsl(var(--primary) / 0.6)' },
  { value: 1500, name: 'Purchased', fill: 'hsl(var(--primary) / 0.4)' },
];

const trendingProducts = [
  { id: 'p005', name: 'Wireless Noise-Cancelling Headphones', image: 'https://placehold.co/100x100.png', hint: 'headphones' },
  { id: 'p002', name: 'Handmade Ceramic Mug', image: 'https://placehold.co/100x100.png', hint: 'mug' },
  { id: 'p008', name: 'Minimalist Wall Clock', image: 'https://placehold.co/100x100.png', hint: 'clock' },
];

const topSellers = [
  { id: 's001', name: 'KicksRepublic', image: 'https://placehold.co/100x100.png', hint: 'logo business' },
  { id: 's002', name: 'The Artisan Shop', image: 'https://placehold.co/100x100.png', hint: 'logo crafts' },
  { id: 's003', name: 'GadgetHaven', image: 'https://placehold.co/100x100.png', hint: 'logo electronics' },
];

export default function PlatformHealthPage() {
  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 sm:p-6 bg-background border-b flex items-center gap-4 sticky top-0 z-10">
        <Link href="/admin">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-grow">
          <h1 className="text-xl font-bold font-headline">Platform Health & Analytics</h1>
          <p className="text-sm text-muted-foreground">High-level overview of the entire ecosystem.</p>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">User Growth (30d)</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-support">+{kpiData.userGrowth}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiData.engagementRate}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Marketplace GMV</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiData.gmv}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
                    <LineChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiData.revenue}</div>
                </CardContent>
            </Card>
        </div>

        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="font-headline">User Activity Funnel</CardTitle>
                <CardDescription>Visualizing the user journey from visit to purchase.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-80 w-full">
                    <ResponsiveContainer>
                        <FunnelChart>
                            <RechartsTooltip />
                            <Funnel dataKey="value" data={funnelData} isAnimationActive>
                                <LabelList position="right" fill="#fff" stroke="none" dataKey="name" />
                                {funnelData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Funnel>
                        </FunnelChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><TrendingUp className="text-accent" /> Trending Products</CardTitle>
                    <CardDescription>Most popular items in the last 24 hours.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <ul className="divide-y divide-border">
                        {trendingProducts.map(p => (
                            <li key={p.id} className="p-4 flex items-center gap-4 hover:bg-muted/50">
                                <Image src={p.image} alt={p.name} data-ai-hint={p.hint} width={50} height={50} className="rounded-md" />
                                <p className="font-semibold">{p.name}</p>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Star className="text-accent fill-accent" /> Top Performing Sellers</CardTitle>
                    <CardDescription>Highest sales and best reviews.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <ul className="divide-y divide-border">
                        {topSellers.map(s => (
                            <li key={s.id} className="p-4 flex items-center gap-4 hover:bg-muted/50">
                                <Image src={s.image} alt={s.name} data-ai-hint={s.hint} width={50} height={50} className="rounded-md" />
                                <p className="font-semibold">{s.name}</p>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
