

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, Settings, BarChart2, MessageSquare, LogOut, Wallet, ShoppingCart, Loader2, Store, User as UserIcon, ShieldCheck, Menu } from "lucide-react";

import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarFooter } from "@/components/ui/sidebar";
import { IkmLogo } from "@/components/icons";
import { CoPilotWidget } from "@/components/copilot-widget";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useToast } from "@/hooks/use-toast";
import React, { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { Badge } from "@/components/ui/badge";
import { useOrdersBySeller } from "@/lib/firebase/firestore/orders";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, claims } = useUser();
  const { toast } = useToast();
  const { cartCount } = useCart();
  const { data: orders, isLoading: isLoadingOrders } = useOrdersBySeller(user?.uid);
  
  const isInitialLoad = useRef(true);
  
  useEffect(() => {
    if (!isLoadingOrders) {
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
      } else {
        toast({
          title: "New Order Received!",
          description: "A customer has placed a new order. Check your orders page.",
        });
      }
    }
  }, [orders, isLoadingOrders, toast]);

  const isSellerRoute = pathname.startsWith('/seller');
  const isAdmin = claims?.isAdmin === true;

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      toast({ title: "Logged Out", description: "You have been successfully logged out."});
      router.push('/login');
    } catch (error) {
      toast({ variant: 'destructive', title: "Logout Failed", description: "Something went wrong."});
    }
  };

  const getIsActive = (path: string) => pathname === path || (path.split('/').length > 2 && pathname.startsWith(path));

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

  // Layout for customer-facing routes
  return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="p-4 sm:p-6 flex justify-between items-center border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <Link href="/">
            <IkmLogo className="w-auto h-8" />
          </Link>
          <nav className="hidden md:flex items-center gap-2 sm:gap-4">
            <Link href="/stores">
              <Button variant="ghost">
                <Store className="mr-2 h-4 w-4" />
                All Stores
              </Button>
            </Link>
            <Link href="/seller/dashboard">
              <Button variant="ghost">Seller Hub</Button>
            </Link>
             {isAdmin && (
              <Link href="/admin/dashboard">
                <Button variant="outline">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
            {user && (
              <Link href="/profile">
                <Button variant="ghost">
                  <UserIcon className="mr-2 h-4 w-4" />
                  My Orders
                </Button>
              </Link>
            )}
            <Link href="/cart" className="relative">
              <Button size="icon" variant="outline">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Shopping Cart</span>
              </Button>
              {cartCount > 0 && (
                <Badge className="absolute -right-2 -top-2 h-5 w-5 justify-center p-0" variant="destructive">{cartCount}</Badge>
              )}
            </Link>
             {!user && !isLoading && (
              <Link href="/login">
                <Button>Login</Button>
              </Link>
            )}
            {user && (
                 <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="h-5 w-5" /></Button>
            )}
          </nav>
           <div className="md:hidden flex items-center gap-2">
                <Link href="/cart" className="relative">
                  <Button size="icon" variant="outline">
                    <ShoppingCart className="h-5 w-5" />
                    <span className="sr-only">Shopping Cart</span>
                  </Button>
                  {cartCount > 0 && (
                    <Badge className="absolute -right-2 -top-2 h-5 w-5 justify-center p-0" variant="destructive">{cartCount}</Badge>
                  )}
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuItem asChild><Link href="/stores">All Stores</Link></DropdownMenuItem>
                     <DropdownMenuItem asChild><Link href="/seller/dashboard">Seller Hub</Link></DropdownMenuItem>
                    {user && <DropdownMenuItem asChild><Link href="/profile">My Orders</Link></DropdownMenuItem>}
                    {user && isAdmin && <DropdownMenuItem asChild><Link href="/admin/dashboard">Admin</Link></DropdownMenuItem>}
                    <DropdownMenuSeparator />
                    {user ? (
                      <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem asChild><Link href="/login">Login</Link></DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
        <main className="flex-1">
            {children}
        </main>
         <footer className="p-6 text-center text-sm text-muted-foreground border-t">
            <p>&copy; {new Date().getFullYear()} IK Market Place. All Rights Reserved.</p>
        </footer>
        <CoPilotWidget />
      </div>
  )
}
