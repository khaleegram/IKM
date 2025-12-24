"use client";

import { NotificationsBell } from "@/components/notifications-bell";
import { BarChart2, DollarSign, FileText, Globe, LayoutDashboard, Loader2, LogOut, Megaphone, Menu, Package, Palette, Settings, ShoppingCart, Store, TrendingUp, Truck, User as UserIcon, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { DynamicLogo } from "@/components/DynamicLogo";
import { ClientOnly } from "@/components/client-only";
import { GlobalSearch } from "@/components/global-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarFooter, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/lib/cart-context";
import { useUser } from "@/lib/firebase/auth/use-user";
import dynamic from "next/dynamic";
import React from "react";

// Lazy load heavy components to avoid blocking initial render
const CoPilotWidget = dynamic(() => import('@/components/copilot-widget').then(mod => ({ default: mod.CoPilotWidget })), {
  ssr: false,
});

const OrdersListener = dynamic(() => import('@/components/orders-listener').then(mod => ({ default: mod.OrdersListener })), {
  ssr: false,
});


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
  
  // Only fetch orders on seller routes and when user is available
  const isSellerRoute = pathname.startsWith('/seller');
  const shouldFetchOrders = isSellerRoute && user?.uid;

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
    { href: "/seller/customers", label: "Customers", icon: Users },
    { href: "/seller/analytics", label: "Analytics", icon: TrendingUp },
    { href: "/seller/reports", label: "Reports", icon: FileText },
    { href: "/seller/marketing", label: "Marketing", icon: Megaphone },
    { href: "/seller/shipping", label: "Shipping", icon: Truck },
    { href: "/seller/payouts", label: "Payments", icon: DollarSign },
    { href: "/seller/storefront", label: "Storefront", icon: Palette },
    { href: "/seller/domain", label: "Domain", icon: Globe },
  ];

  // Handle redirect to login for seller routes - must be in useEffect
  useEffect(() => {
    if (isSellerRoute && !isLoading && !user) {
      router.push('/login?redirect=' + encodeURIComponent(pathname));
    }
  }, [isSellerRoute, isLoading, user, router, pathname]);
  
  if (isSellerRoute) {
    // Show loading only for auth, don't block on other data
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        )
    }

    // Show loading while redirecting if not authenticated
    if (!user) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <SidebarProvider>
        <div className="flex min-h-screen">
          <Sidebar collapsible="icon" className="border-r">
              <div id="sidebar-menu" className="flex flex-col h-full p-2">
                  <div className="p-2 pb-4">
                    <Link href="/seller/dashboard">
                      <div className="group-data-[collapsible=icon]:hidden"><DynamicLogo className="w-auto h-7" /></div>
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
            {/* Seller Dashboard Header */}
            <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-14 items-center gap-4 px-4">
                {/* Global Search */}
                <GlobalSearch />

                {/* Notifications */}
                <div className="flex items-center gap-2">
                  <NotificationsBell />
                  
                  {/* User Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <UserIcon className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium">{user?.email}</p>
                        <p className="text-xs text-muted-foreground">Seller Account</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/seller/settings">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <UserIcon className="mr-2 h-4 w-4" />
                          My Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {children}
            {shouldFetchOrders && (
              <ClientOnly>
                <OrdersListener />
              </ClientOnly>
            )}
            <ClientOnly>
              <CoPilotWidget />
            </ClientOnly>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  // Layout for customer-facing routes - Clean and minimal
  return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="p-4 sm:p-6 flex justify-between items-center border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <Link href="/">
            <DynamicLogo className="w-auto h-8" />
          </Link>
          
          {/* Cart and Menu */}
          <div className="flex items-center gap-2">
            {/* Shopping Cart */}
            <Link href="/cart" className="relative">
              <Button size="icon" variant="outline">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Shopping Cart</span>
              </Button>
              {cartCount > 0 && (
                <Badge className="absolute -right-2 -top-2 h-5 w-5 justify-center p-0" variant="destructive">{cartCount}</Badge>
              )}
            </Link>

            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden md:flex items-center gap-2 sm:gap-4">
              {user ? (
                <>
                  <Link href="/profile">
                    <Button variant="ghost" size="sm">
                      <UserIcon className="h-4 w-4 mr-2" />
                      My Account
                    </Button>
                  </Link>
                  <Link href="/seller/dashboard">
                    <Button variant="ghost" size="sm">
                      <Store className="h-4 w-4 mr-2" />
                      Seller Hub
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">Logout</span>
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/buyer-login">
                    <Button variant="ghost" size="sm">Login</Button>
                  </Link>
                  <Link href="/buyer-signup">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                  <Link href="/seller/dashboard">
                    <Button variant="ghost" size="sm">
                      <Store className="h-4 w-4 mr-2" />
                      Seller Hub
                    </Button>
                  </Link>
                </>
              )}
            </nav>

            {/* Hamburger Menu - Mobile */}
            <ClientOnly>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {user ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <UserIcon className="mr-2 h-4 w-4" />
                          My Account
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/seller/dashboard">
                          <Store className="mr-2 h-4 w-4" />
                          Seller Hub
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/buyer-login">
                          <UserIcon className="mr-2 h-4 w-4" />
                          Login
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/buyer-signup">
                          <UserIcon className="mr-2 h-4 w-4" />
                          Sign Up
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/seller/dashboard">
                          <Store className="mr-2 h-4 w-4" />
                          Seller Hub
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </ClientOnly>
          </div>
        </header>
        <main className="flex-1">
            {children}
        </main>
         <footer className="p-6 text-center text-sm text-muted-foreground border-t">
            <p>&copy; {new Date().getFullYear()} IK Market Place. All Rights Reserved.</p>
        </footer>
        <ClientOnly>
          <CoPilotWidget />
        </ClientOnly>
      </div>
  )
}
