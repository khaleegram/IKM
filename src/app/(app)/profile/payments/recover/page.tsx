'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePaymentRecovery } from '@/lib/payment-recovery';
import { usePaymentState } from '@/lib/payment-state';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

export default function PaymentRecoveryPage() {
  const { recoverablePayments, recoverPayment, isRecovering } = usePaymentRecovery();
  const { paymentHistory } = usePaymentState();
  const router = useRouter();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'expired':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "destructive" | "secondary" => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
      case 'expired':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-headline">Payment Recovery</h1>
        <p className="text-muted-foreground mt-1">
          Recover failed or incomplete payments
        </p>
      </div>

      {recoverablePayments.length === 0 && paymentHistory.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <CardTitle>No Payments to Recover</CardTitle>
            <CardDescription className="mt-2">
              All your payments have been successfully processed.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Recoverable Payments */}
          {recoverablePayments.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Recoverable Payments</h2>
              <div className="space-y-3">
                {recoverablePayments.map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(payment.status)}
                            <CardTitle className="text-base sm:text-lg">
                              Payment #{payment.reference.slice(-8)}
                            </CardTitle>
                            <Badge variant={getStatusVariant(payment.status)}>
                              {payment.status}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>Amount: ₦{payment.amount.toLocaleString()}</p>
                            <p>Attempted: {format(new Date(payment.createdAt), 'PPP p')}</p>
                            {payment.error && (
                              <p className="text-destructive">Error: {payment.error}</p>
                            )}
                            {payment.retryCount > 0 && (
                              <p>Retries: {payment.retryCount}/3</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => recoverPayment(payment)}
                            disabled={isRecovering}
                            className="flex-1 sm:flex-initial"
                          >
                            <RefreshCw className={`mr-2 h-4 w-4 ${isRecovering ? 'animate-spin' : ''}`} />
                            {isRecovering ? 'Recovering...' : 'Recover'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Payment History */}
          {paymentHistory.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Payment History</h2>
              <div className="space-y-3">
                {paymentHistory
                  .filter(p => !recoverablePayments.find(rp => rp.id === p.id))
                  .map((payment) => (
                    <Card key={payment.id}>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusIcon(payment.status)}
                              <CardTitle className="text-base sm:text-lg">
                                Payment #{payment.reference.slice(-8)}
                              </CardTitle>
                              <Badge variant={getStatusVariant(payment.status)}>
                                {payment.status}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>Amount: ₦{payment.amount.toLocaleString()}</p>
                              <p>Date: {format(new Date(payment.createdAt), 'PPP p')}</p>
                              {payment.orderId && (
                                <p>
                                  Order: <a href={`/profile`} className="text-primary hover:underline">#{payment.orderId.slice(0, 7)}</a>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

