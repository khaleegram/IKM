
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Package, Users, Plus, Settings, Bus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const setupSteps = [
    { title: "Add Your First Product", description: "List items for customers to browse and buy.", href: "/seller/products/new", icon: Plus, complete: false },
    { title: "Set Up Payouts", description: "Connect your bank account to receive payments.", href: "/seller/payouts", icon: DollarSign, complete: false },
    { title: "Define Delivery Locations", description: "Add the bus stops or locations you deliver to.", href: "/seller/settings", icon: Bus, complete: false },
    { title: "Connect WhatsApp", description: "Enable fast ordering for your customers via chat.", href: "/seller/settings", icon: Users, complete: false },
];

export default function SellerDashboardPage() {
  const isSetupComplete = setupSteps.every(step => step.complete);

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 bg-background border-b">
        <div>
            <h1 className="text-2xl font-bold font-headline">Welcome to your Store!</h1>
            <p className="text-muted-foreground">Here's your guide to getting started and selling on IKM.</p>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Store Setup Guide</CardTitle>
                <CardDescription>Follow these steps to get your store ready for customers.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {setupSteps.map(step => (
                        <li key={step.title}>
                           <Link href={step.href} className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-4">
                                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step.complete ? 'bg-support' : 'bg-primary'} text-primary-foreground`}>
                                    <step.icon size={20} />
                                  </div>
                                  <div>
                                    <p className="font-semibold">{step.title}</p>
                                    <p className="text-sm text-muted-foreground">{step.description}</p>
                                  </div>
                               </div>
                               <Badge variant={step.complete ? 'support' : 'secondary'}>
                                {step.complete ? 'Complete' : 'To-Do'}
                               </Badge>
                             </div>
                           </Link>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>

        {isSetupComplete && (
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue (Today)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₦0.00</div>
                        <p className="text-xs text-muted-foreground">No sales yet today.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Orders</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">No new orders.</p>
                    </CardContent>
                </Card>
            </div>
        )}
      </main>
    </div>
  );
}
