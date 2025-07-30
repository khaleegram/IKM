"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bike, LayoutDashboard, Shield, ShoppingCart, Store, User } from "lucide-react";

import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarFooter } from "@/components/ui/sidebar";
import { IkmLogo } from "@/components/icons";
import { CoPilotWidget } from "@/components/copilot-widget";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const getIsActive = (path: string) => pathname.startsWith(path);

  const navItems = [
    { href: "/buyer", label: "Marketplace", icon: ShoppingCart },
    { href: "/seller", label: "Seller Hub", icon: Store },
    { href: "/rider", label: "Rider Zone", icon: Bike },
    { href: "/admin", label: "Admin Panel", icon: Shield },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar collapsible="icon" className="border-r">
            <div className="flex flex-col h-full p-2">
                <div className="p-2 pb-4">
                  <Link href="/buyer">
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
                             <Link href="/profile">
                                <SidebarMenuButton 
                                    isActive={getIsActive("/profile")}
                                    tooltip={{ children: "Profile & Settings", side: "right", align: "center" }}
                                >
                                    <Avatar className="w-7 h-7">
                                        <AvatarFallback>B</AvatarFallback>
                                    </Avatar>
                                    <span>Profile</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </div>
        </Sidebar>
        <SidebarInset className="flex-1">
          {children}
        </SidebarInset>
        <CoPilotWidget />
      </div>
    </SidebarProvider>
  );
}
