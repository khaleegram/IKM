import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingCart, AlertTriangle, ShieldCheck } from "lucide-react";
import { flagSuspiciousActivity } from "@/ai/flows/admin-suspicious-activity-flagging";
import { Badge } from "@/components/ui/badge";

export default async function AdminPage() {

    const suspiciousActivities = await Promise.all([
        flagSuspiciousActivity({ activityDetails: 'User "fraudster99" attempted 15 transactions in 2 minutes with different credit cards.' }),
        flagSuspiciousActivity({ activityDetails: 'A new seller account "SuperDeals" listed 50 high-value electronics at 90% below market price within 1 hour of account creation.' }),
        flagSuspiciousActivity({ activityDetails: 'A regular user "jane_doe" logged in from their usual location and placed an order.' }),
    ]);

    const flaggedActivities = suspiciousActivities.filter(a => a.isSuspicious);

  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 sm:p-6 bg-background border-b">
        <div>
            <h1 className="text-2xl font-bold font-headline">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform-wide analytics and management.</p>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">10,245</div>
                <p className="text-xs text-muted-foreground">+150 this week</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">25,832</div>
                <p className="text-xs text-muted-foreground">+1,204 this week</p>
                </CardContent>
            </Card>
        </div>

        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="font-headline">Co-Pilot Security Alerts</CardTitle>
                <CardDescription>AI-detected suspicious activities requiring your attention.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {flaggedActivities.length > 0 ? (
                        flaggedActivities.map((activity, index) => (
                            <div key={index} className="flex items-start gap-4 p-4 rounded-lg border border-destructive/50 bg-destructive/10">
                                <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-semibold text-destructive">Suspicious Activity Flagged</h3>
                                    <p className="text-sm text-destructive/90">{activity.reason}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                         <div className="flex items-center gap-4 p-4 rounded-lg border border-support/50 bg-support/10">
                            <ShieldCheck className="h-6 w-6 text-support flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-support">All Clear</h3>
                                <p className="text-sm text-support/90">No suspicious activities detected by Co-Pilot.</p>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
