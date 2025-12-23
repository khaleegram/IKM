/**
 * Store Setup Progress Tracking
 * 
 * Calculates completion status for store setup tasks
 */

import { StoreProfile } from '@/lib/firebase/firestore/stores';

export interface SetupTask {
  id: string;
  label: string;
  completed: boolean;
  required: boolean;
  link?: string;
  description?: string;
}

export interface SetupProgress {
  tasks: SetupTask[];
  completedCount: number;
  totalCount: number;
  requiredCompletedCount: number;
  requiredTotalCount: number;
  progressPercentage: number;
  requiredProgressPercentage: number;
  isFullyComplete: boolean;
  rewardEligible: boolean; // Eligible for reward when all required tasks are done
}

/**
 * Calculate store setup progress from store profile
 * Shows all tasks even if store doesn't exist yet (to encourage setup)
 */
export function calculateSetupProgress(store: StoreProfile | null | undefined): SetupProgress {
  // Even if store doesn't exist, show all tasks as incomplete to guide user
  const storeData = store || null;
  
  if (!storeData) {
    console.log('🔍 Setup Progress: No store provided - showing all tasks as incomplete');
  }

  // Debug: Log the store data being evaluated
  console.log('🔍 Setup Progress Calculation:', {
    storeId: storeData?.id || 'none',
    storeName: storeData?.storeName,
    storeDescription: storeData?.storeDescription,
    storeDescriptionLength: storeData?.storeDescription?.length || 0,
    storeLogoUrl: storeData?.storeLogoUrl,
    storeBannerUrl: storeData?.storeBannerUrl,
    storeLocation: storeData?.storeLocation,
    businessType: storeData?.businessType,
    storePolicies: storeData?.storePolicies,
    onboardingCompleted: storeData?.onboardingCompleted,
  });

  const tasks: SetupTask[] = [
    {
      id: 'store-name',
      label: 'Store Name',
      completed: !!(storeData?.storeName && storeData.storeName.trim().length > 0),
      required: true,
      link: '/seller/onboarding',
      description: 'Set your store name',
    },
    {
      id: 'store-description',
      label: 'Store Description',
      completed: !!(storeData?.storeDescription && storeData.storeDescription.trim().length >= 10),
      required: true,
      link: '/seller/onboarding',
      description: 'Describe your store (min 10 characters)',
    },
    {
      id: 'store-logo',
      label: 'Store Logo',
      completed: !!storeData?.storeLogoUrl,
      required: false,
      link: '/seller/onboarding',
      description: 'Upload your store logo',
    },
    {
      id: 'store-banner',
      label: 'Store Banner',
      completed: !!storeData?.storeBannerUrl,
      required: false,
      link: '/seller/onboarding',
      description: 'Upload your store banner',
    },
    {
      id: 'location',
      label: 'Store Location',
      completed: !!(
        storeData?.storeLocation?.state &&
        storeData?.storeLocation?.lga &&
        storeData?.storeLocation?.city &&
        storeData.storeLocation.city.trim().length > 0
      ),
      required: true,
      link: '/seller/onboarding',
      description: 'Set your store location (State, LGA, City)',
    },
    {
      id: 'business-type',
      label: 'Business Category',
      completed: !!(storeData?.businessType && storeData.businessType.trim().length > 0),
      required: true,
      link: '/seller/onboarding',
      description: 'Select your business category',
    },
    {
      id: 'policies',
      label: 'Store Policies',
      completed: !!(
        storeData?.storePolicies?.shipping ||
        storeData?.storePolicies?.returns ||
        storeData?.storePolicies?.refunds ||
        storeData?.storePolicies?.privacy
      ),
      required: false,
      link: '/seller/onboarding',
      description: 'Add shipping, returns, or refund policies',
    },
  ];

  // Debug: Log task completion status
  console.log('✅ Task Completion Status:', tasks.map(t => ({ id: t.id, label: t.label, completed: t.completed })));

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const requiredCompletedCount = tasks.filter(t => t.required && t.completed).length;
  const requiredTotalCount = tasks.filter(t => t.required).length;

  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const requiredProgressPercentage =
    requiredTotalCount > 0 ? (requiredCompletedCount / requiredTotalCount) * 100 : 0;

  const isFullyComplete = tasks.every(t => t.completed);
  const rewardEligible = tasks.filter(t => t.required).every(t => t.completed);

  return {
    tasks,
    completedCount,
    totalCount,
    requiredCompletedCount,
    requiredTotalCount,
    progressPercentage,
    requiredProgressPercentage,
    isFullyComplete,
    rewardEligible,
  };
}


