
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Sparkles, Compass, UserCircle } from 'lucide-react';

type OnboardingStep = 'welcome' | 'feed' | 'copilot' | 'menu' | 'final';

const tourSteps = {
  welcome: {
    title: 'Welcome to IKM!',
    description: "Let's take a quick tour.",
    button: "Let's Go!",
    spotlight: null,
  },
  feed: {
    title: 'Your Discovery Feed',
    description: 'Find new products, sellers, and collections here.',
    button: 'Next',
    spotlight: 'main-feed', // Corresponds to an element ID
    icon: Compass,
  },
  copilot: {
    title: 'Your AI Co-Pilot',
    description: 'Tap it anytime for help, recommendations, or to track your orders.',
    button: 'Next',
    spotlight: 'copilot-widget', // Corresponds to an element ID
    icon: Sparkles,
  },
  menu: {
    title: 'Profile & Menu',
    description: 'Find your Wishlist, Order History, and Settings here.',
    button: 'Got it!',
    spotlight: 'sidebar-menu', // Corresponds to an element ID
    icon: UserCircle,
  },
  final: {
    title: "You're all set.",
    description: 'Happy shopping!',
    button: 'Start Exploring',
    spotlight: null,
  },
};

export function OnboardingTour() {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [isOpen, setIsOpen] = useState(false);
  const [spotlightStyle, setSpotlightStyle] = useState({});

  useEffect(() => {
    // In a real app, you'd check a user property. Here, we use session storage to simulate.
    const hasBeenOnboarded = sessionStorage.getItem('ikmOnboarded');
    if (!hasBeenOnboarded) {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const currentStepConfig = tourSteps[step];
    if (currentStepConfig.spotlight) {
      const element = document.getElementById(currentStepConfig.spotlight);
      if (element) {
        const rect = element.getBoundingClientRect();
        setSpotlightStyle({
          width: `${rect.width + 20}px`,
          height: `${rect.height + 20}px`,
          top: `${rect.top - 10}px`,
          left: `${rect.left - 10}px`,
        });
      }
    } else {
      setSpotlightStyle({});
    }
  }, [step, isOpen]);

  const handleNext = () => {
    const stepOrder: OnboardingStep[] = ['welcome', 'feed', 'copilot', 'menu', 'final'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('ikmOnboarded', 'true');
  };

  if (!isOpen) {
    return null;
  }

  const currentStepInfo = tourSteps[step];
  const isSpotlightStep = !!currentStepInfo.spotlight;

  return (
    <div className="fixed inset-0 z-[101]">
      <div
        className={cn(
          "fixed inset-0 bg-black/60 transition-opacity duration-300",
          isSpotlightStep ? 'opacity-100' : 'opacity-0'
        )}
        onClick={isSpotlightStep ? undefined : handleNext}
      />
      {isSpotlightStep && (
        <div
          className="fixed rounded-lg border-2 border-dashed border-accent shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] transition-all duration-300 ease-in-out"
          style={spotlightStyle}
        />
      )}
      <div className="flex h-full items-center justify-center">
        <Card className={cn(
            "relative z-[102] w-[90%] max-w-sm text-center animate-in fade-in-0 zoom-in-95",
            isSpotlightStep && "mt-48" // Position modal below spotlighted area
        )}>
          <CardContent className="p-6 pt-12 space-y-4">
             {currentStepInfo.icon && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-primary rounded-full flex items-center justify-center border-4 border-background">
                    <currentStepInfo.icon className="h-8 w-8 text-primary-foreground" />
                </div>
             )}
            <h2 className="text-xl font-bold font-headline">{currentStepInfo.title}</h2>
            <p className="text-muted-foreground">{currentStepInfo.description}</p>
            <Button className="w-full" onClick={handleNext}>
              {currentStepInfo.button}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
