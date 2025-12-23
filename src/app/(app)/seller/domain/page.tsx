"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Globe, CheckCircle, XCircle, AlertCircle, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { useStoreByUserId } from "@/lib/firebase/firestore/stores";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useToast } from "@/hooks/use-toast";
import { checkSubdomainAvailability, updateStoreSubdomain, getStoreUrl } from "@/lib/subdomain-actions";

export default function DomainPage() {
  const { user } = useUser();
  const { data: store } = useStoreByUserId(user?.uid);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [subdomain, setSubdomain] = useState('');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // Load subdomain from store
  useEffect(() => {
    if (store?.subdomain) {
      setSubdomain(store.subdomain);
      setIsAvailable(true);
    }
  }, [store]);

  const handleCheckAvailability = async () => {
    if (!subdomain.trim()) {
      setAvailabilityMessage('Please enter a subdomain');
      setIsAvailable(false);
      return;
    }

    setIsCheckingAvailability(true);
    setAvailabilityMessage('');

    try {
      const result = await checkSubdomainAvailability(subdomain);
      setIsAvailable(result.available);
      setAvailabilityMessage(result.message || '');
    } catch (error) {
      setIsAvailable(false);
      setAvailabilityMessage(error instanceof Error ? error.message : 'Failed to check availability');
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleUpdateSubdomain = async () => {
    if (!user?.uid || !subdomain.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a subdomain' });
      return;
    }

    if (!isAvailable) {
      toast({ variant: 'destructive', title: 'Error', description: 'Subdomain is not available' });
      return;
    }

    startTransition(async () => {
      try {
        await updateStoreSubdomain(user.uid, subdomain);
        toast({ title: 'Success', description: 'Subdomain updated successfully!' });
        // Store will refresh via real-time listener
      } catch (error) {
        toast({ 
          variant: 'destructive', 
          title: 'Error', 
          description: error instanceof Error ? error.message : 'Failed to update subdomain' 
        });
      }
    });
  };

  const [storeUrl, setStoreUrl] = useState<string | null>(null);

  useEffect(() => {
    if (store?.subdomain) {
      getStoreUrl(store.subdomain).then(setStoreUrl);
    } else {
      setStoreUrl(null);
    }
  }, [store?.subdomain]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Store Domain</h1>
          <p className="text-muted-foreground">Manage your store's subdomain (auto-generated from store name)</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Domain Setup */}
        <Card>
          <CardHeader>
            <CardTitle>Subdomain Configuration</CardTitle>
            <CardDescription>Your subdomain is automatically generated, but you can customize it</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Your Store URL</Label>
              {storeUrl ? (
                <div className="p-3 bg-muted rounded-md">
                  <code className="text-sm">{storeUrl}</code>
                </div>
              ) : (
                <div className="p-3 bg-muted rounded-md">
                  <code className="text-sm text-muted-foreground">Subdomain will be generated when you complete store setup</code>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Subdomain</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="my-store"
                  value={subdomain}
                  onChange={(e) => {
                    setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    setIsAvailable(null);
                    setAvailabilityMessage('');
                  }}
                  onBlur={handleCheckAvailability}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCheckAvailability}
                  disabled={isCheckingAvailability || !subdomain.trim()}
                >
                  {isCheckingAvailability ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Check'
                  )}
                </Button>
              </div>
              {availabilityMessage && (
                <p className={`text-xs ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                  {availabilityMessage}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Your store will be available at: <code>{subdomain || 'your-subdomain'}.ikm.com</code>
              </p>
            </div>

            <Button 
              onClick={handleUpdateSubdomain} 
              className="w-full"
              disabled={isPending || !isAvailable || !subdomain.trim()}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Update Subdomain
                </>
              )}
            </Button>

            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium mb-1">SSL Certificate</div>
                  <div className="text-muted-foreground">
                    SSL certificates are automatically provisioned and renewed for all connected domains.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subdomain Info */}
        <Card>
          <CardHeader>
            <CardTitle>Subdomain Information</CardTitle>
            <CardDescription>Your store's subdomain is automatically generated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium mb-1">Automatic Subdomain</div>
                    <div className="text-muted-foreground">
                      Your subdomain is automatically generated from your store name when you create your store. 
                      If the name is taken, we'll add a unique suffix to ensure it's available.
                    </div>
                  </div>
                </div>
              </div>

              {store?.subdomain && (
                <div className="p-4 border rounded-lg">
                  <div className="text-sm font-medium mb-2">Current Subdomain</div>
                  <code className="text-lg font-mono">{store.subdomain}</code>
                  {storeUrl && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Full URL: {storeUrl}
                    </div>
                  )}
                </div>
              )}

              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium mb-2">Subdomain Rules</div>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>3-50 characters long</li>
                  <li>Only lowercase letters, numbers, and hyphens</li>
                  <li>Cannot start or end with a hyphen</li>
                  <li>Reserved names are not allowed</li>
                  <li>Must be unique across all stores</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Domain Status */}
      <Card>
        <CardHeader>
          <CardTitle>Domain Status</CardTitle>
          <CardDescription>Current domain connection status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium">Subdomain Status</div>
                <div className="text-sm text-muted-foreground">
                  {store?.subdomain ? `Active: ${store.subdomain}.ikm.com` : 'Will be generated on store setup'}
                </div>
              </div>
              <Badge variant={store?.subdomain ? 'default' : 'secondary'}>
                {store?.subdomain ? 'Active' : 'Pending'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium">Store URL</div>
                <div className="text-sm text-muted-foreground">
                  {storeUrl || 'Not available yet'}
                </div>
              </div>
              {storeUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(storeUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Visit Store
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

