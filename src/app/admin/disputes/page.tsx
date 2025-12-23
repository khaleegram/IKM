'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { resolveDispute } from '@/lib/dispute-actions';
import { useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAllOrders } from '@/lib/firebase/firestore/orders';
import { format } from 'date-fns';
import Image from 'next/image';
import type { Order, OrderDispute } from '@/lib/firebase/firestore/orders';

export default function AdminDisputesPage() {
  const { data: orders, isLoading } = useAllOrders();
  const { toast } = useToast();
  const [selectedDispute, setSelectedDispute] = useState<{ order: Order; dispute: OrderDispute } | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolution, setResolution] = useState<'favor_customer' | 'favor_seller' | 'partial_refund'>('favor_customer');
  const [refundAmount, setRefundAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isPending, startTransition] = useTransition();

  // Filter orders with open disputes
  const disputedOrders = orders?.filter(
    (order) => order.status === 'Disputed' && order.dispute?.status === 'open'
  ) || [];

  const handleResolve = () => {
    if (!selectedDispute) return;

    startTransition(async () => {
      try {
        await resolveDispute({
          orderId: selectedDispute.order.id!,
          resolution,
          refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
          notes: notes || undefined,
        });

        toast({
          title: 'Dispute Resolved',
          description: 'The dispute has been resolved and funds have been processed.',
        });

        setShowResolveDialog(false);
        setSelectedDispute(null);
        setResolution('favor_customer');
        setRefundAmount('');
        setNotes('');
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Resolution Failed',
          description: (error as Error).message,
        });
      }
    });
  };

  const openResolveDialog = (order: Order) => {
    if (!order.dispute) return;
    setSelectedDispute({ order, dispute: order.dispute });
    setRefundAmount(order.total ? (order.total * 0.5).toFixed(2) : '0');
    setShowResolveDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 md:p-6 bg-background border-b">
        <h1 className="text-2xl font-bold font-headline">Dispute Management</h1>
        <p className="text-muted-foreground mt-1">
          Review and resolve customer disputes
        </p>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-6">
        {disputedOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <CardTitle>No Open Disputes</CardTitle>
              <CardDescription className="mt-2">
                All disputes have been resolved.
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {disputedOrders.map((order) => {
              const dispute = order.dispute!;
              return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                          Order #{order.id?.slice(0, 7)}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Dispute Type: {dispute.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </CardDescription>
                      </div>
                      <Badge variant="destructive">Open</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-semibold">Order Details</Label>
                        <div className="mt-2 space-y-1 text-sm">
                          <p>Total: ₦{order.total.toLocaleString()}</p>
                          <p>Placed: {format(order.createdAt.toDate(), 'PPP')}</p>
                          <p>Customer ID: {order.customerId.slice(0, 8)}...</p>
                          <p>Seller ID: {order.sellerId.slice(0, 8)}...</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">Dispute Details</Label>
                        <div className="mt-2 space-y-1 text-sm">
                          <p>Opened: {format(dispute.createdAt.toDate(), 'PPP')}</p>
                          <p>Description:</p>
                          <p className="text-muted-foreground">{dispute.description}</p>
                        </div>
                      </div>
                    </div>

                    {dispute.photos && dispute.photos.length > 0 && (
                      <div>
                        <Label className="text-sm font-semibold">Photos</Label>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                          {dispute.photos.map((photo, idx) => (
                            <div key={idx} className="relative aspect-square">
                              <Image
                                src={photo}
                                alt={`Dispute photo ${idx + 1}`}
                                fill
                                className="object-cover rounded"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t">
                      <Button onClick={() => openResolveDialog(order)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Resolve Dispute
                      </Button>
                      <Button variant="outline" asChild>
                        <a href={`/admin/orders/${order.id}`} target="_blank" rel="noopener noreferrer">
                          View Order Details
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Resolve Dispute Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Review the dispute and choose a resolution. This action will process funds accordingly.
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-4">
              <div>
                <Label>Resolution</Label>
                <Select value={resolution} onValueChange={(value: any) => setResolution(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="favor_customer">
                      Favor Customer (Full Refund)
                    </SelectItem>
                    <SelectItem value="favor_seller">
                      Favor Seller (Release Funds)
                    </SelectItem>
                    <SelectItem value="partial_refund">
                      Partial Refund
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {resolution === 'partial_refund' && (
                <div>
                  <Label>Refund Amount (₦)</Label>
                  <Input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="Enter refund amount"
                    max={selectedDispute.order.total}
                    min={0}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Order total: ₦{selectedDispute.order.total.toLocaleString()}
                  </p>
                </div>
              )}

              <div>
                <Label>Resolution Notes (Optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about the resolution..."
                  rows={4}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2">Resolution Summary:</p>
                {resolution === 'favor_customer' && (
                  <p className="text-sm">
                    Customer will receive a full refund of ₦{selectedDispute.order.total.toLocaleString()}
                  </p>
                )}
                {resolution === 'favor_seller' && (
                  <p className="text-sm">
                    Seller will receive ₦{((selectedDispute.order.total || 0) * (1 - (selectedDispute.order.commissionRate || 0.05))).toLocaleString()} (after {(selectedDispute.order.commissionRate || 0.05) * 100}% commission)
                  </p>
                )}
                {resolution === 'partial_refund' && refundAmount && (
                  <p className="text-sm">
                    Customer will receive ₦{parseFloat(refundAmount).toLocaleString()} refund.
                    {(() => {
                      const commissionRate = selectedDispute.order.commissionRate || 0.05;
                      const commission = (selectedDispute.order.total || 0) * commissionRate;
                      const sellerAmount = (selectedDispute.order.total || 0) - parseFloat(refundAmount) - commission;
                      return `Seller will receive ₦${sellerAmount.toLocaleString()} (after ${(commissionRate * 100).toFixed(1)}% commission).`;
                    })()}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm Resolution
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

