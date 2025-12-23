'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Receipt, Search, Printer, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/lib/firebase/auth/use-user";
import { getPaymentHistory, generateReceipt } from "@/lib/payment-history-actions";
import { useState, useEffect, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PaymentHistoryPage() {
    const { user } = useUser();
    const { toast } = useToast();
    const [isLoading, startLoadingTransition] = useTransition();
    const [isGenerating, startGeneratingTransition] = useTransition();
    const [payments, setPayments] = useState<any[]>([]);
    const [filteredPayments, setFilteredPayments] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user?.uid) {
            startLoadingTransition(async () => {
                try {
                    const result = await getPaymentHistory(user.uid);
                    setPayments(result);
                    setFilteredPayments(result);
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
                }
            });
        }
    }, [user?.uid, toast]);

    useEffect(() => {
        let filtered = payments;
        
        if (searchTerm) {
            filtered = filtered.filter(p => 
                p.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.paymentReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        setFilteredPayments(filtered);
    }, [payments, searchTerm]);

    const handleDownloadReceipt = async (orderId: string) => {
        if (!user?.uid) return;
        
        startGeneratingTransition(async () => {
            try {
                const receipt = await generateReceipt(orderId, user.uid);
                
                // Create a simple text receipt
                const receiptText = `
IKM MARKETPLACE - RECEIPT
========================

Order ID: ${receipt.orderId}
Date: ${format(receipt.createdAt.toDate(), 'PPP p')}
Payment Reference: ${receipt.paymentReference || 'N/A'}
Payment Method: ${receipt.paymentMethod}

Customer Information:
${receipt.customerInfo.name}
${receipt.customerInfo.email}
${receipt.customerInfo.phone}

Delivery Address:
${receipt.deliveryAddress}

Items:
${receipt.items.map((item: any) => `- ${item.name} x${item.quantity} - ₦${item.price.toLocaleString()}`).join('\n')}

Total: ₦${receipt.total.toLocaleString()}
Status: ${receipt.status}

Thank you for your purchase!
                `.trim();
                
                // Create and download file
                const blob = new Blob([receiptText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `receipt-${receipt.orderId}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                toast({
                    title: "Receipt Downloaded",
                    description: "Your receipt has been downloaded successfully.",
                });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
            }
        });
    };

    const handlePrintReceipt = async (orderId: string) => {
        if (!user?.uid) return;
        
        startGeneratingTransition(async () => {
            try {
                const receipt = await generateReceipt(orderId, user.uid);
                
                // Create printable HTML receipt
                const printWindow = window.open('', '_blank');
                if (!printWindow) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Please allow popups to print receipts.' });
                    return;
                }
                
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Receipt - ${receipt.orderId}</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
                            h1 { text-align: center; color: #333; }
                            .header { text-align: center; margin-bottom: 30px; }
                            .section { margin-bottom: 20px; }
                            .section-title { font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                            .item { margin: 5px 0; }
                            .total { font-size: 18px; font-weight: bold; margin-top: 20px; text-align: right; }
                            .footer { margin-top: 30px; text-align: center; color: #666; }
                            @media print { body { padding: 0; } }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>IKM MARKETPLACE</h1>
                            <p>RECEIPT</p>
                        </div>
                        
                        <div class="section">
                            <div class="section-title">Order Information</div>
                            <p><strong>Order ID:</strong> ${receipt.orderId}</p>
                            <p><strong>Date:</strong> ${format(receipt.createdAt.toDate(), 'PPP p')}</p>
                            <p><strong>Payment Reference:</strong> ${receipt.paymentReference || 'N/A'}</p>
                            <p><strong>Payment Method:</strong> ${receipt.paymentMethod}</p>
                            <p><strong>Status:</strong> ${receipt.status}</p>
                        </div>
                        
                        <div class="section">
                            <div class="section-title">Customer Information</div>
                            <p>${receipt.customerInfo.name}</p>
                            <p>${receipt.customerInfo.email}</p>
                            <p>${receipt.customerInfo.phone}</p>
                        </div>
                        
                        <div class="section">
                            <div class="section-title">Delivery Address</div>
                            <p>${receipt.deliveryAddress}</p>
                        </div>
                        
                        <div class="section">
                            <div class="section-title">Items</div>
                            ${receipt.items.map((item: any) => `
                                <div class="item">
                                    ${item.name} x${item.quantity} - ₦${item.price.toLocaleString()}
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="total">
                            Total: ₦${receipt.total.toLocaleString()}
                        </div>
                        
                        <div class="footer">
                            <p>Thank you for your purchase!</p>
                        </div>
                    </body>
                    </html>
                `);
                
                printWindow.document.close();
                printWindow.focus();
                
                // Wait for content to load, then print
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 250);
                
                toast({
                    title: "Print Receipt",
                    description: "Receipt opened for printing.",
                });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
            }
        });
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Delivered': return 'default';
            case 'Shipped': return 'secondary';
            case 'Processing': return 'secondary';
            case 'Cancelled': return 'destructive';
            default: return 'outline';
        }
    };

    const totalSpent = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalOrders = payments.length;

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
            <header className="mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold font-headline">Payment History</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            View all your payment transactions and download receipts.
                        </p>
                    </div>
                    <Link href="/profile/payments/recover">
                        <Button variant="outline" size="sm">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Recover Payments
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="text-xs sm:text-sm text-muted-foreground">Total Spent</div>
                        <div className="text-lg sm:text-2xl font-bold mt-1">₦{totalSpent.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="text-xs sm:text-sm text-muted-foreground">Total Orders</div>
                        <div className="text-lg sm:text-2xl font-bold mt-1">{totalOrders}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="text-xs sm:text-sm text-muted-foreground">Average Order</div>
                        <div className="text-lg sm:text-2xl font-bold mt-1">
                            ₦{totalOrders > 0 ? Math.round(totalSpent / totalOrders).toLocaleString() : '0'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by order ID, payment reference..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Payments List */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : filteredPayments.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Receipt className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">No payment history found</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Mobile Card View */}
                    <div className="block md:hidden space-y-3">
                        {filteredPayments.map((payment) => (
                            <Card key={payment.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-semibold text-sm">Order #{payment.orderId?.slice(0, 7)}</p>
                                                <Badge variant={getStatusVariant(payment.status) as any} className="text-xs">
                                                    {payment.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {payment.createdAt ? format(payment.createdAt.toDate(), 'MMM dd, yyyy') : 'N/A'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Ref: {payment.paymentReference || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">₦{payment.amount.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handleDownloadReceipt(payment.orderId)}
                                            disabled={isGenerating}
                                        >
                                            <Download className="mr-2 h-4 w-4" />
                                            Download
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => handlePrintReceipt(payment.orderId)}
                                            disabled={isGenerating}
                                        >
                                            <Printer className="mr-2 h-4 w-4" />
                                            Print
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <Card className="hidden md:block">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order ID</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Payment Method</TableHead>
                                            <TableHead>Reference</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredPayments.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell className="font-medium">#{payment.orderId?.slice(0, 7)}</TableCell>
                                                <TableCell className="text-sm">
                                                    {payment.createdAt ? format(payment.createdAt.toDate(), 'MMM dd, yyyy') : 'N/A'}
                                                </TableCell>
                                                <TableCell>{payment.paymentMethod}</TableCell>
                                                <TableCell className="font-mono text-xs">{payment.paymentReference || 'N/A'}</TableCell>
                                                <TableCell className="text-right font-semibold">₦{payment.amount.toLocaleString()}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={getStatusVariant(payment.status) as any}>
                                                        {payment.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDownloadReceipt(payment.orderId)}
                                                            disabled={isGenerating}
                                                        >
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Download
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handlePrintReceipt(payment.orderId)}
                                                            disabled={isGenerating}
                                                        >
                                                            <Printer className="mr-2 h-4 w-4" />
                                                            Print
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}

