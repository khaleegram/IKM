'use client';

import { useState, useTransition } from 'react';
import { retryPaymentVerification, checkPaymentStatus } from '@/lib/payment-actions';
import { usePaymentState, type PaymentAttempt } from './payment-state';
import { useToast } from '@/hooks/use-toast';

/**
 * Payment Recovery Hook
 * Handles retry logic and recovery flows
 */
export function usePaymentRecovery() {
  const { updatePaymentStatus, incrementRetryCount, getRecoverablePayments } = usePaymentState();
  const { toast } = useToast();
  const [isRecovering, setIsRecovering] = useState(false);
  const [isPending, startTransition] = useTransition();

  const recoverPayment = async (payment: PaymentAttempt) => {
    if (payment.retryCount >= 3) {
      toast({
        variant: 'destructive',
        title: 'Max Retries Reached',
        description: 'This payment has reached the maximum number of retry attempts. Please contact support.',
      });
      return;
    }

    setIsRecovering(true);
    incrementRetryCount(payment.id);

    startTransition(async () => {
      try {
        // First check if payment was actually successful
        const statusCheck = await checkPaymentStatus(payment.reference);
        
        if (statusCheck.exists && statusCheck.status === 'success') {
          // Payment was successful, retry order creation
          const result = await retryPaymentVerification({
            reference: payment.reference,
            idempotencyKey: payment.id,
            cartItems: payment.cartItems,
            total: payment.amount,
            deliveryAddress: payment.deliveryAddress,
            customerInfo: payment.customerInfo,
          });

          if (result.success) {
            updatePaymentStatus(payment.id, 'completed', undefined, result.orderId);
            toast({
              title: 'Payment Recovered!',
              description: 'Your order has been successfully created.',
            });
            return { success: true, orderId: result.orderId };
          }
        } else {
          // Payment not successful, cannot recover
          updatePaymentStatus(payment.id, 'failed', 'Payment was not successful');
          toast({
            variant: 'destructive',
            title: 'Recovery Failed',
            description: 'Payment was not successful. Please try a new payment.',
          });
          return { success: false, error: 'Payment not successful' };
        }
      } catch (error) {
        updatePaymentStatus(payment.id, 'failed', (error as Error).message);
        toast({
          variant: 'destructive',
          title: 'Recovery Failed',
          description: (error as Error).message,
        });
        return { success: false, error: (error as Error).message };
      } finally {
        setIsRecovering(false);
      }
    });
  };

  return {
    recoverPayment,
    isRecovering: isRecovering || isPending,
    recoverablePayments: getRecoverablePayments(),
  };
}

