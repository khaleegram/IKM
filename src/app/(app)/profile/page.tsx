
'use client';

import { ChevronRight, Edit, LogOut, Moon, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';

const settingsSections = [
    {
        title: "Account",
        items: [
            { label: "Manage Addresses", href: "#" },
            { label: "Payment & Payouts", href: "#" },
            { label: "Change Password", href: "/profile/change-password" },
        ]
    },
    {
        title: "App Settings",
        items: [
            { label: "Notifications", component: <Switch defaultChecked /> },
            { label: "Appearance", component: <div className="flex items-center gap-2 text-muted-foreground"><Moon className="h-4 w-4" /> Dark Mode</div> },
        ]
    },
    {
        title: "Support",
        items: [
            { label: "Help Center", href: "#" },
            { label: "Contact Us", href: "#" },
        ]
    }
]

export default function ProfileSettingsPage() {
  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 sm:p-6 bg-background border-b">
        <h1 className="text-2xl font-bold font-headline">Profile & Settings</h1>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline text-xl">Bolu Adekunle</CardTitle>
                <CardDescription>bolu.adekunle@example.com</CardDescription>
              </div>
              <Link href="/profile/edit">
                <Button variant="ghost" size="icon">
                  <Edit className="h-5 w-5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">Seller</Badge>
            </CardContent>
          </Card>

          {settingsSections.map(section => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="font-headline text-lg">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {section.items.map(item => (
                    <li key={item.label}>
                       <Link href={item.href || '#'} className={`flex items-center justify-between p-4 ${item.href ? 'hover:bg-muted/50' : 'cursor-default'}`}>
                            <span className="font-medium">{item.label}</span>
                            {item.component ? item.component : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                       </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}

          <div className="pt-4">
             <Link href="/login" className="w-full">
                <Button variant="destructive" size="lg" className="w-full">
                    <LogOut className="mr-2 h-5 w-5" />
                    Logout
                </Button>
             </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
