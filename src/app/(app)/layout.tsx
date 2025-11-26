
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, Settings, BarChart2, MessageSquare, LogOut, Wallet, ShoppingCart, Loader2 } from "lucide-react";

import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarFooter } from "@/components/ui/sidebar";
import { IkmLogo } from "@/components/icons";
import { CoPilotWidget } from "@/components/copilot-widget";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import React from "react";


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useUser();
  const { auth } = useFirebase();
  const { toast } = useToast();

  const isSellerRoute = pathname.startsWith('/seller');
  
  React.useEffect(() => {
    if (!isLoading && !user && isSellerRoute) {
      router.replace('/login');
    }
  }, [isLoading, user, isSellerRoute, router]);


  const getIsActive = (path: string) => pathname === path || (path !== '/seller/dashboard' && pathname.startsWith(path));

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
    { href: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/seller/products", label: "Products", icon: Package },
    { href: "/seller/orders", label: "Orders", icon: BarChart2 },
  ];
  
  if (isSellerRoute) {
    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        )
    }

    return (
      <SidebarProvider>
        <div className="flex min-h-screen">
          <Sidebar collapsible="icon" className="border-r">
              <div id="sidebar-menu" className="flex flex-col h-full p-2">
                  <div className="p-2 pb-4">
                    <Link href="/seller/dashboard">
                      <IkmLogo className="w-auto h-7 group-data-[collapsible=icon]:hidden" />
                      <LayoutDashboard className="w-7 h-7 hidden group-data-[collapsible=icon]:block" />
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
                  <SidebarFooter>
                      <SidebarMenu>
                          <SidebarMenuItem>
                              <Link href="/seller/settings">
                                  <SidebarMenuButton 
                                      isActive={getIsActive("/seller/settings")}
                                      tooltip={{ children: "Settings", side: "right", align: "center" }}
                                  >
                                      <Settings />
                                      <span>Settings</span>
                                  </SidebarMenuButton>
                              </Link>
                          </SidebarMenuItem>
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
                  </SidebarFooter>
              </div>
          </Sidebar>
          <SidebarInset className="flex-1 bg-muted/40">
            {children}
            <CoPilotWidget />
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  // Fallback for non-seller routes, can be a simple layout
  return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="p-4 sm:p-6 flex justify-between items-center border-b">
          <Link href="/">
            <IkmLogo className="w-auto h-8" />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost">Seller Hub</Button>
            </Link>
            <Link href="/wishlist">
              <Button>My Wishlist</Button>
            </Link>
            <Link href="/cart">
              <Button size="icon" variant="outline">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Shopping Cart</span>
              </Button>
            </Link>
          </div>
        </header>
        <main className="flex-1">
            {children}
        </main>
         <footer className="p-6 text-center text-sm text-muted-foreground border-t">
            <p>&copy; {new Date().getFullYear()} IKM. All Rights Reserved.</p>
        </footer>
      </div>
  )
}
