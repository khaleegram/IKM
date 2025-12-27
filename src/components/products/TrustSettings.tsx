'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, Lock } from 'lucide-react';

interface TrustSettingsProps {
  payOnDelivery?: boolean;
  allowInspection?: boolean;
  useEscrow?: boolean;
  onPayOnDeliveryChange: (enabled: boolean) => void;
  onAllowInspectionChange: (enabled: boolean) => void;
  onUseEscrowChange: (enabled: boolean) => void;
}

export function TrustSettings({
  payOnDelivery,
  allowInspection,
  useEscrow,
  onPayOnDeliveryChange,
  onAllowInspectionChange,
  onUseEscrowChange,
}: TrustSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Trust & Payment Settings</div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Pay on Delivery (POD)</CardTitle>
                <CardDescription className="text-xs">
                  Increases sales by 80% - Buyer pays when item arrives
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={payOnDelivery || false}
              onCheckedChange={onPayOnDeliveryChange}
            />
          </div>
        </CardHeader>
        {payOnDelivery && (
          <CardContent className="pt-0">
            <Badge variant="default" className="bg-green-600">
              ✓ Trusted Seller
            </Badge>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Allow Inspection</CardTitle>
                <CardDescription className="text-xs">
                  Buyer can check item before paying (Crucial for high-end fabrics)
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={allowInspection || false}
              onCheckedChange={onAllowInspectionChange}
            />
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Use Secure Payment (Escrow)</CardTitle>
                <CardDescription className="text-xs">
                  Money is held until buyer confirms receipt
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={useEscrow || false}
              onCheckedChange={onUseEscrowChange}
            />
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}

