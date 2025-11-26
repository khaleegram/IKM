
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

// Mock orders data
const orders = [
  {
    id: "ORD001",
    customer: "John Doe",
    date: "2024-07-28",
    total: "₦27,500",
    status: "Processing",
    items: 2,
  },
  {
    id: "ORD002",
    customer: "Jane Smith",
    date: "2024-07-27",
    total: "₦12,000",
    status: "Shipped",
    items: 1,
  },
  {
    id: "ORD003",
    customer: "Bob Johnson",
    date: "2024-07-26",
    total: "₦8,500",
    status: "Delivered",
    items: 1,
  },
    {
    id: "ORD004",
    customer: "Alice Williams",
    date: "2024-07-25",
    total: "₦40,000",
    status: "Processing",
    items: 3,
  },
];

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Processing': return 'secondary';
        case 'Shipped': return 'accent';
        case 'Delivered': return 'support';
        case 'Cancelled': return 'destructive';
        default: return 'default';
    }
}


export default function OrdersPage() {
  const hasOrders = orders.length > 0;

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 bg-background border-b flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Orders</h1>
          <p className="text-muted-foreground">
            View and manage customer orders.
          </p>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        {hasOrders ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{order.date}</TableCell>
                      <TableCell className="text-right">{order.total}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusVariant(order.status) as any}>{order.status}</Badge>
                      </TableCell>
                       <TableCell className="text-right">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem>Update Status</DropdownMenuItem>
                                <DropdownMenuItem>Contact Customer</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-lg text-center border-dashed shadow-none">
              <CardHeader>
                <div className="mx-auto bg-secondary rounded-full w-16 h-16 flex items-center justify-center">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="font-headline">
                  You have no orders yet
                </CardTitle>
                <CardDescription className="mt-2">
                  When a customer places an order, it will appear here.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
