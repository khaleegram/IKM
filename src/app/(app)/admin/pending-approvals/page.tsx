
'use client';

import Link from 'next/link';
import { ArrowLeft, Check, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

const pendingSellers = [
  { id: 's1', name: 'Amina\'s Creations', date: '30-Jul-2025', avatar: 'https://placehold.co/100x100.png' },
  { id: 's2', name: 'KicksRepublic', date: '28-Jul-2025', avatar: 'https://placehold.co/100x100.png' },
];

const pendingRiders = [
  { id: 'r1', name: 'David Okon', date: '29-Jul-2025', avatar: 'https://placehold.co/100x100.png' },
];

export default function PendingApprovalsPage() {
  const { toast } = useToast();

  const handleAction = (name: string, action: 'Approved' | 'Declined') => {
    toast({
      title: `✅ ${name} ${action}`,
      description: `The applicant has been notified of your decision.`,
      duration: 5000,
    });
  };

  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="p-4 sm:p-6 bg-background border-b flex items-center gap-4">
        <Link href="/admin">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold font-headline">Pending Approvals</h1>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="sellers">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sellers">Sellers ({pendingSellers.length})</TabsTrigger>
              <TabsTrigger value="riders">Riders ({pendingRiders.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="sellers" className="mt-6">
              <div className="space-y-4">
                {pendingSellers.map((seller) => (
                  <Card key={seller.id}>
                    <CardHeader className="flex flex-row items-center gap-4 p-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={seller.avatar} alt={seller.name} data-ai-hint="logo business" />
                        <AvatarFallback>{seller.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg font-headline">{seller.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">Applied: {seller.date}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <Button variant="outline" className="w-full sm:w-auto">
                        <FileText className="mr-2 h-4 w-4" />
                        View Documents
                      </Button>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex gap-3">
                      <Button variant="destructive" className="flex-1" onClick={() => handleAction(seller.name, 'Declined')}>
                        <X className="mr-2 h-4 w-4" />
                        Decline
                      </Button>
                      <Button className="flex-1 bg-support text-support-foreground hover:bg-support/90" onClick={() => handleAction(seller.name, 'Approved')}>
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="riders" className="mt-6">
               <div className="space-y-4">
                {pendingRiders.map((rider) => (
                  <Card key={rider.id}>
                    <CardHeader className="flex flex-row items-center gap-4 p-4">
                       <Avatar className="h-12 w-12">
                        <AvatarImage src={rider.avatar} alt={rider.name} data-ai-hint="person portrait" />
                        <AvatarFallback>{rider.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg font-headline">{rider.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">Applied: {rider.date}</p>
                      </div>
                    </CardHeader>
                     <CardContent className="p-4 pt-0">
                      <Button variant="outline" className="w-full sm:w-auto">
                        <FileText className="mr-2 h-4 w-4" />
                        View Documents
                      </Button>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex gap-3">
                       <Button variant="destructive" className="flex-1" onClick={() => handleAction(rider.name, 'Declined')}>
                        <X className="mr-2 h-4 w-4" />
                        Decline
                      </Button>
                      <Button className="flex-1 bg-support text-support-foreground hover:bg-support/90" onClick={() => handleAction(rider.name, 'Approved')}>
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
