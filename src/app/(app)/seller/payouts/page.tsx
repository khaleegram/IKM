'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cloudFunctions } from "@/lib/cloud-functions";
import { calculateSellerEarnings } from "@/lib/earnings-actions";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useSellerPayouts, useSellerTransactions } from "@/lib/firebase/firestore/earnings";
import { useUserProfile } from "@/lib/firebase/firestore/users";
import { savePayoutDetails } from "@/lib/payout-actions";
import { cancelPayoutRequest, requestPayout } from "@/lib/payout-request-actions";
import { getMinimumPayoutAmount, getPayoutProcessingDays } from "@/lib/platform-settings-actions";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { AlertCircle, ArrowDownCircle, Banknote, Check, CheckCircle, ChevronsUpDown, DollarSign, History, Loader2, Search, TrendingUp, Wallet, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";


export default function SellerPayoutsPage() {
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const { data: userProfile, isLoading: isLoadingProfile } = useUserProfile(authUser?.uid);
    const { data: payouts, isLoading: isLoadingPayouts } = useSellerPayouts(authUser?.uid);
    const { data: transactions, isLoading: isLoadingTransactions } = useSellerTransactions(authUser?.uid, 20);

    const [isFinding, startFindTransition] = useTransition();
    const [isSaving, startSaveTransition] = useTransition();
    const [isRequesting, startRequestTransition] = useTransition();
    const [isCalculating, startCalculateTransition] = useTransition();
    const [isCancelling, startCancelTransition] = useTransition();

    const [accountNumber, setAccountNumber] = useState('');
    const [banksList, setBanksList] = useState<Array<{ code: string; name: string; id: number }>>([]);
    const [selectedBankCode, setSelectedBankCode] = useState<string>('');
    const [resolvedAccount, setResolvedAccount] = useState<{ account_name: string; account_number: string; bank_id: number } | null>(null);
    const [isLoadingBanks, setIsLoadingBanks] = useState(false);
    const [bankSearchQuery, setBankSearchQuery] = useState('');
    const [bankPopoverOpen, setBankPopoverOpen] = useState(false);
    const [earnings, setEarnings] = useState<any>(null);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [showPayoutDialog, setShowPayoutDialog] = useState(false);
    const [showTransactions, setShowTransactions] = useState(false);
    const [payoutToCancel, setPayoutToCancel] = useState<string | null>(null);
    const [minimumPayout, setMinimumPayout] = useState(1000); // Default fallback
    const [payoutProcessingDays, setPayoutProcessingDays] = useState(3); // Default fallback

    // Load banks list on mount
    useEffect(() => {
        const loadBanks = async () => {
            setIsLoadingBanks(true);
            try {
                const result = await cloudFunctions.getBanksList();
                if (result.success && result.banks) {
                    // Sort by name for easier selection
                    const sortedBanks = result.banks.sort((a, b) => a.name.localeCompare(b.name));
                    setBanksList(sortedBanks);
                    // Pre-select user's bank if they already have payout details
                    if (userProfile?.payoutDetails?.bankCode) {
                        setSelectedBankCode(userProfile.payoutDetails.bankCode);
                    }
                } else {
                    throw new Error('Failed to load banks');
                }
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error Loading Banks',
                    description: (error as Error).message,
                });
            } finally {
                setIsLoadingBanks(false);
            }
        };
        loadBanks();
    }, [userProfile?.payoutDetails?.bankCode, toast]);

    // Reset resolved account when account number or bank changes
    useEffect(() => {
        setResolvedAccount(null);
    }, [accountNumber, selectedBankCode]);

    // Calculate earnings and fetch minimum payout
    useEffect(() => {
        if (!authUser?.uid) return;
        
        startCalculateTransition(async () => {
            try {
                const result = await calculateSellerEarnings(authUser.uid);
                setEarnings(result);
                // Also fetch minimum payout amount and processing days
                const minPayout = await getMinimumPayoutAmount();
                const processingDays = await getPayoutProcessingDays();
                setMinimumPayout(minPayout);
                setPayoutProcessingDays(processingDays);
            } catch (error) {
                console.error('Error calculating earnings:', error);
            }
        });
    }, [authUser?.uid, payouts]);

    const handleRequestPayout = () => {
        if (!earnings || !userProfile?.payoutDetails) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please set up your bank account first.' });
            return;
        }

        const amount = parseFloat(payoutAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid amount.' });
            return;
        }

        if (amount < minimumPayout) {
            toast({ variant: 'destructive', title: 'Minimum Amount', description: `Minimum payout is ₦${minimumPayout.toLocaleString()}` });
            return;
        }

        if (amount > earnings.availableBalance) {
            toast({ variant: 'destructive', title: 'Insufficient Balance', description: `Available balance: ₦${earnings.availableBalance.toLocaleString()}` });
            return;
        }

        startRequestTransition(async () => {
            if (!authUser?.uid) {
                toast({ variant: 'destructive', title: 'Error', description: 'Please log in to request a payout.' });
                return;
            }
            try {
                await requestPayout(authUser.uid, { amount });
                toast({
                    title: "Payout Requested!",
                    description: `Your payout request has been submitted and will be automatically processed within ${payoutProcessingDays} business day${payoutProcessingDays !== 1 ? 's' : ''}.`,
                });
                setShowPayoutDialog(false);
                setPayoutAmount('');
            } catch (error) {
                toast({ variant: 'destructive', title: 'Request Failed', description: (error as Error).message });
            }
        });
    };

    const handleCancelPayout = async (payoutId: string) => {
        if (!authUser?.uid) return;
        
        startCancelTransition(async () => {
            try {
                await cancelPayoutRequest(payoutId, authUser.uid);
                toast({
                    title: "Payout Cancelled",
                    description: "Your payout request has been cancelled.",
                });
                setPayoutToCancel(null);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Cancellation Failed', description: (error as Error).message });
            }
        });
    };

    const pendingPayout = payouts?.find(p => p.status === 'pending');

    const handleVerifyAccount = () => {
        if (!selectedBankCode) {
            toast({ variant: 'destructive', title: 'Bank Required', description: 'Please select a bank first.' });
            return;
        }

        if (accountNumber.length !== 10) {
            toast({ variant: 'destructive', title: 'Invalid Account Number', description: 'Please enter a valid 10-digit NUBAN account number.' });
            return;
        }

        // Validate it's all digits
        if (!/^\d{10}$/.test(accountNumber)) {
            toast({ variant: 'destructive', title: 'Invalid Account Number', description: 'Account number must contain only digits.' });
            return;
        }

        startFindTransition(async () => {
            try {
                const result = await cloudFunctions.resolveAccountNumber({
                    accountNumber,
                    bankCode: selectedBankCode,
                });
                if (result.success) {
                    setResolvedAccount({
                        account_name: result.account_name,
                        account_number: result.account_number,
                        bank_id: result.bank_id,
                    });
                    toast({
                        title: "Account Verified",
                        description: `Account name: ${result.account_name}`,
                    });
                } else {
                    throw new Error('Account verification failed');
                }
            } catch (error) {
                const errorMessage = (error as Error).message;
                toast({ 
                    variant: 'destructive', 
                    title: 'Verification Failed', 
                    description: errorMessage.includes('Paystack secret key') 
                        ? 'Payment service is not configured. Please contact support.'
                        : errorMessage
                });
                setResolvedAccount(null);
            }
        });
    }

    const handleSaveDetails = () => {
        if (!resolvedAccount || !selectedBankCode) {
             toast({ variant: 'destructive', title: 'Cannot Save', description: 'Please verify your account first.' });
            return;
        }

        const selectedBank = banksList.find(b => b.code === selectedBankCode);
        if (!selectedBank) {
            toast({ variant: 'destructive', title: 'Invalid Bank', description: 'Selected bank not found.' });
            return;
        }

        startSaveTransition(async () => {
            try {
                const result = await savePayoutDetails({
                    bankName: selectedBank.name,
                    bankCode: selectedBankCode,
                    accountNumber: resolvedAccount.account_number,
                    accountName: resolvedAccount.account_name,
                });
                if (result.success) {
                    toast({
                        title: "Payout Information Saved!",
                        description: "Your payout details have been successfully updated.",
                    });
                    // Clear form
                    setAccountNumber('');
                    setSelectedBankCode('');
                    setResolvedAccount(null);
                    // Note: useUserProfile should automatically refetch, but if not, the page will update on next render
                } else {
                    throw new Error('Failed to save payout details');
                }
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
                    <Label htmlFor="bankSelect">Select Bank</Label>
                    <Popover open={bankPopoverOpen} onOpenChange={setBankPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={bankPopoverOpen}
                                className="w-full justify-between"
                                disabled={isLoadingBanks || isFinding}
                                id="bankSelect"
                            >
                                {selectedBankCode
                                    ? banksList.find(bank => bank.code === selectedBankCode)?.name || "Select bank..."
                                    : isLoadingBanks ? "Loading banks..." : "Select your bank"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                            <div className="flex items-center border-b px-3">
                                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                <Input
                                    placeholder="Search banks..."
                                    value={bankSearchQuery}
                                    onChange={(e) => setBankSearchQuery(e.target.value)}
                                    className="border-0 focus-visible:ring-0"
                                />
                            </div>
                            <div className="max-h-[300px] overflow-auto p-1">
                                {banksList
                                    .filter(bank => 
                                        bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase())
                                    )
                                    .map((bank) => (
                                        <button
                                            key={`${bank.code}-${bank.id}`}
                                            onClick={() => {
                                                setSelectedBankCode(bank.code);
                                                setBankPopoverOpen(false);
                                                setBankSearchQuery('');
                                            }}
                                            className={cn(
                                                "w-full flex items-center justify-between rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent",
                                                selectedBankCode === bank.code && "bg-accent"
                                            )}
                                        >
                                            {bank.name}
                                            {selectedBankCode === bank.code && (
                                                <Check className="h-4 w-4 text-primary" />
                                            )}
                                        </button>
                                    ))}
                                {banksList.filter(bank => 
                                    bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase())
                                ).length === 0 && (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                        No banks found.
                                    </div>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

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
                            disabled={isFinding || !selectedBankCode || !!resolvedAccount}
                            placeholder="Enter 10-digit account number"
                        />
                        <Button 
                            onClick={handleVerifyAccount} 
                            disabled={isFinding || accountNumber.length !== 10 || !selectedBankCode}
                        >
                            {isFinding ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : 'Verify Account'}
                        </Button>
                    </div>
                </div>
                
                {resolvedAccount && (
                    <div className="p-4 bg-support/10 border border-support/20 rounded-lg">
                        <Label>Verified Account</Label>
                        <p className="font-semibold text-lg flex items-center gap-2">
                            <CheckCircle className="text-support"/> {resolvedAccount.account_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {resolvedAccount.account_number} - {banksList.find(b => b.code === selectedBankCode)?.name}
                        </p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button onClick={handleSaveDetails} disabled={isSaving || !resolvedAccount}>
                    {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Details'}
                </Button>
            </CardFooter>
        </Card>
    );

    return (
        <div className="flex flex-col h-full">
            <header className="p-3 sm:p-4 md:p-6 bg-background border-b">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold font-headline">Earnings & Payouts</h1>
                      <p className="text-sm sm:text-base text-muted-foreground">Manage your earnings and request payouts.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowTransactions(!showTransactions)} size="sm" className="w-full sm:w-auto">
                            <History className="mr-2 h-4 w-4" />
                            Transactions
                        </Button>
                        {userProfile?.payoutDetails && earnings && earnings.availableBalance >= minimumPayout && !pendingPayout && (
                            <Button onClick={() => setShowPayoutDialog(true)} size="sm" className="w-full sm:w-auto">
                                <ArrowDownCircle className="mr-2 h-4 w-4" />
                                Request Payout
                            </Button>
                        )}
                    </div>
                </div>
            </header>
            <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
                {/* Earnings Dashboard */}
                {earnings && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs sm:text-sm font-medium">Available Balance</CardTitle>
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="p-3 sm:p-6">
                                <div className="text-xl sm:text-2xl font-bold">₦{earnings.availableBalance.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground mt-1">Ready to withdraw</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs sm:text-sm font-medium">Total Earnings</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="p-3 sm:p-6">
                                <div className="text-xl sm:text-2xl font-bold">₦{earnings.totalEarnings.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground mt-1">All time</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs sm:text-sm font-medium">Pending Payouts</CardTitle>
                                <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="p-3 sm:p-6">
                                <div className="text-xl sm:text-2xl font-bold">₦{earnings.pendingPayouts.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground mt-1">In processing</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs sm:text-sm font-medium">Total Payouts</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="p-3 sm:p-6">
                                <div className="text-xl sm:text-2xl font-bold">₦{earnings.totalPayouts.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground mt-1">Withdrawn</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Pending Payout Alert */}
                {pendingPayout && (
                    <Card className="border-primary/50 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <AlertCircle className="h-5 w-5 text-primary" />
                                Pending Payout Request
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-lg">₦{pendingPayout.amount.toLocaleString()}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Requested on {pendingPayout.requestedAt ? format(pendingPayout.requestedAt.toDate(), 'PPP') : 'N/A'}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="secondary">Pending</Badge>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setPayoutToCancel(pendingPayout.id!)}
                                        disabled={isCancelling}
                                    >
                                        <X className="h-4 w-4 mr-1" />
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Bank Account Setup */}
                {isLoadingProfile ? (
                     <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    </div>
                ) : userProfile?.payoutDetails ? (
                    renderVerifiedState()
                ) : (
                    renderSetupState()
                )}

                {/* Payout History */}
                {payouts && payouts.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg sm:text-xl">Payout History</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Account</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payouts.slice(0, 10).map((payout) => (
                                            <TableRow key={payout.id}>
                                                <TableCell className="text-sm">
                                                    {payout.createdAt ? format(payout.createdAt.toDate(), 'MMM dd, yyyy') : 'N/A'}
                                                </TableCell>
                                                <TableCell className="font-semibold">₦{payout.amount.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Badge 
                                                        variant={
                                                            payout.status === 'completed' ? 'default' :
                                                            payout.status === 'pending' ? 'secondary' :
                                                            payout.status === 'failed' ? 'destructive' : 'outline'
                                                        }
                                                    >
                                                        {payout.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {payout.accountName} - {payout.bankName}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>

            {/* Request Payout Dialog */}
            <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Payout</DialogTitle>
                        <DialogDescription>
                            Enter the amount you want to withdraw. Minimum: ₦{minimumPayout.toLocaleString()}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="payoutAmount">Amount (₦)</Label>
                            <Input
                                id="payoutAmount"
                                type="number"
                                value={payoutAmount}
                                onChange={(e) => setPayoutAmount(e.target.value)}
                                placeholder={`Min: ₦${minimumPayout.toLocaleString()}`}
                                min={minimumPayout}
                                max={earnings?.availableBalance || 0}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Available: ₦{earnings?.availableBalance.toLocaleString() || '0'}
                            </p>
                        </div>
                        {earnings && parseFloat(payoutAmount) > 0 && (
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">You will receive:</p>
                                <p className="text-2xl font-bold">₦{parseFloat(payoutAmount || '0').toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>Cancel</Button>
                        <Button onClick={handleRequestPayout} disabled={isRequesting || !payoutAmount || parseFloat(payoutAmount) < minimumPayout}>
                            {isRequesting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Request Payout'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Payout Dialog */}
            <Dialog open={!!payoutToCancel} onOpenChange={() => setPayoutToCancel(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Payout Request?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel this payout request? The amount will be returned to your available balance.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPayoutToCancel(null)}>No, Keep It</Button>
                        <Button variant="destructive" onClick={() => payoutToCancel && handleCancelPayout(payoutToCancel)} disabled={isCancelling}>
                            {isCancelling ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelling...</> : 'Yes, Cancel'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Transactions Dialog */}
            <Dialog open={showTransactions} onOpenChange={setShowTransactions}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Transaction History</DialogTitle>
                        <DialogDescription>View all your earnings and payout transactions.</DialogDescription>
                    </DialogHeader>
                    {isLoadingTransactions ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : transactions && transactions.length > 0 ? (
                        <div className="space-y-2">
                            {transactions.map((transaction) => (
                                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium">{transaction.description}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {transaction.createdAt ? format(transaction.createdAt.toDate(), 'MMM dd, yyyy HH:mm') : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${transaction.amount >= 0 ? 'text-support' : 'text-destructive'}`}>
                                            {transaction.amount >= 0 ? '+' : ''}₦{Math.abs(transaction.amount).toLocaleString()}
                                        </p>
                                        <Badge variant={transaction.status === 'completed' ? 'default' : transaction.status === 'pending' ? 'secondary' : 'destructive'} className="text-xs">
                                            {transaction.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No transactions yet</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
