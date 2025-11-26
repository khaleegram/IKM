
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Loader2, CheckCircle, AlertCircle, Banknote } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getBanksForAccountNumber, savePayoutDetails } from "@/lib/payout-actions";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useUserProfile } from "@/lib/firebase/firestore/users";

interface ResolvedBank {
    bank_id: number;
    bank_name: string;
    account_name: string;
    account_number: string;
}

export default function SellerPayoutsPage() {
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const { data: userProfile, isLoading: isLoadingProfile } = useUserProfile(authUser?.uid);

    const [isFinding, startFindTransition] = useTransition();
    const [isSaving, startSaveTransition] = useTransition();

    const [accountNumber, setAccountNumber] = useState('');
    const [resolvedBanks, setResolvedBanks] = useState<ResolvedBank[]>([]);
    const [selectedBank, setSelectedBank] = useState<ResolvedBank | null>(null);

    // Reset state when account number changes
    useEffect(() => {
        setResolvedBanks([]);
        setSelectedBank(null);
    }, [accountNumber]);

    const handleFindBanks = () => {
        if (accountNumber.length !== 10) {
            toast({ variant: 'destructive', title: 'Invalid Account Number', description: 'Please enter a valid 10-digit NUBAN account number.' });
            return;
        }

        startFindTransition(async () => {
            try {
                const result = await getBanksForAccountNumber(accountNumber);
                if (result.length === 0) {
                    toast({ variant: 'destructive', title: 'No Banks Found', description: 'We could not find any bank associated with this account number. Please double-check it.' });
                }
                setResolvedBanks(result);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
            }
        });
    }

    const handleSaveDetails = () => {
        if (!selectedBank) {
             toast({ variant: 'destructive', title: 'Cannot Save', description: 'Please select a bank account first.' });
            return;
        }
        startSaveTransition(async () => {
            try {
                await savePayoutDetails({
                     bankCode: selectedBank.bank_id.toString(),
                     accountNumber: selectedBank.account_number,
                     accountName: selectedBank.account_name,
                     bankName: selectedBank.bank_name
                });
                toast({
                    title: "Payout Information Saved!",
                    description: "Your payout details have been successfully updated.",
                });
                // The useUserProfile hook will automatically refetch the data
            } catch (error) {
                toast({ variant: 'destructive', title: 'Save Failed', description: (error as Error).message });
            }
        });
    }

    const renderVerifiedState = () => (
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
                        <p className="font-bold text-lg">{userProfile?.payoutDetails?.accountName}</p>
                        <p className="text-muted-foreground">{userProfile?.payoutDetails?.accountNumber} - {userProfile?.payoutDetails?.bankName}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const renderSetupState = () => (
         <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>Bank Account Details</CardTitle>
                <CardDescription>This is the bank account where your earnings will be sent.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <div className="flex gap-2">
                        <Input 
                            id="accountNumber" 
                            type="text" 
                            pattern="\\d{10}" 
                            title="Account number should be 10 digits" 
                            value={accountNumber} 
                            onChange={(e) => setAccountNumber(e.target.value)} 
                            maxLength={10} 
                            disabled={isFinding || resolvedBanks.length > 0}
                        />
                         <Button onClick={handleFindBanks} disabled={isFinding || accountNumber.length !== 10}>
                            {isFinding ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finding...</> : 'Find Banks'}
                        </Button>
                    </div>
                </div>

                {resolvedBanks.length > 0 && (
                    <div>
                        <Label>Select Your Bank</Label>
                        <RadioGroup 
                            onValueChange={(value) => setSelectedBank(JSON.parse(value))}
                            className="mt-2 space-y-2"
                        >
                            {resolvedBanks.map(bank => (
                                <Label key={bank.bank_id} className="flex items-center gap-4 p-4 border rounded-lg has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer">
                                    <RadioGroupItem value={JSON.stringify(bank)} id={bank.bank_id.toString()} />
                                    <div>
                                        <p className="font-semibold">{bank.bank_name}</p>
                                        <p className="text-sm text-muted-foreground">{bank.account_name}</p>
                                    </div>
                                </Label>
                            ))}
                        </RadioGroup>
                    </div>
                )}
                
                 {selectedBank && (
                    <div className="p-4 bg-support/10 border border-support/20 rounded-lg">
                        <Label>Verified Account</Label>
                        <p className="font-semibold text-lg flex items-center gap-2"> <CheckCircle className="text-support"/> {selectedBank.account_name}</p>
                         <p className="text-sm text-muted-foreground">{selectedBank.account_number} - {selectedBank.bank_name}</p>
                    </div>
                 )}
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button onClick={handleSaveDetails} disabled={isSaving || !selectedBank}>
                    {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Details'}
                </Button>
            </CardFooter>
        </Card>
    );

    return (
        <div className="flex flex-col h-full">
            <header className="p-4 sm:p-6 bg-background border-b">
                <div>
                  <h1 className="text-2xl font-bold font-headline">Payout Settings</h1>
                  <p className="text-muted-foreground">Manage how you receive payments for your sales.</p>
                </div>
            </header>
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                {isLoadingProfile ? (
                     <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    </div>
                ) : userProfile?.payoutDetails ? (
                    renderVerifiedState()
                ) : (
                    renderSetupState()
                )}
            </main>
        </div>
    )
}
