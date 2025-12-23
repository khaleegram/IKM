'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Truck, Plus, MapPin, Package, Settings } from "lucide-react";

export default function ShippingPage() {
  const [zones, setZones] = useState([
    { id: '1', name: 'Lagos', rate: 2000, freeThreshold: 10000 },
    { id: '2', name: 'Abuja', rate: 2500, freeThreshold: 15000 },
    { id: '3', name: 'Kano', rate: 3000, freeThreshold: 20000 },
  ]);

  const carriers = [
    { id: '1', name: 'GIG Logistics', enabled: true, apiKey: '***' },
    { id: '2', name: 'DHL', enabled: false, apiKey: '' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Shipping</h1>
          <p className="text-muted-foreground">Configure shipping rates, zones, and carrier integrations</p>
        </div>
      </div>

      <Tabs defaultValue="zones" className="space-y-4">
        <TabsList>
          <TabsTrigger value="zones">Shipping Zones</TabsTrigger>
          <TabsTrigger value="carriers">Carriers</TabsTrigger>
          <TabsTrigger value="packaging">Packaging</TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Shipping Zones</CardTitle>
                <CardDescription>Set shipping rates by location</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Zone
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Shipping Zone</DialogTitle>
                    <DialogDescription>Create a new shipping zone with rates</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Zone Name</Label>
                      <Input placeholder="Lagos" />
                    </div>
                    <div className="space-y-2">
                      <Label>Shipping Rate (₦)</Label>
                      <Input type="number" placeholder="2000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Free Shipping Threshold (₦)</Label>
                      <Input type="number" placeholder="10000" />
                    </div>
                    <Button className="w-full">Add Zone</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone Name</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Free Threshold</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell className="font-medium">{zone.name}</TableCell>
                      <TableCell>₦{zone.rate.toLocaleString()}</TableCell>
                      <TableCell>₦{zone.freeThreshold.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carriers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Carrier Integrations</CardTitle>
              <CardDescription>Connect with shipping carriers for automatic tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {carriers.map((carrier) => (
                  <div key={carrier.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{carrier.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {carrier.enabled ? 'Connected' : 'Not connected'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={carrier.enabled ? 'default' : 'secondary'}>
                        {carrier.enabled ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packaging" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Packaging Options</CardTitle>
              <CardDescription>Configure packaging types and costs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Packaging Type</Label>
                <select className="w-full p-2 border rounded">
                  <option>Standard Box</option>
                  <option>Envelope</option>
                  <option>Bubble Mailer</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Packaging Cost (₦)</Label>
                <Input type="number" placeholder="500" />
              </div>
              <Button>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

