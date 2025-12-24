'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  count?: number;
  viewMode?: 'grid' | 'list';
}

export function ProductGridSkeleton({ count = 12, viewMode = 'grid' }: LoadingSkeletonProps) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} className="overflow-hidden border shadow-sm">
            <div className="flex flex-col sm:flex-row">
              <CardHeader className="p-0 sm:w-48 flex-shrink-0">
                <Skeleton className="aspect-square sm:aspect-auto sm:h-48 w-full" />
              </CardHeader>
              <CardContent className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden border-0 shadow-sm">
          <CardHeader className="p-0">
            <Skeleton className="aspect-square w-full" />
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

