'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Check, X, Gift, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { calculateSetupProgress, SetupProgress } from '@/lib/store-setup-progress';
import { StoreProfile } from '@/lib/firebase/firestore/stores';

interface StoreSetupProgressProps {
  store: StoreProfile | null | undefined;
}

export function StoreSetupProgress({ store }: StoreSetupProgressProps) {
  const progress = calculateSetupProgress(store);

  // Debug: Log what we're rendering
  console.log('📊 StoreSetupProgress Component:', {
    hasStore: !!store,
    storeId: store?.id,
    progressCompleted: progress.completedCount,
    progressTotal: progress.totalCount,
    isFullyComplete: progress.isFullyComplete,
    tasks: progress.tasks.map(t => ({ id: t.id, label: t.label, completed: t.completed })),
  });

  // Don't show if everything is complete
  if (progress.isFullyComplete) {
    return null;
  }

  const incompleteTasks = progress.tasks.filter(t => !t.completed);
  const incompleteRequiredTasks = incompleteTasks.filter(t => t.required);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Store Setup Progress</CardTitle>
            {progress.rewardEligible && (
              <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full text-xs font-semibold text-primary">
                <Gift className="h-3 w-3" />
                Reward Eligible!
              </div>
            )}
          </div>
          <Link href="/seller/onboarding">
            <Button variant="outline" size="sm">
              Complete Setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <CardDescription>
          {progress.rewardEligible
            ? '🎉 All required tasks completed! Complete optional tasks to unlock rewards.'
            : `Complete ${incompleteRequiredTasks.length} more required task${incompleteRequiredTasks.length !== 1 ? 's' : ''} to unlock rewards.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {progress.completedCount} of {progress.totalCount} tasks completed
            </span>
            <span className="font-semibold">{Math.round(progress.progressPercentage)}%</span>
          </div>
          <Progress value={progress.progressPercentage} className="h-2" />
        </div>

        {/* Task Checklist */}
        <div className="space-y-2">
          {progress.tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-3 p-2 rounded-lg ${
                task.completed ? 'bg-muted/30' : 'bg-background'
              }`}
            >
              <div
                className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                  task.completed
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted border-2 border-muted-foreground/20'
                }`}
              >
                {task.completed ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${
                      task.completed ? 'text-muted-foreground line-through' : ''
                    }`}
                  >
                    {task.label}
                  </span>
                  {task.required && (
                    <span className="text-xs px-1.5 py-0.5 bg-destructive/10 text-destructive rounded">
                      Required
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                )}
              </div>
              {!task.completed && task.link && (
                <Link href={task.link}>
                  <Button variant="ghost" size="sm" className="h-8">
                    Complete
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Reward Message */}
        {progress.rewardEligible && incompleteTasks.length > 0 && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm font-medium text-primary flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Complete all tasks to unlock special rewards and badges!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


