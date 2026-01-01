'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  ShieldCheck, 
  Key, 
  Settings, 
  FileText, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Plus,
  Trash2,
  LogOut,
  Loader2,
  Eye,
  EyeOff,
  Save,
  RefreshCw
} from 'lucide-react';
import {
  getAccessLogs,
  getFailedLogins,
  getApiKeys,
  createApiKey,
  revokeApiKey,
  getSecuritySettings,
  updateSecuritySettings,
  getAuditTrail,
  getFirestoreRules,
  type AccessLog,
  type ApiKey,
  type SecuritySettings,
  type AuditLog,
} from '@/lib/security-actions';
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
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SecurityPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('access-logs');
  
  // Access Logs State
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [failedLogins, setFailedLogins] = useState<AccessLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  
  // API Keys State
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>([]);
  const [newKeyRateLimit, setNewKeyRateLimit] = useState<string>('');
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  
  // Audit Trail State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(true);
  const [auditFilter, setAuditFilter] = useState<string>('all');
  
  // Firestore Rules State
  const [firestoreRules, setFirestoreRules] = useState<string>('');
  const [isLoadingRules, setIsLoadingRules] = useState(true);

  // Load Access Logs
  useEffect(() => {
    if (activeTab === 'access-logs') {
      loadAccessLogs();
    }
  }, [activeTab]);

  const loadAccessLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const [logs, failed] = await Promise.all([
        getAccessLogs(100),
        getFailedLogins(50),
      ]);
      setAccessLogs(logs);
      setFailedLogins(failed);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message,
      });
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Load API Keys
  useEffect(() => {
    if (activeTab === 'api-keys') {
      loadApiKeys();
    }
  }, [activeTab]);

  const loadApiKeys = async () => {
    setIsLoadingKeys(true);
    try {
      const keys = await getApiKeys();
      setApiKeys(keys);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message,
      });
    } finally {
      setIsLoadingKeys(false);
    }
  };

  // Load Security Settings
  useEffect(() => {
    if (activeTab === 'security-settings') {
      loadSecuritySettings();
    }
  }, [activeTab]);

  const loadSecuritySettings = async () => {
    setIsLoadingSettings(true);
    try {
      const settings = await getSecuritySettings();
      setSecuritySettings(settings);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message,
      });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // Load Audit Trail
  useEffect(() => {
    if (activeTab === 'audit-trail') {
      loadAuditTrail();
    }
  }, [activeTab, auditFilter]);

  const loadAuditTrail = async () => {
    setIsLoadingAudit(true);
    try {
      const logs = await getAuditTrail(100, undefined, auditFilter === 'all' ? undefined : auditFilter);
      setAuditLogs(logs);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message,
      });
    } finally {
      setIsLoadingAudit(false);
    }
  };

  // Load Firestore Rules
  useEffect(() => {
    if (activeTab === 'firestore-rules') {
      loadFirestoreRules();
    }
  }, [activeTab]);

  const loadFirestoreRules = async () => {
    setIsLoadingRules(true);
    try {
      const rules = await getFirestoreRules();
      setFirestoreRules(rules.rules);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message,
      });
    } finally {
      setIsLoadingRules(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName || newKeyScopes.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Name and at least one scope are required',
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await createApiKey({
          name: newKeyName,
          scopes: newKeyScopes,
          rateLimit: newKeyRateLimit ? parseInt(newKeyRateLimit) : undefined,
        });
        setCreatedApiKey(result.apiKey);
        setShowApiKey(true);
        setNewKeyName('');
        setNewKeyScopes([]);
        setNewKeyRateLimit('');
        setShowNewKeyDialog(false);
        await loadApiKeys();
        toast({
          title: 'API Key Created',
          description: 'Make sure to copy the key now. You won\'t be able to see it again.',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: (error as Error).message,
        });
      }
    });
  };

  const handleRevokeApiKey = async (keyId: string) => {
    startTransition(async () => {
      try {
        await revokeApiKey(keyId);
        await loadApiKeys();
        toast({
          title: 'API Key Revoked',
          description: 'The API key has been successfully revoked.',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: (error as Error).message,
        });
      }
    });
  };

  const handleSaveSecuritySettings = async () => {
    if (!securitySettings) return;

    startTransition(async () => {
      try {
        await updateSecuritySettings(securitySettings);
        toast({
          title: 'Settings Updated',
          description: 'Security settings have been successfully updated.',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: (error as Error).message,
        });
      }
    });
  };

  const toggleScope = (scope: string) => {
    if (newKeyScopes.includes(scope)) {
      setNewKeyScopes(newKeyScopes.filter(s => s !== scope));
    } else {
      setNewKeyScopes([...newKeyScopes, scope]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 sm:p-6 bg-background border-b">
        <div>
          <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            Security & Access
          </h1>
          <p className="text-muted-foreground">Manage security settings, access logs, API keys, and audit trails</p>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="access-logs">Access Logs</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="security-settings">Security Settings</TabsTrigger>
            <TabsTrigger value="audit-trail">Audit Trail</TabsTrigger>
            <TabsTrigger value="firestore-rules">Firestore Rules</TabsTrigger>
          </TabsList>

          {/* Access Logs Tab */}
          <TabsContent value="access-logs" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Access Logs</h2>
              <Button onClick={loadAccessLogs} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Failed Logins Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Failed Login Attempts
                </CardTitle>
                <CardDescription>Recent failed login attempts requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingLogs ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : failedLogins.length === 0 ? (
                  <p className="text-muted-foreground text-center p-4">No failed login attempts</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {failedLogins.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{format(log.timestamp, 'PPp')}</TableCell>
                          <TableCell>{log.email || 'N/A'}</TableCell>
                          <TableCell>{log.ipAddress || 'N/A'}</TableCell>
                          <TableCell>{log.deviceInfo || log.userAgent || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{log.failureReason || 'Unknown'}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* All Access Logs */}
            <Card>
              <CardHeader>
                <CardTitle>All Access Logs</CardTitle>
                <CardDescription>Complete login and access history</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingLogs ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : accessLogs.length === 0 ? (
                  <p className="text-muted-foreground text-center p-4">No access logs found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accessLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{format(log.timestamp, 'PPp')}</TableCell>
                          <TableCell>
                            <Badge variant={log.success ? 'default' : 'destructive'}>
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.email || 'N/A'}</TableCell>
                          <TableCell>
                            {log.success ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </TableCell>
                          <TableCell>{log.ipAddress || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">API Keys Management</h2>
              <Button onClick={() => setShowNewKeyDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Active API Keys</CardTitle>
                <CardDescription>Manage API keys for external integrations</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingKeys ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : apiKeys.length === 0 ? (
                  <p className="text-muted-foreground text-center p-4">No API keys created yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Key Prefix</TableHead>
                        <TableHead>Scopes</TableHead>
                        <TableHead>Rate Limit</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map((key) => (
                        <TableRow key={key.id}>
                          <TableCell className="font-medium">{key.name}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">{key.keyPrefix}...</code>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {key.scopes.map((scope) => (
                                <Badge key={scope} variant="secondary" className="text-xs">
                                  {scope}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{key.rateLimit ? `${key.rateLimit}/min` : 'Unlimited'}</TableCell>
                          <TableCell>
                            {key.lastUsedAt ? format(key.lastUsedAt, 'PPp') : 'Never'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={key.isActive ? 'default' : 'secondary'}>
                              {key.isActive ? 'Active' : 'Revoked'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {key.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevokeApiKey(key.id)}
                                disabled={isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings Tab */}
          <TabsContent value="security-settings" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Security Settings</h2>
              <Button onClick={handleSaveSecuritySettings} disabled={isPending || !securitySettings}>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>

            {isLoadingSettings ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : securitySettings ? (
              <div className="space-y-6">
                {/* Password Policy */}
                <Card>
                  <CardHeader>
                    <CardTitle>Password Policy</CardTitle>
                    <CardDescription>Configure password requirements</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Minimum Length</Label>
                      <Input
                        type="number"
                        value={securitySettings.passwordMinLength}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          passwordMinLength: parseInt(e.target.value) || 8,
                        })}
                        min={6}
                        max={128}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={securitySettings.passwordRequireUppercase}
                          onCheckedChange={(checked) => setSecuritySettings({
                            ...securitySettings,
                            passwordRequireUppercase: checked === true,
                          })}
                        />
                        <Label>Require uppercase letters</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={securitySettings.passwordRequireLowercase}
                          onCheckedChange={(checked) => setSecuritySettings({
                            ...securitySettings,
                            passwordRequireLowercase: checked === true,
                          })}
                        />
                        <Label>Require lowercase letters</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={securitySettings.passwordRequireNumbers}
                          onCheckedChange={(checked) => setSecuritySettings({
                            ...securitySettings,
                            passwordRequireNumbers: checked === true,
                          })}
                        />
                        <Label>Require numbers</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={securitySettings.passwordRequireSpecialChars}
                          onCheckedChange={(checked) => setSecuritySettings({
                            ...securitySettings,
                            passwordRequireSpecialChars: checked === true,
                          })}
                        />
                        <Label>Require special characters</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Session Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Session Management</CardTitle>
                    <CardDescription>Configure session timeout and security</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Session Timeout (minutes)</Label>
                      <Input
                        type="number"
                        value={securitySettings.sessionTimeoutMinutes}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          sessionTimeoutMinutes: parseInt(e.target.value) || 60,
                        })}
                        min={5}
                        max={1440}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={securitySettings.twoFactorEnabled}
                        onCheckedChange={(checked) => setSecuritySettings({
                          ...securitySettings,
                          twoFactorEnabled: checked === true,
                        })}
                      />
                      <Label>Enable Two-Factor Authentication</Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Lockout */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Lockout Policy</CardTitle>
                    <CardDescription>Configure account lockout after failed attempts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={securitySettings.accountLockoutEnabled}
                        onCheckedChange={(checked) => setSecuritySettings({
                          ...securitySettings,
                          accountLockoutEnabled: checked === true,
                        })}
                      />
                      <Label>Enable Account Lockout</Label>
                    </div>
                    {securitySettings.accountLockoutEnabled && (
                      <>
                        <div className="space-y-2">
                          <Label>Max Login Attempts</Label>
                          <Input
                            type="number"
                            value={securitySettings.maxLoginAttempts}
                            onChange={(e) => setSecuritySettings({
                              ...securitySettings,
                              maxLoginAttempts: parseInt(e.target.value) || 5,
                            })}
                            min={3}
                            max={10}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Lockout Duration (minutes)</Label>
                          <Input
                            type="number"
                            value={securitySettings.lockoutDurationMinutes}
                            onChange={(e) => setSecuritySettings({
                              ...securitySettings,
                              lockoutDurationMinutes: parseInt(e.target.value) || 30,
                            })}
                            min={5}
                            max={1440}
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* IP Management */}
                <Card>
                  <CardHeader>
                    <CardTitle>IP Whitelist/Blacklist</CardTitle>
                    <CardDescription>Manage allowed and blocked IP addresses</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>IP Whitelist (one per line)</Label>
                      <Textarea
                        value={securitySettings.ipWhitelist.join('\n')}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          ipWhitelist: e.target.value.split('\n').filter(ip => ip.trim()),
                        })}
                        placeholder="192.168.1.1&#10;10.0.0.1"
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>IP Blacklist (one per line)</Label>
                      <Textarea
                        value={securitySettings.ipBlacklist.join('\n')}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          ipBlacklist: e.target.value.split('\n').filter(ip => ip.trim()),
                        })}
                        placeholder="192.168.1.100&#10;10.0.0.50"
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Email Verification */}
                <Card>
                  <CardHeader>
                    <CardTitle>Email Verification</CardTitle>
                    <CardDescription>Configure email verification requirements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={securitySettings.emailVerificationRequired}
                        onCheckedChange={(checked) => setSecuritySettings({
                          ...securitySettings,
                          emailVerificationRequired: checked === true,
                        })}
                      />
                      <Label>Require email verification for new accounts</Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </TabsContent>

          {/* Audit Trail Tab */}
          <TabsContent value="audit-trail" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Audit Trail</h2>
              <div className="flex gap-2">
                <Select value={auditFilter} onValueChange={setAuditFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="user">User Actions</SelectItem>
                    <SelectItem value="order">Order Actions</SelectItem>
                    <SelectItem value="product">Product Actions</SelectItem>
                    <SelectItem value="settings">Settings Changes</SelectItem>
                    <SelectItem value="system">System Events</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={loadAuditTrail} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Detailed log of all system actions and changes</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAudit ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : auditLogs.length === 0 ? (
                  <p className="text-muted-foreground text-center p-4">No audit logs found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{format(log.timestamp, 'PPp')}</TableCell>
                          <TableCell>{log.userEmail || log.userId}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.action}</Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <Badge variant="secondary">{log.resourceType}</Badge>
                              {log.resourceId && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  {log.resourceId.substring(0, 8)}...
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{log.ipAddress || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Firestore Rules Tab */}
          <TabsContent value="firestore-rules" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Firestore Security Rules</h2>
              <Button onClick={loadFirestoreRules} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Current Rules</CardTitle>
                <CardDescription>View and manage Firestore security rules</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRules ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Textarea
                      value={firestoreRules}
                      readOnly
                      className="font-mono text-sm"
                      rows={20}
                    />
                    <p className="text-sm text-muted-foreground">
                      Note: Rule deployment requires Firebase Management API integration. 
                      Currently, rules are read-only. To update rules, use Firebase Console or CLI.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create API Key Dialog */}
        <AlertDialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create New API Key</AlertDialogTitle>
              <AlertDialogDescription>
                Create a new API key for external integrations. Make sure to copy the key immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Key Name</Label>
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production API Key"
                />
              </div>
              <div className="space-y-2">
                <Label>Scopes</Label>
                <div className="space-y-2">
                  {['read', 'write', 'admin', 'orders', 'products', 'users'].map((scope) => (
                    <div key={scope} className="flex items-center space-x-2">
                      <Checkbox
                        checked={newKeyScopes.includes(scope)}
                        onCheckedChange={() => toggleScope(scope)}
                      />
                      <Label>{scope}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rate Limit (requests per minute, optional)</Label>
                <Input
                  type="number"
                  value={newKeyRateLimit}
                  onChange={(e) => setNewKeyRateLimit(e.target.value)}
                  placeholder="Unlimited"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCreateApiKey} disabled={isPending}>
                Create Key
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Show Created API Key Dialog */}
        <AlertDialog open={showApiKey} onOpenChange={setShowApiKey}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>API Key Created</AlertDialogTitle>
              <AlertDialogDescription>
                Copy this key now. You won't be able to see it again!
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Your API Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={createdApiKey || ''}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (createdApiKey) {
                        navigator.clipboard.writeText(createdApiKey);
                        toast({
                          title: 'Copied',
                          description: 'API key copied to clipboard',
                        });
                      }
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => {
                setShowApiKey(false);
                setCreatedApiKey(null);
              }}>
                I've Copied It
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

