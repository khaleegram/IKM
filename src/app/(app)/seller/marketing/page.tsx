"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Megaphone, Plus, Mail, Tag, Users, TrendingUp, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useToast } from "@/hooks/use-toast";
import { sendMarketingEmail, getEmailCampaigns } from "@/lib/email-marketing-actions";
import { createDiscountCode, getDiscountCodes } from "@/lib/discount-actions";

function EmailCampaignForm({ sellerId, recipientType, onSent }: { sellerId: string; recipientType: 'all' | 'segment' | 'custom'; onSent?: () => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [segment, setSegment] = useState('VIP');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Seller ID not found' });
      return;
    }

    startTransition(async () => {
      try {
        const result = await sendMarketingEmail({
          sellerId,
          subject,
          message,
          recipientType,
          segment: recipientType === 'segment' ? segment : undefined,
        });
        toast({ title: 'Success', description: result.message });
        setSubject('');
        setMessage('');
        if (onSent) onSent();
        // Reload campaigns
        const campaigns = await getEmailCampaigns(sellerId);
        if (onSent) {
          // Parent will reload
        }
      } catch (error) {
        toast({ 
          variant: 'destructive', 
          title: 'Error', 
          description: error instanceof Error ? error.message : 'Failed to send email' 
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {recipientType === 'segment' && (
        <div className="space-y-2">
          <Label>Customer Segment</Label>
          <select 
            className="w-full p-2 border rounded" 
            value={segment} 
            onChange={(e) => setSegment(e.target.value)}
          >
            <option value="VIP">VIP Customers</option>
            <option value="Regular">Regular Customers</option>
            <option value="New">New Customers</option>
          </select>
        </div>
      )}
      <div className="space-y-2">
        <Label>Subject</Label>
        <Input 
          value={subject} 
          onChange={(e) => setSubject(e.target.value)} 
          placeholder="Email subject"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea 
          value={message} 
          onChange={(e) => setMessage(e.target.value)} 
          placeholder="Email message (HTML supported)"
          rows={6}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </>
        )}
      </Button>
    </form>
  );
}

export default function MarketingPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [discountCode, setDiscountCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [segment, setSegment] = useState('all');
  const [discountCodes, setDiscountCodes] = useState<any[]>([]);
  const [emailCampaigns, setEmailCampaigns] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.uid) return;
      try {
        const [codes, campaigns] = await Promise.all([
          getDiscountCodes(user.uid),
          getEmailCampaigns(user.uid),
        ]);
        setDiscountCodes(codes);
        setEmailCampaigns(campaigns);
      } catch (error) {
        console.error('Failed to load marketing data:', error);
      }
    };
    loadData();
  }, [user?.uid]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Marketing</h1>
          <p className="text-muted-foreground">Manage campaigns, discounts, and customer communications</p>
        </div>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="discounts">Discount Codes</TabsTrigger>
          <TabsTrigger value="email">Email Marketing</TabsTrigger>
          <TabsTrigger value="segments">Customer Segments</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Marketing Campaigns</CardTitle>
                <CardDescription>Create and manage marketing campaigns</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Campaign</DialogTitle>
                    <DialogDescription>Set up a new marketing campaign</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Campaign Name</Label>
                      <Input placeholder="Holiday Sale 2024" />
                    </div>
                    <div className="space-y-2">
                      <Label>Campaign Type</Label>
                      <select className="w-full p-2 border rounded">
                        <option>Discount Code</option>
                        <option>Email Campaign</option>
                        <option>Product Promotion</option>
                      </select>
                    </div>
                    <Button className="w-full">Create Campaign</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.subject}</TableCell>
                      <TableCell>{campaign.recipientType}</TableCell>
                      <TableCell>
                        <Badge variant={campaign.status === 'sent' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{campaign.createdAt?.toDate ? format(campaign.createdAt.toDate(), 'MMM d, yyyy') : '—'}</TableCell>
                      <TableCell>{campaign.sentAt?.toDate ? format(campaign.sentAt.toDate(), 'MMM d, yyyy') : '—'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discounts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Discount Codes</CardTitle>
                <CardDescription>Create discount codes for customers</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Code
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Discount Code</DialogTitle>
                    <DialogDescription>Generate a new discount code</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Code</Label>
                      <Input placeholder="WELCOME10" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <select className="w-full p-2 border rounded" value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Value</Label>
                      <Input 
                        type="number" 
                        placeholder={discountType === 'percentage' ? '10' : '5000'} 
                        value={discountValue} 
                        onChange={(e) => setDiscountValue(e.target.value)} 
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Uses (Optional)</Label>
                      <Input 
                        type="number" 
                        placeholder="100" 
                        value={maxUses} 
                        onChange={(e) => setMaxUses(e.target.value)} 
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={async (e) => {
                        e.preventDefault();
                        if (!user?.uid) {
                          toast({ variant: 'destructive', title: 'Error', description: 'User not authenticated' });
                          return;
                        }
                        if (!discountCode || !discountValue) {
                          toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields' });
                          return;
                        }
                        startTransition(async () => {
                          try {
                            await createDiscountCode({
                              code: discountCode,
                              type: discountType,
                              value: parseFloat(discountValue),
                              maxUses: maxUses ? parseInt(maxUses) : undefined,
                              sellerId: user.uid,
                            });
                            toast({ title: 'Success', description: 'Discount code created successfully!' });
                            setDiscountCode('');
                            setDiscountValue('');
                            setMaxUses('');
                            // Reload discount codes
                            const codes = await getDiscountCodes(user.uid);
                            setDiscountCodes(codes);
                          } catch (error) {
                            toast({ 
                              variant: 'destructive', 
                              title: 'Error', 
                              description: error instanceof Error ? error.message : 'Failed to create discount code' 
                            });
                          }
                        });
                      }}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Code'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discountCodes.map((code) => (
                    <TableRow key={code.id || code.code}>
                      <TableCell className="font-mono font-medium">{code.code}</TableCell>
                      <TableCell>{code.type}</TableCell>
                      <TableCell>
                        {code.type === 'percentage' ? `${code.value}%` : `₦${code.value}`}
                      </TableCell>
                      <TableCell>{code.uses || 0} / {code.maxUses || '∞'}</TableCell>
                      <TableCell>
                        <Badge variant={code.status === 'active' ? 'default' : 'secondary'}>
                          {code.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Marketing</CardTitle>
              <CardDescription>Send targeted emails to customer segments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">New Product Launch</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">Announce new products to all customers</p>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="w-full">
                              <Mail className="mr-2 h-4 w-4" />
                              Create Email
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Create Email Campaign</DialogTitle>
                              <DialogDescription>Send an email to your customers</DialogDescription>
                            </DialogHeader>
                            <EmailCampaignForm sellerId={user?.uid || ''} recipientType="all" onSent={() => {
                              // refresh campaigns after send
                              if (user?.uid) {
                                getEmailCampaigns(user.uid).then(setEmailCampaigns).catch(() => {});
                              }
                            }} />
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Abandoned Cart</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Remind customers about items left in cart</p>
                    <Button className="w-full" variant="outline">
                      <Mail className="mr-2 h-4 w-4" />
                      Configure
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Segments</CardTitle>
              <CardDescription>Target specific customer groups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">VIP Customers</div>
                    <div className="text-sm text-muted-foreground">High-value customers (₦50,000+ spent)</div>
                  </div>
                  <Badge>25 customers</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">New Customers</div>
                    <div className="text-sm text-muted-foreground">First-time buyers (last 30 days)</div>
                  </div>
                  <Badge>42 customers</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Regular Customers</div>
                    <div className="text-sm text-muted-foreground">Repeat buyers (2+ orders)</div>
                  </div>
                  <Badge>68 customers</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

