'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw, WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();

  const handleRetry = () => {
    if (navigator.onLine) {
      router.refresh();
    } else {
      alert('You are still offline. Please check your internet connection.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
          <WifiOff className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold">You're Offline</h1>
        <p className="text-muted-foreground">
          It looks like you've lost your internet connection. Please check your network settings and try again.
        </p>
        <Button onClick={handleRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

