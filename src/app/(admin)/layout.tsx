
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, Users, LogOut, BarChart2, Loader2, ShieldCheck, Palette } from "lucide-react";

import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from "@/components/ui/sidebar";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useFirebase } from "@/firebase/provider";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import React, { useState } from "react";
import { IkmLogo } from "@/components/icons";
import { grantAdminRoleToFirstUser } from "@/lib/admin-actions";

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

  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  const isAdmin = claims?.isAdmin === true;

  React.useEffect(() => {
    if (isLoading) {
      return; // Wait until user auth state is resolved
    }

    if (!user) {
      router.replace('/login?redirect=/admin/dashboard');
      return;
    }

    // If user is loaded, try to grant admin and see if they are one
    const checkAndSetAdmin = async () => {
      // This server action checks if they are the first user and grants admin if so.
      // It's designed to only run the grant logic once.
      await grantAdminRoleToFirstUser(user.uid);
      
      // Force a refresh of the user's token to get the latest claims
      await user.getIdToken(true);
      
      // Check claims again after attempting to grant
      const idTokenResult = await user.getIdTokenResult();
      if (idTokenResult.claims.isAdmin) {
        setIsCheckingAdmin(false);
      } else {
        // If still not admin after the check, then they are unauthorized.
        toast({ variant: 'destructive', title: "Unauthorized", description: "You do not have permission to access this page."});
        router.replace('/');
      }
    };

    if (!isAdmin) {
      checkAndSetAdmin();
    } else {
      setIsCheckingAdmin(false);
    }
  }, [isLoading, user, isAdmin, router, toast]);

  if (isLoading || isCheckingAdmin) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    )
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out."});
      router.push('/login');
    } catch (error) {
      toast({ variant: 'destructive', title: "Logout Failed", description: "Something went wrong."});
    }
  };

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
                    <IkmLogo className="w-auto h-7 group-data-[collapsible=icon]:hidden" />
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
