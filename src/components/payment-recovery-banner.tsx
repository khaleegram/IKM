'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { usePaymentRecovery } from '@/lib/payment-recovery';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function PaymentRecoveryBanner() {
  const { recoverablePayments, recoverPayment, isRecovering } = usePaymentRecovery();
  const router = useRouter();

  if (recoverablePayments.length === 0) {
    return null;
  }

  const latestPayment = recoverablePayments[recoverablePayments.length - 1];

  return (
    <Alert className="mb-4 border-destructive/50 bg-destructive/10">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Payment Recovery Available</AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>
          A previous payment attempt failed. You can retry to complete your order.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => recoverPayment(latestPayment)}
            disabled={isRecovering}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRecovering ? 'animate-spin' : ''}`} />
            {isRecovering ? 'Recovering...' : 'Recover Payment'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/checkout')}
          >
            Start New Payment
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

