
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, Package, CheckCircle, UserPlus, FileText, Settings, Bell } from "lucide-react";
import Link from "next/link";

const kpis = [
    { title: "Revenue (Today)", value: "₦1,250,000", icon: DollarSign, urgent: false, href: "#" },
    { title: "New Users (Today)", value: "82", icon: UserPlus, urgent: false, href: "#" },
    { title: "Orders in Progress", value: "45", icon: Package, urgent: false, href: "#" },
    { title: "Pending Approvals", value: "12", icon: CheckCircle, urgent: true, href: "/admin/pending-approvals" },
];

const quickActions = [
    { label: "Manage Users", icon: Users, href: "#" },
    { label: "Approve Sellers/Riders", icon: UserPlus, href: "/admin/pending-approvals" },
    { label: "View All Orders", icon: Package, href: "#" },
    { label: "Financial Reports", icon: FileText, href: "#" },
]

const activityFeed = [
    { id: 1, text: "New Order #54321 placed by user B.Adekunle.", time: "2m ago" },
    { id: 2, text: "Rider J.Okoro accepted delivery #54321.", time: "5m ago" },
    { id: 3, text: "Seller 'ShoeHaven' added a new product: 'Leather Sandals'.", time: "10m ago" },
    { id: 4, text: "New user 'amina.b' signed up as a buyer.", time: "12m ago" },
    { id: 5, text: "Seller 'KicksRepublic' has requested verification.", time: "25m ago" },
];

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 sm:p-6 bg-background border-b">
        <div>
            <h1 className="text-2xl font-bold font-headline">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform-wide analytics and management.</p>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi, index) => (
                <Link href={kpi.href} key={index}>
                    <Card className={`${kpi.urgent ? 'bg-destructive/10 border-destructive hover:bg-destructive/20' : 'hover:bg-muted'}`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className={`text-sm font-medium ${kpi.urgent ? 'text-destructive' : ''}`}>{kpi.title}</CardTitle>
                            <kpi.icon className={`h-4 w-4 ${kpi.urgent ? 'text-destructive' : 'text-muted-foreground'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${kpi.urgent ? 'text-destructive' : ''}`}>{kpi.value}</div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>

        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="font-headline">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map(action => (
                     <Link key={action.label} href={action.href}>
                        <Button variant="outline" className="w-full h-24 flex-col gap-2">
                            <action.icon className="h-6 w-6" />
                            <span>{action.label}</span>
                        </Button>
                    </Link>
                ))}
            </CardContent>
        </Card>

        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="font-headline">Live Platform Activity</CardTitle>
                <CardDescription>A real-time feed of key events happening across the marketplace.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {activityFeed.map(item => (
                        <li key={item.id} className="flex items-start gap-4">
                             <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Bell className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-grow">
                                <p className="text-sm">{item.text}</p>
                                <p className="text-xs text-muted-foreground">{item.time}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
