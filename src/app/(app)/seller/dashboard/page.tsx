
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Package, Users, Plus } from "lucide-react";
import Link from "next/link";

const kpis = [
    { title: "Revenue (Today)", value: "₦250,000", icon: DollarSign, description: "+20.1% from last day" },
    { title: "New Orders", value: "12", icon: Package, description: "+5 from yesterday" },
    { title: "New Customers", value: "3", icon: Users, description: "Your newest buyers" },
];

const recentOrders = [
    { id: 'ORD001', customer: 'Amina Bello', total: '₦45,000' },
    { id: 'ORD002', customer: 'Chinedu Eze', total: '₦8,500' },
    { id: 'ORD003', customer: 'Fatima Diallo', total: '₦120,000' },
]

export default function SellerDashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 bg-background border-b flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold font-headline">My Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's a summary of your store's activity.</p>
        </div>
        <Link href="/seller/products/new">
            <Button>
                <Plus className="mr-2" /> Add Product
            </Button>
        </Link>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {kpis.map((kpi, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                        <kpi.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpi.value}</div>
                        <p className="text-xs text-muted-foreground">{kpi.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>

        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="font-headline">Recent Orders</CardTitle>
                <CardDescription>A list of your most recent incoming orders.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="divide-y divide-border">
                    {recentOrders.map(order => (
                        <li key={order.id} className="flex items-center justify-between p-2 flex-wrap gap-2">
                           <div className="font-medium">{order.id} - <span className="text-muted-foreground">{order.customer}</span></div>
                           <div className="font-bold">{order.total}</div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
