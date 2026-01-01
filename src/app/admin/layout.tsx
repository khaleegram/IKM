
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, Users, LogOut, BarChart2, Loader2, ShieldCheck, Palette, DollarSign, AlertTriangle, Settings, MapPin, Lock } from "lucide-react";
import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/firebase/provider";
import { signOut } from "firebase/auth";
import React, { useEffect } from "react";
import { DynamicLogo } from "@/components/DynamicLogo";

// The middleware now handles authentication and authorization.
// This layout is just for the UI shell.

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, claims } = useUser();
  const { auth } = useFirebase();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      // Sign out from Firebase client-side first
      if (auth) {
        await signOut(auth);
      }
      
      // Clear server-side session cookie
      const response = await fetch('/api/logout', { method: 'POST' });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      
      // Force a hard navigation to clear any cached state and prevent back button issues
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      toast({ variant: 'destructive', title: "Logout Failed", description: "Something went wrong." });
    }
  };

  // Middleware handles admin verification - this is just for UI feedback
  // If middleware let us through, we're good. Just show loading while auth initializes.
  // Also verify client-side as a backup (in case middleware timed out)
  useEffect(() => {
    if (!isLoading && user) {
      // If claims have loaded and user is not admin, redirect
      if (claims !== null && claims?.isAdmin !== true) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have permission to access the admin panel.",
        });
        router.push('/seller/dashboard');
      }
    } else if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, claims, router, toast]);

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/orders", label: "Orders", icon: BarChart2 },
    { href: "/admin/reports", label: "Reports", icon: BarChart2 },
    { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
    { href: "/admin/payouts", label: "Payouts", icon: DollarSign },
    { href: "/admin/parks", label: "Parks", icon: MapPin },
    { href: "/admin/branding", label: "Branding", icon: Palette },
    { href: "/admin/security", label: "Security", icon: Lock },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  const getIsActive = (path: string) => pathname === path || (path !== '/admin/dashboard' && pathname.startsWith(path));

  // Always render the layout structure so Next.js knows the route exists
  // Show loading/access denied overlays but always render children for route compilation
  // Show loading or access denied overlay, but always render children
  const showLoading = isLoading || !user;
  const showAccessDenied = claims !== null && claims?.isAdmin !== true;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar collapsible="icon" className="border-r">
          <div id="sidebar-menu" className="flex flex-col h-full p-2">
            <div className="p-2 pb-4">
              <Link href="/admin/dashboard">
                <div className="group-data-[collapsible=icon]:hidden"><DynamicLogo className="w-auto h-7" /></div>
                <ShieldCheck className="w-7 h-7 hidden group-data-[collapsible=icon]:block" />
              </Link>
            </div>
            <SidebarMenu className="flex-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      isActive={getIsActive(item.href)}
                      tooltip={{ children: item.label, side: "right", align: "center" }}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  tooltip={{ children: "Logout", side: "right", align: "center" }}
                >
                  <LogOut />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </Sidebar>
        <SidebarInset className="flex-1 bg-muted/40 relative">
          {showLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-50">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="ml-4 text-lg text-muted-foreground">
                {isLoading ? 'Loading Admin Portal...' : 'Verifying access...'}
              </p>
            </div>
          )}
          {showAccessDenied && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-50">
              <Card className="w-full max-w-md text-center">
                <CardHeader>
                  <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-destructive" />
                  <CardTitle className="text-destructive">Access Denied</CardTitle>
                  <CardDescription>
                    You don't have permission to access the admin panel.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          )}
          {/* Always render children so Next.js knows the route exists */}
          <div className={showLoading || showAccessDenied ? 'opacity-0 pointer-events-none' : ''}>
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}