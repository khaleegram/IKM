'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { useState, useTransition, useRef } from "react";
import Image from "next/image";

// In a real app, you would have a hook and server action to manage branding.
// For this example, we'll simulate the state management.

export default function AdminBrandingPage() {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // This would come from a hook like `useBranding()`
    const currentLogoUrl = "/ikm-logo.svg"; // Placeholder

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!logoPreview) {
            toast({ variant: 'destructive', title: 'No logo selected', description: 'Please choose a file to upload.' });
            return;
        }

        startTransition(async () => {
            // Here you would call a server action to upload the logo
            // and update the branding settings in Firestore.
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast({
                title: "Logo Updated!",
                description: "Your new marketplace logo has been saved.",
            });
            // In a real app, the `currentLogoUrl` would update via the hook.
        });
    }

    return (
        <div className="flex flex-col h-full">
            <header className="p-4 sm:p-6 bg-background border-b">
                <div>
                  <h1 className="text-2xl font-bold font-headline">Branding</h1>
                  <p className="text-muted-foreground">Customize the look and feel of your marketplace.</p>
                </div>
            </header>
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <form onSubmit={handleSubmit}>
                    <Card className="max-w-2xl">
                        <CardHeader>
                            <CardTitle>Marketplace Logo</CardTitle>
                            <CardDescription>Upload a logo to be displayed in the site header.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Current Logo</Label>
                                <div className="p-4 border rounded-lg bg-muted/50 w-fit">
                                    <Image src={currentLogoUrl} alt="Current Logo" width={150} height={50} className="h-10 object-contain" />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="logo">New Logo</Label>
                                <div 
                                    className="border-2 border-dashed border-muted rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Input 
                                        ref={fileInputRef}
                                        id="logo" 
                                        name="logo" 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleImageChange} 
                                    />
                                    {logoPreview ? (
                                        <Image src={logoPreview} alt="New logo preview" width={150} height={50} className="mb-4 rounded-md object-contain h-10" />
                                    ) : (
                                        <Upload className="w-10 h-10 text-muted-foreground" />
                                    )}
                                    <p className="mt-2 text-muted-foreground">
                                        {logoPreview ? 'Click to change image' : 'Drag & drop or click to upload'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG up to 5MB</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button type="submit" disabled={isPending || !logoPreview}>
                                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Logo'}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </main>
        </div>
    )
}
