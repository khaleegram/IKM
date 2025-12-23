'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, DocumentData, FirestoreError, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';

export interface Notification extends DocumentData {
  id?: string;
  userId: string;
  type: 'new_order' | 'order_confirmed' | 'order_status_update' | 'payout_completed' | 'payout_failed' | 'payout_reversed' | 'review_received' | 'message' | 'system';
  title: string;
  message: string;
  orderId?: string;
  payoutId?: string;
  read: boolean;
  createdAt?: any;
  link?: string; // Optional link to navigate to
}

/**
 * Hook to get user notifications
 */
export function useNotifications(userId: string | undefined, notificationLimit: number = 50) {
  const { firestore } = useFirebase();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!firestore || !userId) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(firestore, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(notificationLimit)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notificationsData: Notification[] = [];
        let unread = 0;
        
        snapshot.forEach((doc) => {
          const notification = {
            id: doc.id,
            ...doc.data(),
          } as Notification;
          
          notificationsData.push(notification);
          if (!notification.read) {
            unread++;
          }
        });
        
        setNotifications(notificationsData);
        setUnreadCount(unread);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching notifications:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, userId, notificationLimit]);

  return { data: notifications, unreadCount, isLoading, error };
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(firestore: any, notificationId: string) {
  const notificationRef = doc(firestore, 'notifications', notificationId);
  await updateDoc(notificationRef, {
    read: true,
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(firestore: any, userId: string) {
  const notificationsQuery = query(
    collection(firestore, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );

  // Note: This requires a batch update in production
  // For now, we'll handle this server-side
}

