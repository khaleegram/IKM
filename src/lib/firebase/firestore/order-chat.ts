'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  DocumentData,
  FirestoreError,
  serverTimestamp,
  Firestore,
  Timestamp,
} from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
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
      collection(firestore, 'orders', orderId, 'chat'),
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

  const chatCollection = collection(firestore, 'orders', orderId, 'chat');
  return await addDoc(chatCollection, {
    orderId,
    senderId,
    senderType,
    message: message || null,
    imageUrl: imageUrl || null,
    isSystemMessage: false,
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

  const chatCollection = collection(firestore, 'orders', orderId, 'chat');
  return await addDoc(chatCollection, {
    orderId,
    senderId: 'system',
    senderType: 'system',
    message,
    imageUrl: imageUrl || null,
    isSystemMessage: true,
    createdAt: serverTimestamp(),
  });
};

