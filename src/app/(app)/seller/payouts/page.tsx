
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// In a real app, this would come from an API
const NIGERIAN_BANKS = [
    { code: "044", name: "Access Bank" },
    { code: "023", name: "Citibank Nigeria" },
    { code: "063", name: "Access Bank (Diamond)" },
    { code: "050", name: "Ecobank Nigeria" },
    { code: "070", name: "Fidelity Bank" },
    { code: "011", name: "First Bank of Nigeria" },
    { code: "214", name: "First City Monument Bank" },
    { code: "058", name: "Guaranty Trust Bank" },
    { code: "030", name: "Heritage Bank" },
    { code: "301", name: "Jaiz Bank" },
    { code: "082", name: "Keystone Bank" },
    { code: "014", name: "Mainstreet Bank" },
    { code: "076", name: "Polaris Bank" },
    { code: "101", name: "Providus Bank" },
    { code: "221", "name": "Stanbic IBTC Bank" },
    { code: "068", name: "Standard Chartered Bank" },
    { code: "232", name: "Sterling Bank" },
    { code: "100", name: "Suntrust Bank" },
    { code: "032", name: "Union Bank of Nigeria" },
    { code: "033", name: "United Bank For Africa" },
    { code: "215", name: "Unity Bank" },
    { code: "035", name: "Wema Bank" },
    { code: "057", name: "Zenith Bank" },
    { code: "125", name: "OPay" },
    { code: "126", name: "Kuda Bank" },
    { code: "127", name: "Palmpay" }
]


export default function SellerPayoutsPage() {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    // In a real app, you'd fetch and set this from the user's profile
    const [bankCode, setBankCode] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    
    const handlePayoutSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Placeholder for real bank verification and saving
        startTransition(() => {
            // Simulate API call
            setTimeout(() => {
                if (!bankCode || !accountNumber) {
                     toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a bank and enter an account number.' });
                     return;
                }
                // Simulate fetching account name
                setAccountName("Jane Doe"); // Placeholder
                toast({
                    title: "Payout Information Saved!",
                    description: "Your payout details have been successfully updated.",
                });
            }, 1000);
        });
    }

    return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 bg-background border-b">
        <div>
          <h1 className="text-2xl font-bold font-headline">Payout Settings</h1>
          <p className="text-muted-foreground">Manage how you receive payments for your sales.</p>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <form onSubmit={handlePayoutSubmit}>
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Bank Account Details</CardTitle>
                    <CardDescription>This is the bank account where your earnings will be sent.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="bankName">Bank Name</Label>
                         <Select onValueChange={setBankCode} value={bankCode}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select your bank" />
                            </SelectTrigger>
                            <SelectContent>
                                {NIGERIAN_BANKS.map(bank => (
                                    <SelectItem key={bank.code} value={bank.code}>{bank.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input id="accountNumber" type="text" pattern="\d{10}" title="Account number should be 10 digits" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} maxLength={10} />
                    </div>
                     {accountName && (
                        <div>
                            <Label>Account Name</Label>
                            <p className="font-semibold p-2 bg-muted rounded-md">{accountName}</p>
                        </div>
                     )}
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isPending}>{isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : 'Save & Verify'}</Button>
                </CardFooter>
            </Card>
        </form>
      </main>
    </div>
    )
}
