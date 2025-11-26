
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Settings, BarChart2, MessageSquare, LogOut, Wallet, ShoppingCart } from "lucide-react";

import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarFooter } from "@/components/ui/sidebar";
import { IkmLogo } from "@/components/icons";
import { CoPilotWidget } from "@/components/copilot-widget";
import { Button } from "@/components/ui/button";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const getIsActive = (path: string) => pathname === path || (path !== '/seller/dashboard' && pathname.startsWith(path));

  const navItems = [
    { href: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/seller/products", label: "Products", icon: Package },
    { href: "/seller/orders", label: "Orders", icon: BarChart2 },
  ];
  
  if (pathname.startsWith('/seller')) {
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
                              <Link href="/">
                                  <SidebarMenuButton
                                      tooltip={{ children: "Logout", side: "right", align: "center" }}
                                  >
                                      <LogOut />
                                      <span>Logout</span>
                                  </SidebarMenuButton>
                              </Link>
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
