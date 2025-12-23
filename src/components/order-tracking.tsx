'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, CheckCircle, XCircle, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import type { Order } from "@/lib/firebase/firestore/orders";

interface OrderTrackingProps {
  order: Order;
}

const statusSteps = [
  { key: 'Processing', label: 'Order Placed', icon: Package, description: 'Your order has been received' },
  { key: 'Shipped', label: 'Shipped', icon: Truck, description: 'Your order is on the way' },
  { key: 'Delivered', label: 'Delivered', icon: CheckCircle, description: 'Your order has been delivered' },
  { key: 'Cancelled', label: 'Cancelled', icon: XCircle, description: 'Your order was cancelled' },
];

export function OrderTracking({ order }: OrderTrackingProps) {
  const currentStatusIndex = statusSteps.findIndex(step => step.key === order.status);
  const isCancelled = order.status === 'Cancelled';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Order Tracking</span>
          <Badge variant={isCancelled ? 'destructive' : 'default'}>
            {order.status}
          </Badge>
        </CardTitle>
        <CardDescription>
          Order ID: {order.id?.slice(0, 7)} • Placed on {order.createdAt ? format(order.createdAt.toDate(), 'PPP') : 'N/A'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Timeline */}
        <div className="relative">
          {statusSteps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;
            const isPast = index < currentStatusIndex;

            if (isCancelled && step.key !== 'Cancelled') {
              return null;
            }

            return (
              <div key={step.key} className="relative flex items-start gap-4 pb-8 last:pb-0">
                {/* Timeline Line */}
                {index < statusSteps.length - 1 && !isCancelled && (
                  <div className={`absolute left-5 top-10 w-0.5 h-full ${
                    isPast ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}

                {/* Icon */}
                <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isActive
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                }`}>
                  <StepIcon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`font-semibold ${
                      isCurrent ? 'text-primary' : isPast ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                    {isPast && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  {isCurrent && order.updatedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated: {format(order.updatedAt.toDate(), 'MMM dd, yyyy HH:mm')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Delivery Information */}
        {order.status !== 'Cancelled' && (
          <div className="pt-4 border-t">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Delivery Address</p>
                <p className="text-sm text-muted-foreground">{order.deliveryAddress}</p>
              </div>
            </div>
          </div>
        )}

        {/* Estimated Delivery */}
        {order.status === 'Shipped' && (
          <div className="pt-4 border-t">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Estimated Delivery</p>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const shippedDate = order.updatedAt?.toDate() || new Date();
                    const estimatedDate = new Date(shippedDate);
                    estimatedDate.setDate(estimatedDate.getDate() + 3); // 3 days after shipping
                    return format(estimatedDate, 'PPP');
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

