import { useState, useCallback } from "react";

/**
 * Hook لإدارة التنقل بين خطوات متعددة
 */
export function useMultiStep<T extends string>(steps: T[], initialStep?: T) {
  const [currentStep, setCurrentStep] = useState<T>(initialStep ?? steps[0]);
  
  const currentIndex = steps.indexOf(currentStep);
  const canGoNext = currentIndex < steps.length - 1;
  const canGoBack = currentIndex > 0;
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === steps.length - 1;
  
  const goToStep = useCallback((step: T) => {
    if (steps.includes(step)) {
      setCurrentStep(step);
    }
  }, [steps]);
  
  const goNext = useCallback(() => {
    if (canGoNext) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  }, [canGoNext, currentIndex, steps]);
  
  const goBack = useCallback(() => {
    if (canGoBack) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }, [canGoBack, currentIndex, steps]);
  
  const goToFirst = useCallback(() => {
    setCurrentStep(steps[0]);
  }, [steps]);
  
  const goToLast = useCallback(() => {
    setCurrentStep(steps[steps.length - 1]);
  }, [steps]);
  
  const reset = useCallback(() => {
    setCurrentStep(initialStep ?? steps[0]);
  }, [initialStep, steps]);
  
  return {
    currentStep,
    currentIndex,
    totalSteps: steps.length,
    canGoNext,
    canGoBack,
    isFirstStep,
    isLastStep,
    goToStep,
    goNext,
    goBack,
    goToFirst,
    goToLast,
    reset
  };
}
