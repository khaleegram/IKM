'use client';

import { useState } from 'react';
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications, markNotificationAsRead } from "@/lib/firebase/firestore/notifications";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useFirebase } from "@/firebase/provider";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export function NotificationsBell() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { data: notifications, unreadCount, isLoading } = useNotifications(user?.uid, 20);
  const { toast } = useToast();
  const [isMarkingRead, setIsMarkingRead] = useState<string | null>(null);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!firestore) return;
    
    setIsMarkingRead(notificationId);
    try {
      await markNotificationAsRead(firestore, notificationId);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to mark notification as read' });
    } finally {
      setIsMarkingRead(null);
    }
  };

  const getNotificationLink = (notification: any) => {
    if (notification.orderId) {
      return `/profile/orders/${notification.orderId}`;
    }
    if (notification.payoutId) {
      return `/seller/payouts`;
    }
    return null;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order':
      case 'order_confirmed':
      case 'order_status_update':
        return '📦';
      case 'payout_completed':
      case 'payout_failed':
      case 'payout_reversed':
        return '💰';
      case 'review_received':
        return '⭐';
      case 'message':
        return '💬';
      default:
        return '🔔';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} unread</Badge>
            )}
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const link = getNotificationLink(notification);
                const content = (
                  <div
                    className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => !notification.read && handleMarkAsRead(notification.id!)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={`font-semibold text-sm ${!notification.read ? 'font-bold' : ''}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {notification.createdAt ? format(notification.createdAt.toDate(), 'MMM dd, HH:mm') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                );

                return link ? (
                  <Link key={notification.id} href={link}>
                    {content}
                  </Link>
                ) : (
                  <div key={notification.id}>{content}</div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

