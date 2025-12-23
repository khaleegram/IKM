'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Loader2, CheckCircle, X, Search, Filter } from "lucide-react";
import { getAllPayouts, processPayout } from "@/lib/payout-request-actions";
import { useUser } from "@/lib/firebase/auth/use-user";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminPayoutsPage() {
    const { toast } = useToast();
    const { user } = useUser();
    const [isLoading, startLoadingTransition] = useTransition();
    const [isProcessing, startProcessingTransition] = useTransition();
    const [payouts, setPayouts] = useState<any[]>([]);
    const [filteredPayouts, setFilteredPayouts] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed' | 'cancelled'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [payoutToProcess, setPayoutToProcess] = useState<string | null>(null);

    const loadPayouts = async (status?: string) => {
        if (!user?.uid) return;
        
        try {
            const result = await getAllPayouts(status as any);
            setPayouts(result);
            setFilteredPayouts(result);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        }
    };

    // Load payouts on mount and when filter changes
    useEffect(() => {
        if (user?.uid) {
            startLoadingTransition(() => {
                loadPayouts(statusFilter === 'all' ? undefined : statusFilter);
            });
        }
    }, [user?.uid, statusFilter]);

    // Filter payouts
    useEffect(() => {
        let filtered = payouts;
        
        if (statusFilter !== 'all') {
            filtered = filtered.filter(p => p.status === statusFilter);
        }
        
        if (searchTerm) {
            filtered = filtered.filter(p => 
                p.accountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.accountNumber?.includes(searchTerm) ||
                p.sellerId?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        setFilteredPayouts(filtered);
    }, [payouts, statusFilter, searchTerm]);

    const handleProcessPayout = async (payoutId: string) => {
        if (!user?.uid) return;
        
        startProcessingTransition(async () => {
            try {
                await processPayout(payoutId, user.uid);
                toast({
                    title: "Payout Processed!",
                    description: "The payout has been successfully processed and transferred.",
                });
                setPayoutToProcess(null);
                loadPayouts(statusFilter === 'all' ? undefined : statusFilter);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Processing Failed', description: (error as Error).message });
            }
        });
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'completed': return 'default';
            case 'pending': return 'secondary';
            case 'failed': return 'destructive';
            case 'cancelled': return 'outline';
            default: return 'outline';
        }
    };

    const pendingPayouts = payouts.filter(p => p.status === 'pending');
    const totalPending = pendingPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalCompleted = payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0);

    return (
        <div className="flex flex-col h-full">
            <header className="p-3 sm:p-4 md:p-6 bg-background border-b">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold font-headline">Payout Management</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">Process and manage seller payouts.</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-4">
                    <Card>
                        <CardContent className="p-3 sm:p-4">
                            <div className="text-xs sm:text-sm text-muted-foreground">Pending Payouts</div>
                            <div className="text-lg sm:text-2xl font-bold mt-1">{pendingPayouts.length}</div>
                            <div className="text-xs text-muted-foreground mt-1">₦{totalPending.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-3 sm:p-4">
                            <div className="text-xs sm:text-sm text-muted-foreground">Total Completed</div>
                            <div className="text-lg sm:text-2xl font-bold mt-1">{payouts.filter(p => p.status === 'completed').length}</div>
                            <div className="text-xs text-muted-foreground mt-1">₦{totalCompleted.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-3 sm:p-4">
                            <div className="text-xs sm:text-sm text-muted-foreground">Total Payouts</div>
                            <div className="text-lg sm:text-2xl font-bold mt-1">{payouts.length}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by account name, number, or seller ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={(value: any) => {
                        setStatusFilter(value);
                        loadPayouts(value === 'all' ? undefined : value);
                    }}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </header>

            <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : filteredPayouts.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <p className="text-muted-foreground">No payouts found</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Seller ID</TableHead>
                                            <TableHead>Account</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredPayouts.map((payout) => (
                                            <TableRow key={payout.id}>
                                                <TableCell className="text-sm">
                                                    {payout.createdAt ? format(payout.createdAt.toDate(), 'MMM dd, yyyy') : 'N/A'}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{payout.sellerId?.slice(0, 8)}...</TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium text-sm">{payout.accountName}</p>
                                                        <p className="text-xs text-muted-foreground">{payout.bankName}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">₦{payout.amount.toLocaleString()}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={getStatusVariant(payout.status) as any}>
                                                        {payout.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {payout.status === 'pending' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => setPayoutToProcess(payout.id)}
                                                            disabled={isProcessing}
                                                        >
                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                            Process
                                                        </Button>
                                                    )}
                                                    {payout.status === 'failed' && payout.failureReason && (
                                                        <p className="text-xs text-destructive">{payout.failureReason}</p>
                                                    )}
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

            {/* Process Payout Dialog */}
            <Dialog open={!!payoutToProcess} onOpenChange={() => setPayoutToProcess(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Process Payout</DialogTitle>
                        <DialogDescription>
                            This will initiate a Paystack transfer to the seller's bank account. Are you sure you want to proceed?
                        </DialogDescription>
                    </DialogHeader>
                    {payoutToProcess && (
                        <div className="py-4">
                            {(() => {
                                const payout = payouts.find(p => p.id === payoutToProcess);
                                return payout ? (
                                    <div className="space-y-2">
                                        <p><strong>Amount:</strong> ₦{payout.amount.toLocaleString()}</p>
                                        <p><strong>Account:</strong> {payout.accountName}</p>
                                        <p><strong>Bank:</strong> {payout.bankName}</p>
                                        <p><strong>Account Number:</strong> {payout.accountNumber}</p>
                                    </div>
                                ) : null;
                            })()}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPayoutToProcess(null)}>Cancel</Button>
                        <Button onClick={() => payoutToProcess && handleProcessPayout(payoutToProcess)} disabled={isProcessing}>
                            {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Confirm & Process'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

