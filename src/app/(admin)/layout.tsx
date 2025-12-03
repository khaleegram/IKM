
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, Users, LogOut, BarChart2, Loader2, ShieldCheck, Palette } from "lucide-react";
import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from "@/components/ui/sidebar";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login');
    } catch (error) {
      toast({ variant: 'destructive', title: "Logout Failed", description: "Something went wrong." });
    }
  };

  // While auth state is loading, show a loading screen.
  // The middleware prevents unauthenticated access, but this handles the initial client-side render.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading Admin Portal...</p>
      </div>
    );
  }

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/orders", label: "Orders", icon: BarChart2 },
    { href: "/admin/branding", label: "Branding", icon: Palette },
  ];

  const getIsActive = (path: string) => pathname === path || (path !== '/admin/dashboard' && pathname.startsWith(path));

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
        <SidebarInset className="flex-1 bg-muted/40">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
