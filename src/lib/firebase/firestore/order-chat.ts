'use client';

import { useFirebase } from '@/firebase/provider';
import {
  Firestore,
  FirestoreError,
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import type { OrderChatMessage } from './orders';

// Hook to get chat messages for an order
export const useOrderChat = (orderId: string | undefined) => {
  const { firestore } = useFirebase();
  const [messages, setMessages] = useState<OrderChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const messagesQuery = useMemo(() => {
    if (!firestore || !orderId) return null;
    return query(
      collection(firestore, 'order_messages'),
      where('orderId', '==', orderId),
      orderBy('createdAt', 'asc')
    );
  }, [firestore, orderId]);

  useEffect(() => {
    if (!messagesQuery) {
      setIsLoading(false);
      setMessages([]);
      return;
    }

    setIsLoading(true);
    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as OrderChatMessage));
        setMessages(messagesData);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching chat messages:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [messagesQuery]);

  return { data: messages, isLoading, error };
};

// Function to send a chat message
export const sendChatMessage = async (
  firestore: Firestore,
  orderId: string,
  senderId: string,
  senderType: 'customer' | 'seller',
  message?: string,
  imageUrl?: string
) => {
  if (!firestore) throw new Error('Firestore is not initialized');
  if (!message && !imageUrl) throw new Error('Message or image is required');

  const chatCollection = collection(firestore, 'order_messages');
  return await addDoc(chatCollection, {
    orderId,
    senderId,
    senderRole: senderType === 'customer' ? 'customer' : 'seller',
    message: message || null,
    imageUrl: imageUrl || null,
    createdAt: serverTimestamp(),
  });
};

// Function to create a system message
export const createSystemMessage = async (
  firestore: Firestore,
  orderId: string,
  message: string,
  imageUrl?: string
) => {
  if (!firestore) throw new Error('Firestore is not initialized');

  const chatCollection = collection(firestore, 'order_messages');
  return await addDoc(chatCollection, {
    orderId,
    senderId: 'system',
    senderRole: 'admin',
    message,
    imageUrl: imageUrl || null,
    createdAt: serverTimestamp(),
  });
};

