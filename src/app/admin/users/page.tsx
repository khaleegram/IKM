
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
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, User as UserIcon, FileWarning, MoreHorizontal, Trash2, Search, Download, CheckSquare, Square, X } from "lucide-react";
import { useAllUserProfiles } from "@/lib/firebase/firestore/users";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { grantAdminRole, revokeAdminRole } from "@/lib/admin-actions";
import { useTransition, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [users, searchTerm]);

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

  const handleBulkRoleChange = async (makeAdmin: boolean) => {
    if (selectedUsers.size === 0) return;

    startTransition(async () => {
      try {
        const promises = Array.from(selectedUsers).map(userId => {
          const user = users?.find(u => u.id === userId);
          if (!user) return Promise.resolve();
          return makeAdmin ? grantAdminRole(userId) : revokeAdminRole(userId);
        });

        await Promise.all(promises);
        toast({
          title: "Bulk Update Complete",
          description: `${selectedUsers.size} users have been ${makeAdmin ? 'promoted to admin' : 'demoted from admin'}.`,
        });
        setSelectedUsers(new Set());
        setIsBulkMode(false);
      } catch (err) {
        toast({
          variant: 'destructive',
          title: "Action Failed",
          description: (err as Error).message,
        });
      }
    });
  };

  const handleExportCSV = () => {
    if (!users) return;

    const headers = ['ID', 'Name', 'Email', 'Role', 'Created At'];
    const rows = filteredUsers.map(user => [
      user.id || '',
      user.displayName || '',
      user.email || '',
      user.isAdmin ? 'Admin' : 'User',
      user.createdAt ? format(user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt), 'yyyy-MM-dd') : '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Users exported to CSV',
    });
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id!).filter(Boolean)));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 bg-background border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold font-headline">Users</h1>
            <p className="text-muted-foreground">Manage all registered users and their roles.</p>
          </div>
          <div className="flex gap-2">
            {isBulkMode && selectedUsers.size > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleBulkRoleChange(true)}
                  disabled={isPending}
                  size="sm"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Make Admin ({selectedUsers.size})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleBulkRoleChange(false)}
                  disabled={isPending}
                  size="sm"
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  Remove Admin ({selectedUsers.size})
                </Button>
              </>
            )}
            <Button
              variant={isBulkMode ? "default" : "outline"}
              onClick={() => {
                setIsBulkMode(!isBulkMode);
                setSelectedUsers(new Set());
              }}
              size="sm"
            >
              {isBulkMode ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Select
                </>
              )}
            </Button>
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
                    {isBulkMode && (
                      <TableHead className="w-12">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={toggleSelectAll}
                        >
                          {selectedUsers.size === filteredUsers.length ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                    )}
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-center">Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isBulkMode ? 6 : 5} className="text-center text-muted-foreground py-8">
                        {searchTerm ? 'No users match your search criteria.' : 'No users found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        {isBulkMode && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleUserSelection(user.id!)}
                            >
                              {selectedUsers.has(user.id!) ? (
                                <CheckSquare className="h-4 w-4" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        )}
                        <TableCell className="font-medium">{user.displayName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.createdAt ? format(user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt), 'PP') : 'N/A'}
                        </TableCell>
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
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
