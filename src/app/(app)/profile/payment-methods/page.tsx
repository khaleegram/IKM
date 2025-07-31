
'use client';

import Link from 'next/link';
import { ArrowLeft, Plus, CreditCard, Banknote, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// Mock data, in a real app this would come from an API
const userRole = 'Seller'; // Can be 'Buyer', 'Seller', or 'Rider'

const savedCards = [
  { id: 'card1', brand: 'Visa', last4: '4242', expiry: '12/25' },
  { id: 'card2', brand: 'Mastercard', last4: '5555', expiry: '08/26' },
];

const payoutAccount = {
  bankName: 'GTBank',
  accountNumber: '**** **** 6789',
};

const VisaLogo = () => <svg width="40" height="25" viewBox="0 0 40 25" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M29.82.02H25.35a.86.86 0 00-.83.6l-4.73 11.22-1.7-3.8A1.23 1.23 0 0017.16 7.4l-4.25-7.3a.56.56 0 00-.5-.3H8.3a.56.56 0 00-.5.3L0 23.99c0 .3.2.5.5.5h4.6c.3 0 .4-.19.5-.4l2.4-5.9 1.12 2.65a.86.86 0 00.84.6h4.56c.3 0 .4-.2.5-.4l6.38-14.88 2.5 6.32a.5.5 0 00.5.4h4.08c.3 0 .5-.2.5-.4l2.2-7.07a.5.5 0 00-.48-.65zm-11.26 9.3L16.2 3.4l2.5 13.6-2.5-7.7zM6.54 20.39L9.7 12l2.3 5.4-5.45 2.99zM.88 23.59l6.16-14.4 3.3 5.8-6.18 9-3.28-.4zM26.4 7.4l-1.3-3.2 2.7-4.2h3.12l-4.52 7.4z" fill="#1A1F71"/></svg>;
const MastercardLogo = () => <svg width="40" height="25" viewBox="0 0 40 25" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12.5" cy="12.5" r="12.5" fill="#EB001B"/><circle cx="27.5" cy="12.5" r="12.5" fill="#F79E1B"/><path d="M20 20.14a12.5 12.5 0 010-15.28 12.5 12.5 0 000 15.28z" fill="#FF5F00"/></svg>;

const cardLogos: { [key: string]: React.ReactNode } = {
  Visa: <VisaLogo />,
  Mastercard: <MastercardLogo />,
};


export default function PaymentMethodsPage() {
    const { toast } = useToast();

    const handleAction = (message: string) => {
        toast({
            title: `✅ ${message}`,
            duration: 5000,
        });
    };

    return (
        <div className="flex flex-col h-full bg-muted/40">
            <header className="p-4 sm:p-6 bg-background border-b flex items-center gap-4">
                <Link href="/profile">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-xl font-bold font-headline">Payment & Payouts</h1>
                </div>
            </header>
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="max-w-2xl mx-auto space-y-8">
                    {/* Buyer's View: Saved Cards */}
                    {userRole === 'Buyer' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline text-lg">My Payment Cards</CardTitle>
                                <CardDescription>Manage the credit and debit cards linked to your account.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-4">
                                    {savedCards.map(card => (
                                        <li key={card.id} className="flex items-center gap-4 p-4 border rounded-md">
                                            <div className="flex-shrink-0 w-12">
                                                {cardLogos[card.brand]}
                                            </div>
                                            <div className="flex-grow">
                                                <p className="font-semibold">{card.brand} ending in {card.last4}</p>
                                                <p className="text-sm text-muted-foreground">Expires {card.expiry}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                                                <Trash2 className="h-5 w-5"/>
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                             <CardContent>
                                <Button className="w-full">
                                    <Plus className="mr-2" /> Add New Card
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Seller/Rider View: Payout Method */}
                    {(userRole === 'Seller' || userRole === 'Rider') && (
                         <Card>
                            <CardHeader>
                                <CardTitle className="font-headline text-lg">My Payout Account</CardTitle>
                                <CardDescription>This is the bank account where your earnings will be sent.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 p-4 border rounded-md bg-muted/40">
                                    <div className="flex items-center justify-center h-10 w-10 bg-primary/10 rounded-full">
                                        <Banknote className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-semibold">{payoutAccount.bankName}</p>
                                        <p className="text-sm text-muted-foreground">Account: {payoutAccount.accountNumber}</p>
                                    </div>
                                </div>
                            </CardContent>
                             <CardContent>
                                <Button className="w-full" variant="outline">
                                    <Edit className="mr-2" /> Change Payout Account
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
