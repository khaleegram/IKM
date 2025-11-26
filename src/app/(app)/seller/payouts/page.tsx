
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Loader2, CheckCircle, AlertCircle, Banknote } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { verifyBankAccount, savePayoutDetails } from "@/lib/payout-actions";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useFirebase } from "@/firebase";
import { useUserProfile } from "@/lib/firebase/firestore/users";


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
];


export default function SellerPayoutsPage() {
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const { firestore } = useFirebase();
    const { data: userProfile, isLoading: isLoadingProfile } = useUserProfile(authUser?.uid, firestore);

    const [isVerifying, startVerifyTransition] = useTransition();
    const [isSaving, startSaveTransition] = useTransition();

    const [bankCode, setBankCode] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [bankName, setBankName] = useState('');

    useEffect(() => {
        if (userProfile?.payoutDetails) {
            const { bankCode, accountNumber, accountName, bankName } = userProfile.payoutDetails;
            setBankCode(bankCode);
            setAccountNumber(accountNumber);
            setAccountName(accountName);
            setBankName(bankName);
        }
    }, [userProfile]);
    
    const handleVerify = () => {
        if (!bankCode || !accountNumber) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a bank and enter an account number.' });
            return;
        }

        startVerifyTransition(async () => {
            try {
                const result = await verifyBankAccount({ accountNumber, bankCode });
                setAccountName(result.accountName);
                const selectedBank = NIGERIAN_BANKS.find(b => b.code === bankCode);
                if (selectedBank) setBankName(selectedBank.name);
                toast({
                    title: "Account Verified!",
                    description: `Account Name: ${result.accountName}`,
                });
            } catch (error) {
                setAccountName('');
                toast({ variant: 'destructive', title: 'Verification Failed', description: (error as Error).message });
            }
        });
    }

    const handleSaveDetails = () => {
        if (!accountName || !bankName || !bankCode || !accountNumber) {
             toast({ variant: 'destructive', title: 'Cannot Save', description: 'Please verify account details first.' });
            return;
        }
        startSaveTransition(async () => {
            try {
                await savePayoutDetails({ bankCode, accountNumber, accountName, bankName });
                toast({
                    title: "Payout Information Saved!",
                    description: "Your payout details have been successfully updated.",
                });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Save Failed', description: (error as Error).message });
            }
        });
    }

    if (isLoadingProfile) {
        return (
             <div className="flex items-center justify-center h-full">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        )
    }

    if (userProfile?.payoutDetails) {
        return (
            <div className="flex flex-col h-full">
              <header className="p-4 sm:p-6 bg-background border-b">
                <div>
                  <h1 className="text-2xl font-bold font-headline">Payout Settings</h1>
                  <p className="text-muted-foreground">Manage how you receive payments for your sales.</p>
                </div>
              </header>
              <main className="flex-1 overflow-auto p-4 sm:p-6">
                 <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <CheckCircle className="text-support" /> Verified Account Details
                        </CardTitle>
                        <CardDescription>This is the bank account where your earnings will be sent. To change it, please contact support.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                            <Banknote className="w-8 h-8 text-muted-foreground"/>
                            <div>
                                <p className="font-bold text-lg">{userProfile.payoutDetails.accountName}</p>
                                <p className="text-muted-foreground">{userProfile.payoutDetails.accountNumber} - {userProfile.payoutDetails.bankName}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
              </main>
            </div>
        )
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
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>Bank Account Details</CardTitle>
                <CardDescription>This is the bank account where your earnings will be sent.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                     <Select onValueChange={setBankCode} value={bankCode} disabled={!!accountName}>
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
                    <Input id="accountNumber" type="text" pattern="\\d{10}" title="Account number should be 10 digits" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} maxLength={10} disabled={!!accountName}/>
                </div>
                 {accountName && (
                    <div className="p-4 bg-support/10 border border-support/20 rounded-lg">
                        <Label>Verified Account Name</Label>
                        <p className="font-semibold text-lg flex items-center gap-2"> <CheckCircle className="text-support"/> {accountName}</p>
                    </div>
                 )}
                 {!accountName && (
                    <div className="p-3 bg-accent/20 border border-transparent rounded-lg flex items-center gap-2 text-sm text-accent-foreground">
                        <AlertCircle className="h-5 w-5"/>
                        <p>After verifying your account, you will be able to save your details.</p>
                    </div>
                 )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                {!accountName && (
                    <Button onClick={handleVerify} disabled={isVerifying}>{isVerifying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : 'Verify Account'}</Button>
                )}
                {accountName && (
                    <Button onClick={handleSaveDetails} disabled={isSaving}>{isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Details'}</Button>
                )}
            </CardFooter>
        </Card>
      </main>
    </div>
    )
}
