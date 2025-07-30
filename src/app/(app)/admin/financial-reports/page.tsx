
'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle, TrendingUp, BarChart, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const kpiData = {
  '7d': { gmv: '₦3,500,000', revenue: '₦350,000', payouts: '₦3,000,000', subs: '12' },
  '30d': { gmv: '₦15,000,000', revenue: '₦1,500,000', payouts: '₦12,500,000', subs: '58' },
  '90d': { gmv: '₦42,000,000', revenue: '₦4,200,000', payouts: '₦35,000,000', subs: '150' },
};

const chartData = [
  { name: 'Mon', revenue: 45000 },
  { name: 'Tue', revenue: 62000 },
  { name: 'Wed', revenue: 58000 },
  { name: 'Thu', revenue: 75000 },
  { name: 'Fri', revenue: 90000 },
  { name: 'Sat', revenue: 110000 },
  { name: 'Sun', revenue: 120000 },
];

const transactions = [
    { id: 'TXN778', type: 'Sale Commission', date: '01-Aug-2025 14:30', amount: 1500, positive: true },
    { id: 'PAYOUT91', type: 'Seller Payout', date: '01-Aug-2025 12:00', amount: 85000, positive: false },
    { id: 'SUB033', type: 'Subscription Fee', date: '01-Aug-2025 10:15', amount: 5000, positive: true },
    { id: 'TXN777', type: 'Sale Commission', date: '31-Jul-2025 18:00', amount: 850, positive: true },
    { id: 'PAYOUT90', type: 'Rider Payout', date: '31-Jul-2025 17:00', amount: 45000, positive: false },
]

export default function FinancialReportsPage() {
  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 sm:p-6 bg-background border-b flex items-center gap-4 sticky top-0 z-10">
        <Link href="/admin">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-grow">
          <h1 className="text-xl font-bold font-headline">Financial Reports</h1>
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
                    <CardTitle className="text-sm font-medium">Gross Volume (GMV)</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiData['30d'].gmv}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiData['30d'].revenue}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
                    <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiData['30d'].payouts}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">New Subscriptions</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpiData['30d'].subs}</div>
                </CardContent>
            </Card>
        </div>

        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="font-headline">Platform Revenue Over Time</CardTitle>
                <CardDescription>Revenue from commissions and fees for the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-80 w-full">
                    <ResponsiveContainer>
                        <RechartsBarChart data={chartData}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₦${value/1000}k`}/>
                            <Tooltip
                                cursor={{ fill: 'hsla(var(--muted))' }}
                                content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col">
                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                            Day
                                            </span>
                                            <span className="font-bold text-muted-foreground">
                                            {payload[0].payload.name}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                            Revenue
                                            </span>
                                            <span className="font-bold">
                                            ₦{payload[0].value.toLocaleString()}
                                            </span>
                                        </div>
                                        </div>
                                    </div>
                                    )
                                }
                                return null
                                }}
                            />
                            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        <Card className="mt-6">
             <CardHeader>
                <CardTitle className="font-headline">Detailed Transactions</CardTitle>
                <CardDescription>A log of recent financial activities on the platform.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <ul className="divide-y divide-border">
                    {transactions.map(t => (
                        <li key={t.id} className="flex items-center justify-between p-4 flex-wrap gap-2">
                            <div className="flex items-center gap-3">
                                {t.positive ? <ArrowUpCircle className="h-6 w-6 text-support" /> : <ArrowDownCircle className="h-6 w-6 text-destructive" />}
                                <div>
                                    <p className="font-semibold">{t.id} - <span className="font-normal text-muted-foreground">{t.type}</span></p>
                                    <p className="text-xs text-muted-foreground">{t.date}</p>
                                </div>
                            </div>
                            <p className={`font-bold text-lg ${t.positive ? 'text-support' : 'text-destructive'}`}>
                                {t.positive ? '+' : '-'} ₦{t.amount.toLocaleString()}
                            </p>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
