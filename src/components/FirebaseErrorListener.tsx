'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { isFirebaseError } from '@/firebase/errors';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      console.error("Caught a Firestore Permission Error:", error);

      if (isFirebaseError(error)) {
        // This is a rich, contextual error from our custom wrapper
        toast({
          variant: 'destructive',
          title: 'Firestore Permission Denied',
          description: error.toString(),
          duration: 20000,
        });
      } else {
        // This is a generic or standard Firebase error
         toast({
          variant: 'destructive',
          title: 'An Error Occurred',
          description: error.message || "An unknown error occurred.",
          duration: 10000,
        });
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);

    // Cleanup the listener when the component unmounts
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  // This component does not render anything to the DOM
  return null;
}
