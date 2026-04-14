<<<<<<< HEAD
=======
/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
>>>>>>> feat/sovereign-final-stabilization
/**
 * Domain: Sessions — Hooks
 *
 * Client-side hook for managing the intake form flow.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { IntakeFormData, IntakeStep } from "../types";
import { INITIAL_INTAKE_FORM, INTAKE_STEP_ORDER } from "../constants";
import { isDevMode } from "@/config/appEnv";
import { supabase } from "@/services/supabaseClient";
<<<<<<< HEAD
=======
import { loadDiagnosisState } from "@/modules/diagnosis/types";
import { USER_STATE_LABELS, MAIN_PAIN_LABELS } from "@/modules/diagnosis/diagnosisEngine";
>>>>>>> feat/sovereign-final-stabilization

export function useSessionIntake() {
  const [step, setStep] = useState<IntakeStep>("welcome");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<IntakeFormData>({
    ...INITIAL_INTAKE_FORM,
  });
<<<<<<< HEAD
=======
  const [isDiagnosisSynced, setIsDiagnosisSynced] = useState(false);

  // Sync with Diagnosis context
  useEffect(() => {
    const diag = loadDiagnosisState();
    if (diag && !formData.requestReason) {
      const typeLabel = USER_STATE_LABELS[diag.type] || diag.type;
      const painLabel = MAIN_PAIN_LABELS[diag.mainPain] || diag.mainPain;
      
      setFormData(prev => ({
        ...prev,
        requestReason: `التشخيص الأولي: ${typeLabel}`,
        urgencyReason: `مصدر الألم الأساسي: ${painLabel}`,
      }));
      setIsDiagnosisSynced(true);
    }
  }, []);

>>>>>>> feat/sovereign-final-stabilization
  const [isTyping, setIsTyping] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(null);
  const isTelemetryReadyRef = useRef(false);

  // Initialize Session ID
  useEffect(() => {
    let sid = sessionStorage.getItem("alrehla_intake_sid");
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem("alrehla_intake_sid", sid);
    }
    setSessionId(sid);
  }, []);

  // Join once so form updates do not spin up a fresh realtime handshake every time.
  useEffect(() => {
    if (!supabase) return;

    const client = supabase;
    const channel = client.channel("sovereign_control");
    channelRef.current = channel;

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        isTelemetryReadyRef.current = true;
      }
    });

    return () => {
      isTelemetryReadyRef.current = false;
      channelRef.current = null;
      client.removeChannel(channel);
    };
  }, []);

  // Broadcast Telemetry (Live Signal)
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel || !isTelemetryReadyRef.current || !sessionId) return;

    void channel.send({
      type: "broadcast",
      event: "INTAKE_TELEMETRY",
      payload: {
        sessionId,
        step,
        clientName: formData.name || "مجهول",
        phone: formData.phone || "",
        isTyping,
        activeField,
        active: true,
        crisisFlag: formData.crisisFlag,
        timestamp: new Date().toISOString(),
      },
    });

    // Also persist to DB for history (debounce might be needed, but we'll try direct upsert first)
    if (supabase) {
      supabase.from("session_telemetry").upsert({
        session_id: sessionId,
        client_name: formData.name || "مجهول",
        phone: formData.phone || "",
        is_typing: isTyping,
        active_field: activeField,
        current_step: step,
        crisis_flag: formData.crisisFlag,
        last_active: new Date().toISOString()
      }, { onConflict: "session_id" }).then(({ error }) => {
        if (error) console.error("[Telemetry] DB Sync Error:", error);
      });
    }
  }, [step, formData.name, formData.phone, isTyping, activeField, formData.crisisFlag, sessionId]);

  // Sensory Pulse Trigger for Crisis
  useEffect(() => {
    if (formData.crisisFlag) {
      import("@/core/synapse/SynapseBus").then(({ SynapseBus }) => {
        SynapseBus.dispatch("STRESS_SPIKED", "SESSION_INTAKE", 1.0, { reason: "Self-reported crisis in intake flow." });
      });
    }
  }, [formData.crisisFlag]);

  const updateField = useCallback(
    <K extends keyof IntakeFormData>(field: K, value: IntakeFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      
      // Handle isTyping pattern
      setIsTyping(true);
      setActiveField(field);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 1500);
    },
    []
  );

  const goBack = useCallback(() => {
    const idx = INTAKE_STEP_ORDER.indexOf(step as (typeof INTAKE_STEP_ORDER)[number]);
    if (idx > 0) {
      setStep(INTAKE_STEP_ORDER[idx - 1] as IntakeStep);
    }
  }, [step]);

  const goNext = useCallback((nextStep: IntakeStep) => {
    setStep(nextStep);
    setActiveField(null);
  }, []);

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

      // Clear telemetry on success
      if (supabase && sessionId) {
        await supabase.from("session_telemetry").delete().match({ session_id: sessionId });
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

  const canProceedFromBasic = Boolean(formData.name && formData.phone);
  const canProceedFromReason = Boolean(formData.requestReason && formData.urgencyReason);
  const canProceedFromContext = Boolean(formData.previousSessions && formData.durationOfProblem);
  const canSubmitSafety = Boolean(formData.sessionGoalType);

  return {
    step,
    formData,
    isSubmitting,
    isTyping,
    activeField,
    updateField,
    goBack,
    goNext,
    submitIntake,
    canProceedFromBasic,
    canProceedFromReason,
    canProceedFromContext,
    canSubmitSafety,
<<<<<<< HEAD
=======
    isDiagnosisSynced,
>>>>>>> feat/sovereign-final-stabilization
  };
}
