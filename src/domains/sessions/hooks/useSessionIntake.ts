/**
 * Domain: Sessions — Hooks
 * 
 * Client-side hook for managing the intake form flow.
 */

import { useState, useCallback } from "react";
import type { IntakeFormData, IntakeStep } from "../types";
import { INITIAL_INTAKE_FORM, INTAKE_STEP_ORDER } from "../constants";

export function useSessionIntake() {
  const [step, setStep] = useState<IntakeStep>("welcome");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<IntakeFormData>({
    ...INITIAL_INTAKE_FORM,
  });

  const updateField = useCallback(
    <K extends keyof IntakeFormData>(field: K, value: IntakeFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const goBack = useCallback(() => {
    const idx = INTAKE_STEP_ORDER.indexOf(step as typeof INTAKE_STEP_ORDER[number]);
    if (idx > 0) {
      setStep(INTAKE_STEP_ORDER[idx - 1] as IntakeStep);
    }
  }, [step]);

  const goNext = useCallback(
    (nextStep: IntakeStep) => {
      setStep(nextStep);
    },
    []
  );

  const submitIntake = useCallback(async (): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/sessions/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit intake");
      }

      setStep("success");
      return true;
    } catch (e) {
      console.error("[Sessions] Intake submission failed:", e);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  // Validation helpers
  const canProceedFromBasic = Boolean(formData.name && formData.phone);
  const canProceedFromReason = Boolean(formData.requestReason && formData.urgencyReason);
  const canProceedFromContext = Boolean(formData.previousSessions && formData.durationOfProblem);
  const canSubmitSafety = Boolean(formData.sessionGoalType);

  return {
    step,
    formData,
    isSubmitting,
    updateField,
    goBack,
    goNext,
    submitIntake,
    canProceedFromBasic,
    canProceedFromReason,
    canProceedFromContext,
    canSubmitSafety,
  };
}
