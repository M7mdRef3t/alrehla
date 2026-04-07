/**
 * usePulseManagement Hook
 * hook لإدارة حالة البوصلة والنبض
 */

import { useState, useCallback, useRef, useEffect, type Dispatch, type SetStateAction } from "react";
import type { PulseMood, PulseFocus, PulseEnergyConfidence } from "@/state/pulseState";
import { usePulseState } from "@/state/pulseState";
import { recordFlowEvent } from "@/services/journeyTracking";
import { getFromLocalStorage, setInLocalStorage } from "@/services/browserStorage";
import { getWindowOrNull } from "@/services/clientRuntime";

const PULSE_DRAFT_STORAGE_KEY = "dawayir-pulse-check-draft-v1";

interface PulseDraft {
  energy: number | null;
  previousEnergy: number | null;
  hasPickedEnergy: boolean;
  mood: PulseMood | null;
  focus: PulseFocus | null;
  notes: string;
  topics: string[];
  energyReasons: string[];
  energyConfidence: PulseEnergyConfidence | null;
  step: 1 | 2 | 3;
}

interface UsePulseManagementReturn {
  energy: number | null;
  setEnergy: Dispatch<SetStateAction<number | null>>;
  previousEnergy: number | null;
  setPreviousEnergy: Dispatch<SetStateAction<number | null>>;
  hasPickedEnergy: boolean;
  setHasPickedEnergy: Dispatch<SetStateAction<boolean>>;
  mood: PulseMood | null;
  setMood: Dispatch<SetStateAction<PulseMood | null>>;
  focus: PulseFocus | null;
  setFocus: Dispatch<SetStateAction<PulseFocus | null>>;
  notes: string;
  setNotes: Dispatch<SetStateAction<string>>;
  topics: string[];
  setTopics: Dispatch<SetStateAction<string[]>>;
  energyReasons: string[];
  setEnergyReasons: Dispatch<SetStateAction<string[]>>;
  energyConfidence: PulseEnergyConfidence | null;
  setEnergyConfidence: Dispatch<SetStateAction<PulseEnergyConfidence | null>>;
  step: 1 | 2 | 3;
  setStep: Dispatch<SetStateAction<1 | 2 | 3>>;
  saveDraft: () => void;
  loadDraft: () => boolean;
  clearDraft: () => void;
}

export function usePulseManagement(isOpen: boolean): UsePulseManagementReturn {
  const [energy, setEnergy] = useState<number | null>(null);
  const [previousEnergy, setPreviousEnergy] = useState<number | null>(null);
  const [hasPickedEnergy, setHasPickedEnergy] = useState(false);
  const [mood, setMood] = useState<PulseMood | null>(null);
  const [focus, setFocus] = useState<PulseFocus | null>(null);
  const [notes, setNotes] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [energyReasons, setEnergyReasons] = useState<string[]>([]);
  const [energyConfidence, setEnergyConfidence] = useState<PulseEnergyConfidence | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  const isInitializedRef = useRef(false);

  const saveDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    
    const draft: PulseDraft = {
      energy,
      previousEnergy,
      hasPickedEnergy,
      mood,
      focus,
      notes,
      topics,
      energyReasons,
      energyConfidence,
      step
    };
    
    try {
      setInLocalStorage(PULSE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // ignore storage errors
    }
  }, [energy, previousEnergy, hasPickedEnergy, mood, focus, notes, topics, energyReasons, energyConfidence, step]);

  const loadDraft = useCallback((): boolean => {
    if (typeof window === "undefined") return false;
    
    try {
      const raw = getFromLocalStorage(PULSE_DRAFT_STORAGE_KEY);
      if (!raw) return false;
      
      const parsed = JSON.parse(raw) as Partial<PulseDraft>;
      if (!parsed || typeof parsed !== "object") return false;
      
      setEnergy(typeof parsed.energy === "number" ? parsed.energy : null);
      setPreviousEnergy(typeof parsed.previousEnergy === "number" ? parsed.previousEnergy : null);
      setHasPickedEnergy(Boolean(parsed.hasPickedEnergy));
      setMood(parsed.mood ?? null);
      setFocus(parsed.focus ?? null);
      setNotes(typeof parsed.notes === "string" ? parsed.notes : "");
      setTopics(Array.isArray(parsed.topics) ? parsed.topics.filter((x): x is string => typeof x === "string") : []);
      setEnergyReasons(Array.isArray(parsed.energyReasons) ? parsed.energyReasons.filter((x): x is string => typeof x === "string") : []);
      setEnergyConfidence(parsed.energyConfidence ?? null);
      setStep(parsed.step === 3 ? 3 : parsed.step === 2 ? 2 : 1);
      
      return true;
    } catch {
      return false;
    }
  }, []);

  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(PULSE_DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Auto-save draft when values change
  useEffect(() => {
    if (!isOpen) return;
    saveDraft();
  }, [isOpen, energy, mood, focus, notes, topics, energyReasons, energyConfidence, step, saveDraft]);

  return {
    energy,
    setEnergy,
    previousEnergy,
    setPreviousEnergy,
    hasPickedEnergy,
    setHasPickedEnergy,
    mood,
    setMood,
    focus,
    setFocus,
    notes,
    setNotes,
    topics,
    setTopics,
    energyReasons,
    setEnergyReasons,
    energyConfidence,
    setEnergyConfidence,
    step,
    setStep,
    saveDraft,
    loadDraft,
    clearDraft
  };
}
