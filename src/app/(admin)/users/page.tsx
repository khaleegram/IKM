
'use client';

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
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, User as UserIcon, FileWarning, MoreHorizontal, Trash2 } from "lucide-react";
import { useAllUserProfiles } from "@/lib/firebase/firestore/users";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { grantAdminRole, revokeAdminRole } from "@/lib/admin-actions";
import { useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function AdminUsersPage() {
  const { data: users, isLoading, error } = useAllUserProfiles();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = async (userId: string, currentIsAdmin: boolean) => {
    startTransition(async () => {
        try {
            if (currentIsAdmin) {
                await revokeAdminRole(userId);
                toast({ title: "Admin Revoked", description: "User permissions have been downgraded." });
            } else {
                await grantAdminRole(userId);
                toast({ title: "Admin Granted", description: "User has been promoted to admin." });
            }
        } catch (err) {
            toast({
                variant: 'destructive',
                title: "Action Failed",
                description: (err as Error).message,
            });
        }
    });
  }

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 bg-background border-b">
        <div>
          <h1 className="text-2xl font-bold font-headline">Users</h1>
          <p className="text-muted-foreground">Manage all registered users and their roles.</p>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : error ? (
            <Card className="w-full text-center border-dashed shadow-none">
                <CardHeader>
                    <div className="mx-auto bg-destructive/10 rounded-full w-16 h-16 flex items-center justify-center">
                        <FileWarning className="w-8 h-8 text-destructive" />
                    </div>
                </CardHeader>
                <CardContent>
                    <CardTitle className="font-headline text-destructive">An Error Occurred</CardTitle>
                    <CardDescription className="mt-2">{error.message}</CardDescription>
                </CardContent>
            </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.displayName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="text-center">
                        {user.isAdmin ? (
                          <Badge variant="support">
                            <ShieldCheck className="mr-1.5 h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <UserIcon className="mr-1.5 h-3 w-3" />
                            User
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending}>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                               {user.isAdmin ? (
                                    <DropdownMenuItem onClick={() => handleRoleChange(user.id!, true)} disabled={isPending}>
                                        Revoke Admin
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem onClick={() => handleRoleChange(user.id!, false)} disabled={isPending}>
                                        Make Admin
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
