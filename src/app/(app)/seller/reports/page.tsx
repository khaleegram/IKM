'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText, Download, Calendar, Mail, Clock } from "lucide-react";
import { useUser } from "@/lib/firebase/auth/use-user";
import { useOrdersBySeller } from "@/lib/firebase/firestore/orders";
import { format as formatDate, subDays } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";
import { generateSalesReport, generateCustomerReport, generateProductReport } from "@/lib/report-actions";
import { Loader2 } from "lucide-react";

export default function ReportsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const { data: orders } = useOrdersBySeller(user?.uid);
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('30');
  const [format, setFormat] = useState('pdf');
  const [emailReport, setEmailReport] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  const handleGenerateReport = () => {
    if (!user?.uid) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not authenticated' });
      return;
    }

    startTransition(async () => {
      try {
        const days = parseInt(dateRange);
        let report;

        switch (reportType) {
          case 'sales':
          case 'revenue':
            report = await generateSalesReport(user.uid, days);
            break;
          case 'customers':
            report = await generateCustomerReport(user.uid, days);
            break;
          case 'products':
            report = await generateProductReport(user.uid, days);
            break;
          default:
            throw new Error('Invalid report type');
        }

        setGeneratedReport(report);
        toast({ title: 'Success', description: 'Report generated successfully!' });

        // If PDF format, download as JSON for now (PDF generation would require a library)
        if (format === 'pdf') {
          const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${reportType}-report-${Date.now()}.json`;
          a.click();
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to generate report',
        });
      }
    });
  };

  const handleExportData = () => {
    // Export current data as CSV
    const csv = generateCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${Date.now()}.csv`;
    a.click();
  };

  const generateCSV = () => {
    if (!orders) return '';
    const headers = ['Order ID', 'Date', 'Customer', 'Items', 'Total', 'Status'];
    const rows = orders.map((order) => [
      order.id || '',
      order.createdAt?.toDate ? formatDate(order.createdAt.toDate(), 'yyyy-MM-dd') : '',
      order.customerInfo?.name || '',
      order.items.length.toString(),
      order.total.toString(),
      order.status,
    ]);
    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and export business intelligence reports</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Report Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>Create a new business report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Report</SelectItem>
                  <SelectItem value="revenue">Revenue Report</SelectItem>
                  <SelectItem value="customers">Customer Report</SelectItem>
                  <SelectItem value="products">Product Performance</SelectItem>
                  <SelectItem value="inventory">Inventory Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="email" checked={emailReport} onCheckedChange={(checked) => setEmailReport(checked === true)} />
              <Label htmlFor="email" className="cursor-pointer">Email report when ready</Label>
            </div>

            <Button 
              onClick={handleGenerateReport} 
              className="w-full"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Scheduled Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Reports</CardTitle>
            <CardDescription>Automated report delivery</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Weekly Sales Report</div>
                  <div className="text-sm text-muted-foreground">Every Monday at 9:00 AM</div>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule New Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Export */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Export</CardTitle>
          <CardDescription>Export current data immediately</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={handleExportData} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export as CSV
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Orders
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Customers
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Your generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Sales Report - December 2024</TableCell>
                <TableCell>Sales</TableCell>
                <TableCell>Last 30 days</TableCell>
                <TableCell>{formatDate(new Date(), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

