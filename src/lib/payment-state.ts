'use client';

import { useCallback, useEffect, useState } from 'react';
// cSpell:ignore uuidv
import { v4 as uuidv4 } from 'uuid';

export type PaymentStatus = 
  | 'pending'      // Payment initiated, waiting for user action
  | 'processing'  // Payment in progress (Paystack popup open)
  | 'verifying'   // Payment completed, verifying with server
  | 'completed'   // Payment verified and order created
  | 'failed'      // Payment failed
  | 'retrying'    // Retrying failed payment
  | 'cancelled'   // User cancelled payment
  | 'expired';    // Payment expired (timeout)

export interface PaymentAttempt {
  id: string; // Idempotency key
  // cSpell:word Paystack
  reference: string; // Paystack reference
  amount: number;
  cartItems: any[];
  customerInfo: any;
  deliveryAddress: string;
  status: PaymentStatus;
  error?: string;
  retryCount: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  orderId?: string;
}

const STORAGE_KEY = 'ikm_payment_state';
const PAYMENT_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// cSpell:ignore uuidv
function generateId(): string {
  return uuidv4();
}

/**
 * Payment State Manager
 * Handles payment state persistence and recovery
 */
export function usePaymentState() {
  const [currentPayment, setCurrentPayment] = useState<PaymentAttempt | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentAttempt[]>([]);

  // Load payment state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.currentPayment) {
          // Check if payment is expired
          const age = Date.now() - data.currentPayment.createdAt;
          if (age > PAYMENT_TIMEOUT) {
            if (data.currentPayment.status === 'pending' || data.currentPayment.status === 'processing') {
              data.currentPayment.status = 'expired';
              data.currentPayment.updatedAt = Date.now();
            }
          }
          setCurrentPayment(data.currentPayment);
        }
        setPaymentHistory(data.paymentHistory || []);
      }
    } catch (error) {
      console.error('Error loading payment state:', error);
    }
  }, []);

  // Save payment state to localStorage
  const savePaymentState = useCallback((payment: PaymentAttempt | null, history: PaymentAttempt[] = paymentHistory) => {
    try {
      const data = {
        currentPayment: payment,
        paymentHistory: history,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setCurrentPayment(payment);
      setPaymentHistory(history);
    } catch (error) {
      console.error('Error saving payment state:', error);
      // Handle quota exceeded error gracefully
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        // Keep only last 10 payments in history
        const trimmedHistory = history.slice(-10);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          currentPayment: payment,
          paymentHistory: trimmedHistory,
        }));
      }
    }
  }, [paymentHistory]);

  const createPaymentAttempt = useCallback((
    reference: string,
    amount: number,
    cartItems: any[],
    customerInfo: any,
    deliveryAddress: string
  ): PaymentAttempt => {
    const payment: PaymentAttempt = {
      id: generateId(), // Idempotency key
      reference,
      amount,
      cartItems,
      customerInfo,
      deliveryAddress,
      status: 'pending',
      retryCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    savePaymentState(payment, [...paymentHistory, payment]);
    return payment;
  }, [paymentHistory, savePaymentState]);

  const updatePaymentStatus = useCallback((
    paymentId: string,
    status: PaymentStatus,
    error?: string,
    orderId?: string
  ) => {
    const updated = currentPayment?.id === paymentId
      ? { ...currentPayment, status, error, orderId, updatedAt: Date.now(), ...(status === 'completed' ? { completedAt: Date.now() } : {}) }
      : paymentHistory.find(p => p.id === paymentId);

    if (!updated) return;

    const updatedHistory = paymentHistory.map(p => 
      p.id === paymentId ? updated : p
    );

    // If completed, move to history and clear current
    if (status === 'completed' || status === 'cancelled' || status === 'expired') {
      savePaymentState(null, updatedHistory);
    } else {
      savePaymentState(updated, updatedHistory);
    }
  }, [currentPayment, paymentHistory, savePaymentState]);

  const incrementRetryCount = useCallback((paymentId: string) => {
    if (!currentPayment || currentPayment.id !== paymentId) return;

    const updated = {
      ...currentPayment,
      retryCount: currentPayment.retryCount + 1,
      status: 'retrying' as PaymentStatus,
      updatedAt: Date.now(),
    };

    const updatedHistory = paymentHistory.map(p => 
      p.id === paymentId ? updated : p
    );

    savePaymentState(updated, updatedHistory);
  }, [currentPayment, paymentHistory, savePaymentState]);

  const clearPaymentState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentPayment(null);
    setPaymentHistory([]);
  }, []);

  const getRecoverablePayments = useCallback((): PaymentAttempt[] => {
    return paymentHistory.filter(p => 
      (p.status === 'failed' || p.status === 'expired') && 
      p.retryCount < 3 // Max 3 retries
    );
  }, [paymentHistory]);

  return {
    currentPayment,
    paymentHistory,
    createPaymentAttempt,
    updatePaymentStatus,
    incrementRetryCount,
    clearPaymentState,
    getRecoverablePayments,
  };
}

