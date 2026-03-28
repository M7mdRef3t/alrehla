import type { FC, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag } from "lucide-react";
import { VoiceInput } from "./VoiceInput";
import type { PulseEnergyConfidence, PulseFocus, PulseMood } from "../state/pulseState";
import { usePulseState } from "../state/pulseState";
import { useAdminState, isFeatureAllowed, type PulseCopyOverrideValue } from "../state/adminState";
import { recordFlowEvent } from "../services/journeyTracking";
import {
  getEnergySuggestion,
  getWeeklyEnergyRecommendation,
  type EnergyCopyVariant
} from "../utils/pulseEnergy";
import { getFromLocalStorage, setInLocalStorage } from "../services/browserStorage";
import { setDocumentBodyOverflow, getAudioContextConstructor } from "../services/clientDom";
import { usePulseManagement } from "../hooks/usePulseManagement";
import { TOPIC_OPTIONS, MOODS, MOOD_COSMIC, FOCUS_OPTIONS, FOCUS_LABELS, FOCUS_COSMIC } from "./PulseCheckModalParts/constants";
import { energyGradient, getEnergyStateLabel, getEnergyQuickHint, getMoodQuickHint, getFocusQuickHint, generateTacticalAdvice, getPostSaveAction } from "./PulseCheckModalParts/helpers";
import type { TacticalAdvice } from "./PulseCheckModalParts/helpers";
import { Step1View } from "./PulseCheckModalParts/Step1View";
import { Step2View } from "./PulseCheckModalParts/Step2View";
import { AnalysisOverlay } from "./PulseCheckModalParts/AnalysisOverlay";
import { WarpVelocityEffect } from "./PulseCheckModalParts/WarpVelocityEffect";

interface PulseCheckModalProps {
  isOpen: boolean;
  context?: "regular" | "start_recovery";
  onSubmit: (payload: {
    energy: number | null;
    mood: PulseMood | null;
    focus: PulseFocus | null;
    topics?: string[];
    auto?: boolean;
    notes?: string;
    energyReasons?: string[];
    energyConfidence?: PulseEnergyConfidence;
  }) => void;
  onClose: (reason?: "backdrop" | "close_button") => void;
}

type EnergyUndoSnapshot = {
  energy: number | null;
  previousEnergy: number | null;
  hasPickedEnergy: boolean;
  focus: PulseFocus | null;
  notes: string;
  suggestionApplied: boolean;
  immediateActionApplied: boolean;
  source: "weekly_recommendation" | "immediate_action";
};

type MoodWeeklyRecommendation = {
  mood: PulseMood;
  count: number;
};

type CopyVariant = "a" | "b";

function getEnergyCopyVariant(forced: PulseCopyOverrideValue): EnergyCopyVariant {
  return getStoredCopyVariant("dawayir-energy-copy-variant", forced);
}

function getMoodCopyVariant(forced: PulseCopyOverrideValue): CopyVariant {
  return getStoredCopyVariant("dawayir-mood-copy-variant", forced);
}

function getFocusCopyVariant(forced: PulseCopyOverrideValue): CopyVariant {
  return getStoredCopyVariant("dawayir-focus-copy-variant", forced);
}

function getStoredCopyVariant(key: string, forced: PulseCopyOverrideValue): CopyVariant {
  if (forced === "a" || forced === "b") return forced;
  if (typeof window === "undefined") return "a";
  try {
    const existing = getFromLocalStorage(key);
    if (existing === "a" || existing === "b") return existing;
    const next: CopyVariant = Math.random() < 0.5 ? "a" : "b";
    setInLocalStorage(key, next);
    return next;
  } catch {
    return "a";
  }
}

function getMoodVariantSubtitle(variant: CopyVariant): string {
  return variant === "a"
    ? "اختار وصف قريب من إحساسك دلوقتي."
    : "مزاجك الحالي بيوضح شكل خطوتك الجاية.";
}

function getFocusVariantSubtitle(_variant: CopyVariant): string {
  return "حدّد على إيه عايز تركّز دلوقتي — ده بيحدد خطوتك الجاية.";
}

function getImmediateEnergyAction(energy: number | null): { cta: string; hint: string } | null {
  if (energy == null) return null;
  if (energy <= 3) {
    return {
      cta: "بدأ تنفس دقيقتين",
      hint: "ثم التزم بخطوة صغيرة واحدة."
    };
  }
  if (energy <= 7) {
    return {
      cta: "ثبّت مهمة 10 دقائق",
      hint: "مهمة واحدة بدون تشتت."
    };
  }
  return {
    cta: "ابدأ أول 15 دقيقة الآن",
    hint: "طاقة عالية تحتاج بداية سريعة."
  };
}

const ENERGY_ANCHORS = [0, 3, 6, 10] as const;
const ENERGY_FEEDBACK_POINTS = new Set<number>(ENERGY_ANCHORS);
const PULSE_DRAFT_STORAGE_KEY = "dawayir-pulse-check-draft-v1";
const NOTES_QUICK_CHIPS = [
  "في موقف معين مضايقني",
  "فكرة متكررة مش راضية تسيبني",
  "جسمي تعبان ومحتاج هدوء",
  "بس حابب أفضفض بجملة سريعة"
] as const;

function getWeeklyMoodRecommendation(
  logs: Array<{ mood: PulseMood; timestamp: number }>,
  now = Date.now()
): MoodWeeklyRecommendation | null {
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recent = logs.filter((item) => item.timestamp >= sevenDaysAgo).slice(0, 14);
  if (recent.length < 3) return null;
  const counts = new Map<PulseMood, number>();
  for (const item of recent) {
    counts.set(item.mood, (counts.get(item.mood) ?? 0) + 1);
  }
  const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
  if (!top) return null;
  return { mood: top[0], count: top[1] };
}

const cosmicUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  })
};

export const PulseCheckModal: FC<PulseCheckModalProps> = ({
  isOpen,
  context = "regular",
  onSubmit,
  onClose
}) => {
  const isStartRecovery = context === "start_recovery";
  const pulseLogs = usePulseState((s) => s.logs);
  const pulseCopyOverrides = useAdminState((s) => s.pulseCopyOverrides);
  const _allowWeekly = isFeatureAllowed("pulse_weekly_recommendation");
  const _allowImmediate = isFeatureAllowed("pulse_immediate_action");
  const _allowGoldenNeedle = isFeatureAllowed("golden_needle_enabled");
  void _allowWeekly; void _allowImmediate; void _allowGoldenNeedle;
  const allowSkip = true;

  // --- Hook-managed Pulse State ---
  const {
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
    clearDraft,
    loadDraft,
  } = usePulseManagement(isOpen);

  // --- Local UI State ---
  const [showRequiredHint, setShowRequiredHint] = useState(false);
  const [hasTrackedNotesUsage, setHasTrackedNotesUsage] = useState(false);
  const [suggestionApplied, setSuggestionApplied] = useState(false);
  const [isSavingPulse, setIsSavingPulse] = useState(false);
  const [saveToastText, setSaveToastText] = useState("\u062a\u0645 \u062d\u0641\u0638 \u062d\u0627\u0644\u062a\u0643");
  const [keyboardEnergyHint, setKeyboardEnergyHint] = useState<number | null>(null);
  void keyboardEnergyHint;
  const isEnergySelectionUnstableRef = useRef(false);
  const [needsEnergyConfirmation, setNeedsEnergyConfirmation] = useState(false);
  const [energyConfirmPulseActive, setEnergyConfirmPulseActive] = useState(false);
  const [energyUndoSnapshot, setEnergyUndoSnapshot] = useState<EnergyUndoSnapshot | null>(null);
  const [energyUndoLabel, setEnergyUndoLabel] = useState<string | null>(null);
  const [immediateActionApplied, setImmediateActionApplied] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [notesChars, setNotesChars] = useState(0);
  const [isWarping, setIsWarping] = useState(false);
  const [tacticalAdvice, setTacticalAdvice] = useState<TacticalAdvice | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);
  const lastFeedbackAnchorRef = useRef<number | null>(null);
  const lastHapticAtRef = useRef<number>(0);
  const keyboardHintTimerRef = useRef<number | null>(null);
  const undoTimerRef = useRef<number | null>(null);
  const confirmPulseTimerRef = useRef<number | null>(null);
  const moodAdjustmentsRef = useRef<number[]>([]);
  const lastTrackedMoodRef = useRef<PulseMood | null>(null);
  const moodChangeLastTrackedAtRef = useRef<number>(0);
  const moodUnstableEventTrackedRef = useRef(false);
  const isMoodSelectionUnstableRef = useRef(false);
  const [, setNeedsMoodConfirmation] = useState(false);
  const isInitializedRef = useRef(false);
  const energyAdjustmentsRef = useRef<number[]>([]);
  const lastTrackedEnergyRef = useRef<number | null>(null);
  const energyChangeLastTrackedAtRef = useRef<number>(0);
  const unstableEventTrackedRef = useRef(false);
  const copyVariantTrackedRef = useRef(false);
  const lastEnergyValue = pulseLogs[0]?.energy ?? null;

  const needleContainerRef = useRef<HTMLDivElement>(null);
  const isNeedleDraggingRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const energyStateLabel = getEnergyStateLabel(energy);
  const _energyQuickHint = getEnergyQuickHint(energy);
  const _moodQuickHint = getMoodQuickHint(mood);
  const _focusQuickHint = getFocusQuickHint(focus, isStartRecovery);
  void _energyQuickHint; void _moodQuickHint; void _focusQuickHint;

  const energyCopyVariant = useMemo(
    () => getEnergyCopyVariant(pulseCopyOverrides.energy),
    [pulseCopyOverrides.energy]
  );
  const moodCopyVariant = useMemo(
    () => getMoodCopyVariant(pulseCopyOverrides.mood),
    [pulseCopyOverrides.mood]
  );
  const focusCopyVariant = useMemo(
    () => getFocusCopyVariant(pulseCopyOverrides.focus),
    [pulseCopyOverrides.focus]
  );

  const _moodVariantSubtitle = getMoodVariantSubtitle(moodCopyVariant);
  const _focusVariantSubtitle = getFocusVariantSubtitle(focusCopyVariant);
  void _moodVariantSubtitle; void _focusVariantSubtitle;

  const weeklyEnergyRecommendation = useMemo(() => getWeeklyEnergyRecommendation(pulseLogs), [pulseLogs]);
  const weeklyMoodRecommendation = useMemo(
    () => getWeeklyMoodRecommendation(pulseLogs.map((item) => ({ mood: item.mood, timestamp: item.timestamp }))),
    [pulseLogs]
  );
  const energySuggestion = useMemo(() => getEnergySuggestion(energy), [energy]);
  const _pulseStats = useMemo(() => { if (pulseLogs.length === 0) return null; const sum = pulseLogs.reduce((acc, item) => acc + item.energy, 0); const avg = Math.round((sum / pulseLogs.length) * 10) / 10; return { avg, count: pulseLogs.length }; }, [pulseLogs]);
  void _pulseStats;

  const isComplete = hasPickedEnergy && mood !== null && focus !== null;
  const currentStepComplete = isComplete;

  const clearUndoState = () => {
    if (undoTimerRef.current != null) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setEnergyUndoSnapshot(null);
    setEnergyUndoLabel(null);
  };

  const rememberUndoSnapshot = (
    label: string,
    source: EnergyUndoSnapshot["source"]
  ) => {
    const snapshot: EnergyUndoSnapshot = {
      energy,
      previousEnergy,
      hasPickedEnergy,
      focus,
      notes,
      suggestionApplied,
      immediateActionApplied,
      source
    };
    setEnergyUndoSnapshot(snapshot);
    setEnergyUndoLabel(label);
    if (undoTimerRef.current != null) window.clearTimeout(undoTimerRef.current);
    undoTimerRef.current = window.setTimeout(() => {
      setEnergyUndoSnapshot(null);
      setEnergyUndoLabel(null);
      undoTimerRef.current = null;
    }, 3000);
  };

  const triggerEnergyConfirmPulse = () => {
    setEnergyConfirmPulseActive(false);
    window.setTimeout(() => {
      setEnergyConfirmPulseActive(true);
      if (confirmPulseTimerRef.current != null) window.clearTimeout(confirmPulseTimerRef.current);
      confirmPulseTimerRef.current = window.setTimeout(() => {
        setEnergyConfirmPulseActive(false);
        confirmPulseTimerRef.current = null;
      }, 560);
    }, 0);
  };

  useEffect(() => {
    if (!isOpen) {
      isInitializedRef.current = false;
      return;
    }
    if (isInitializedRef.current) return;

    const restored = loadDraft();

    if (!restored) {
      if (typeof lastEnergyValue === "number" && !isStartRecovery) {
        setEnergy(lastEnergyValue);
        setPreviousEnergy(lastEnergyValue);
        setHasPickedEnergy(true);
        lastFeedbackAnchorRef.current = lastEnergyValue;
      } else {
        setEnergy(null);
        setPreviousEnergy(null);
        setHasPickedEnergy(false);
        lastFeedbackAnchorRef.current = null;
      }
      setMood(null);
      setFocus(null);
      setNotes("");
      setStep(1);
    }

    setShowRequiredHint(false);
    setHasTrackedNotesUsage(false);
    setSuggestionApplied(false);
    setIsSavingPulse(false);
    setSaveToastText("\u062a\u0645 \u062d\u0641\u0638 \u062d\u0627\u0644\u062a\u0643");
    setKeyboardEnergyHint(null);
    setNeedsEnergyConfirmation(false);
    isMoodSelectionUnstableRef.current = false;
    setNeedsMoodConfirmation(false);
    setEnergyConfirmPulseActive(false);
    setImmediateActionApplied(false);
    setNotesChars(0);
    clearUndoState();
    energyAdjustmentsRef.current = [];
    moodAdjustmentsRef.current = [];
    lastTrackedEnergyRef.current = null;
    lastTrackedMoodRef.current = null;
    energyChangeLastTrackedAtRef.current = 0;
    moodChangeLastTrackedAtRef.current = 0;
    unstableEventTrackedRef.current = false;
    moodUnstableEventTrackedRef.current = false;
    copyVariantTrackedRef.current = false;

    isInitializedRef.current = true;
  }, [isOpen, lastEnergyValue, isStartRecovery, loadDraft, setEnergy, setPreviousEnergy, setHasPickedEnergy, setMood, setFocus, setNotes, setStep]);

  useEffect(() => {
    if (!isOpen || copyVariantTrackedRef.current) return;
    recordFlowEvent("pulse_copy_variant_assigned", {
      meta: {
        energyVariant: energyCopyVariant,
        moodVariant: moodCopyVariant,
        focusVariant: focusCopyVariant
      }
    });
    copyVariantTrackedRef.current = true;
  }, [isOpen, energyCopyVariant, moodCopyVariant, focusCopyVariant]);

  useEffect(() => {
    setNotesChars(notes.trim().length);
  }, [notes]);

  useEffect(() => {
    return () => {
      if (keyboardHintTimerRef.current != null) {
        window.clearTimeout(keyboardHintTimerRef.current);
        keyboardHintTimerRef.current = null;
      }
      if (undoTimerRef.current != null) {
        window.clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
      if (confirmPulseTimerRef.current != null) {
        window.clearTimeout(confirmPulseTimerRef.current);
        confirmPulseTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const restoreOverflow = setDocumentBodyOverflow("hidden");
    return () => {
      restoreOverflow?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setShowSkipConfirm(false);
  }, [isOpen]);

  const requestSkipClose = () => {
    if (!allowSkip) return;
    setShowSkipConfirm(true);
  };

  const confirmSkipClose = () => {
    if (!allowSkip) return;
    setShowSkipConfirm(false);
    onClose("close_button");
  };

  const handleClose = (reason: "backdrop" | "close_button") => {
    if (!allowSkip) return;
    if (showSkipConfirm) {
      setShowSkipConfirm(false);
      return;
    }
    onClose(reason);
  };

  const handleTacticalAnalysis = async () => {
    if (energy === null) return;
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const advice = generateTacticalAdvice(energy, mood, focus);
    setTacticalAdvice(advice);
    setIsAnalyzing(false);
    setIsWarping(true);
    window.setTimeout(() => {
      setStep(2);
      window.setTimeout(() => setIsWarping(false), 500);
    }, 250);
  };

  const processFinalSubmit = () => {
    if (isSavingPulse) return;
    const finalEnergy = hasPickedEnergy ? energy : null;
    const finalMood: PulseMood | null = mood ?? null;
    const finalFocus: PulseFocus | null = focus ?? null;
    const reasonsLine = energyReasons.length > 0
      ? `\u0623\u0633\u0628\u0627\u0628 \u0627\u0644\u0637\u0627\u0642\u0629: ${energyReasons.join("\u060c ")}`
      : "";
    const confidenceLine = energyConfidence
      ? `\u062b\u0642\u0629 \u0627\u0644\u0642\u064a\u0627\u0633: ${energyConfidence === "low"
        ? "\u0645\u0646\u062e\u0641\u0636\u0629"
        : energyConfidence === "medium"
          ? "\u0645\u062a\u0648\u0633\u0637\u0629"
          : "\u0639\u0627\u0644\u064a\u0629"
      }`
      : "";
    const mergedNotes = [reasonsLine, confidenceLine, notes.trim()].filter(Boolean).join("\n");
    const weeklyDiffLine = (() => {
      if (!weeklyEnergyRecommendation || energy == null) return "";
      const delta = energy - weeklyEnergyRecommendation.value;
      if (Math.abs(delta) < 1) return "\u0645\u0644\u0627\u062d\u0638\u0629: \u0637\u0627\u0642\u062a\u0643 \u0642\u0631\u064a\u0628\u0629 \u0645\u0646 \u0645\u062a\u0648\u0633\u0637 \u0627\u0644\u0623\u0633\u0628\u0648\u0639.";
      if (delta > 0) return `\u0645\u0644\u0627\u062d\u0638\u0629: \u0637\u0627\u0642\u062a\u0643 \u0623\u0639\u0644\u0649 \u0645\u0646 \u0645\u062a\u0648\u0633\u0637 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0628\u0640 ${delta}.`;
      return `\u0645\u0644\u0627\u062d\u0638\u0629: \u0637\u0627\u0642\u062a\u0643 \u0623\u0642\u0644 \u0645\u0646 \u0645\u062a\u0648\u0633\u0637 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0628\u0640 ${Math.abs(delta)}.`;
    })();
    setIsSavingPulse(true);
    setSaveToastText(
      finalEnergy == null
        ? "\u062a\u0645 \u062d\u0641\u0638 \u062d\u0627\u0644\u062a\u0643"
        : `\u062a\u0645 \u062d\u0641\u0638 \u062d\u0627\u0644\u062a\u0643 \u2022 ${getPostSaveAction(finalEnergy)}${weeklyDiffLine ? ` \u2022 ${weeklyDiffLine}` : ""}`
    );
    window.setTimeout(() => {
      onSubmit({
        energy: finalEnergy,
        mood: finalMood,
        focus: finalFocus,
        topics: topics.length > 0 ? topics : undefined,
        notes: mergedNotes || undefined,
        energyReasons: energyReasons.length > 0 ? energyReasons : undefined,
        energyConfidence: energyConfidence ?? undefined
      });
      clearDraft();
      clearUndoState();
      setIsSavingPulse(false);
    }, 220);
  };

  const handleSubmit = () => {
    if (step === 1) {
      handleTacticalAnalysis();
    } else {
      processFinalSubmit();
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!isComplete && !showRequiredHint) {
        setShowRequiredHint(true);
        return;
      }
      if (isComplete) {
        handleTacticalAnalysis();
      }
    }
  };

  const handlePreviousStep = () => {
    setShowRequiredHint(false);
    setNeedsEnergyConfirmation(false);
    setNeedsMoodConfirmation(false);
    setStep(1);
  };

  const applyEnergySuggestion = () => {
    if (!energySuggestion) return;
    setNotes((prev) => {
      const trimmed = prev.trim();
      if (trimmed.includes(energySuggestion.note)) return prev;
      return trimmed.length > 0 ? `${trimmed}\n${energySuggestion.note}` : energySuggestion.note;
    });
    if (!hasTrackedNotesUsage) {
      recordFlowEvent("pulse_notes_used");
      setHasTrackedNotesUsage(true);
    }
    if (!focus) setFocus(energySuggestion.focus);
    setSuggestionApplied(true);
    setImmediateActionApplied(true);
    window.setTimeout(() => setSuggestionApplied(false), 1800);
  };

  const setMoodValue = (nextMood: PulseMood) => {
    const now = Date.now();
    if (mood !== nextMood) {
      const windowMs = 8000;
      const recent = moodAdjustmentsRef.current.filter((ts) => now - ts <= windowMs);
      recent.push(now);
      moodAdjustmentsRef.current = recent;
      const unstableNow = recent.length >= 4;
      isMoodSelectionUnstableRef.current = unstableNow;
      if (unstableNow && !moodUnstableEventTrackedRef.current) {
        recordFlowEvent("pulse_mood_unstable", {
          meta: { changes: recent.length, windowMs, step }
        });
        moodUnstableEventTrackedRef.current = true;
      }
      if (lastTrackedMoodRef.current !== nextMood || now - moodChangeLastTrackedAtRef.current > 150) {
        recordFlowEvent("pulse_mood_changed", {
          meta: { mood: nextMood, step }
        });
        lastTrackedMoodRef.current = nextMood;
        moodChangeLastTrackedAtRef.current = now;
      }
    }
    setMood(nextMood);
    setNeedsMoodConfirmation(false);
    if (showRequiredHint) setShowRequiredHint(false);
  };

  const setFocusValue = (nextFocus: PulseFocus) => {
    if (focus !== nextFocus) {
      recordFlowEvent("pulse_focus_changed", {
        meta: { focus: nextFocus, step }
      });
    }
    setFocus(nextFocus);
    if (showRequiredHint) setShowRequiredHint(false);
  };

  const pulseAtAnchor = () => {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(10);
    }
    try {
      const Ctx = getAudioContextConstructor();
      if (!Ctx) return;
      const ctx = new Ctx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 420;
      gain.gain.value = 0.0001;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      const t0 = ctx.currentTime;
      gain.gain.exponentialRampToValueAtTime(0.0075, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
      oscillator.start(t0);
      oscillator.stop(t0 + 0.06);
      window.setTimeout(() => void ctx.close(), 100);
    } catch {
      // ignore subtle feedback failures on unsupported environments
    }
  };

  const triggerSoftHaptic = () => {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    const now = Date.now();
    if (now - lastHapticAtRef.current < 45) return;
    lastHapticAtRef.current = now;
    navigator.vibrate(6);
  };

  const setEnergyValue = (raw: number, options?: { skipHaptic?: boolean }) => {
    const next = Math.max(0, Math.min(10, Math.round(raw)));
    if (energy != null) setPreviousEnergy(energy);
    if (next !== energy) {
      const now = Date.now();
      const windowMs = 8000;
      const recent = energyAdjustmentsRef.current.filter((ts) => now - ts <= windowMs);
      recent.push(now);
      energyAdjustmentsRef.current = recent;
      const unstableNow = recent.length >= 5;
      isEnergySelectionUnstableRef.current = unstableNow;
      if (unstableNow && !unstableEventTrackedRef.current) {
        recordFlowEvent("pulse_energy_unstable", {
          meta: { changes: recent.length, windowMs, step }
        });
        unstableEventTrackedRef.current = true;
      }
      if (lastTrackedEnergyRef.current !== next || now - energyChangeLastTrackedAtRef.current > 150) {
        recordFlowEvent("pulse_energy_changed", {
          meta: { energy: next, step }
        });
        lastTrackedEnergyRef.current = next;
        energyChangeLastTrackedAtRef.current = now;
      }
    }
    setEnergy(next);
    setHasPickedEnergy(true);
    setNeedsEnergyConfirmation(false);
    setImmediateActionApplied(false);
    if (!options?.skipHaptic && next !== energy) {
      triggerSoftHaptic();
    }
    if (ENERGY_FEEDBACK_POINTS.has(next) && lastFeedbackAnchorRef.current !== next) {
      lastFeedbackAnchorRef.current = next;
      pulseAtAnchor();
    } else if (!ENERGY_FEEDBACK_POINTS.has(next)) {
      lastFeedbackAnchorRef.current = null;
    }
    if (showRequiredHint) setShowRequiredHint(false);
  };

  const snapToInteger = () => {
    if (energy == null) return;
    const rounded = Math.round(energy);
    if (rounded !== energy) {
      setEnergyValue(rounded, { skipHaptic: true });
    }
  };

  const handleEnergyKeyUp = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    snapToInteger();
    const key = e?.key ?? "";
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(key)) return;
    setKeyboardEnergyHint(energy == null ? 0 : Math.round(energy));
    if (keyboardHintTimerRef.current != null) window.clearTimeout(keyboardHintTimerRef.current);
    keyboardHintTimerRef.current = window.setTimeout(() => {
      setKeyboardEnergyHint(null);
      keyboardHintTimerRef.current = null;
    }, 900);
  };

  // Scroll to top when step changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  }, [step, isOpen]);

  const stepLabel = step === 1 ? "سجّل حالتك الحالية" : "النصيحة المقترحة";
  const footerHintText = showRequiredHint && !currentStepComplete
    ? "محتاج تختار الطاقة والمزاج واتجاهك الحالي على الأقل."
    : "راجع حالتك وبعدين اضغط تنفيذ.";
  const footerHintColor = showRequiredHint && !currentStepComplete ? "rgba(248, 113, 113, 0.95)" : "var(--text-muted)";
  const isPrimaryEnabled = step === 2 || isComplete;
  const primaryCtaClassName = isPrimaryEnabled
    ? "bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 text-slate-950 shadow-[0_0_28px_rgba(52,211,153,0.48)] hover:shadow-[0_0_38px_rgba(45,212,191,0.62)] border border-emerald-200/30"
    : "bg-white/[0.03] text-white/[0.12] cursor-not-allowed opacity-45 border border-white/10";

  const totalSteps = 2;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <div
            className="absolute inset-0"
            style={{
              background: `${energyGradient(energy)}, radial-gradient(ellipse at 20% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(45, 212, 191, 0.06) 0%, transparent 45%), var(--space-void, #0a0a1a)`,
              transition: "background 0.8s ease"
            }}
            onClick={() => handleClose("backdrop")}
          />
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{ background: "rgba(255, 255, 255, 0.3)", top: `${15 + i * 14}%`, left: `${10 + (i * 17) % 80}%`, willChange: "transform, opacity" }}
                animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.5, 1] }}
                transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
              />
            ))}
          </div>
          <motion.div
            className="pulse-check-shell relative z-10 w-[calc(100%-0.9rem)] max-w-md max-h-[min(98dvh,740px)] overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: "rgba(15, 20, 50, 0.7)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "1.5rem"
            }}
          >
            {isSavingPulse && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none" role="status" aria-live="polite">
                <div className="rounded-full px-3 py-1 text-[11px] font-semibold" style={{ color: "var(--text-primary)", background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.45)", boxShadow: "0 8px 24px rgba(16,185,129,0.2)" }}>
                  {saveToastText}
                </div>
              </div>
            )}
            <div className="pulse-check-header flex items-center justify-between p-3.5 sm:p-4">
              <motion.div custom={0} variants={cosmicUp} initial="hidden" animate="visible">
                <h2 className="text-base sm:text-lg font-bold" style={{ color: "var(--text-primary)", letterSpacing: "0.04em" }}>{"فحص حالتك"}</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{`خطوة ${step} من ${totalSteps} \u2022 ${stepLabel}`}</p>
              </motion.div>
              {allowSkip && (
                <button type="button" onClick={requestSkipClose} className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer" style={{ color: "var(--text-muted)", background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  {"تخطي اليوم"}
                </button>
              )}
            </div>
            {showSkipConfirm && (
              <div className="mx-3.5 sm:mx-4 -mt-1 mb-1 rounded-xl px-3 py-2" style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.35)" }} onClick={(e) => e.stopPropagation()}>
                <p className="text-xs font-semibold text-center" style={{ color: "rgba(255,236,179,0.98)" }}>
                  تريد تخطي فحص حالتك النهاردة؟
                </p>
                <div className="flex gap-2 justify-center mt-2">
                  <button onClick={confirmSkipClose} className="px-3 py-1 bg-amber-500/20 rounded-lg text-[10px] hover:bg-amber-500/30 transition-colors">أيوا</button>
                  <button onClick={() => setShowSkipConfirm(false)} className="px-3 py-1 bg-white/5 rounded-lg text-[10px] hover:bg-white/10 transition-colors">لا</button>
                </div>
              </div>
            )}
            <div
              ref={contentRef}
              className="pulse-check-content flex-1 overflow-y-auto px-4 sm:px-5 pb-3 sm:pb-4 pt-1 custom-scrollbar"
              style={{ scrollPaddingTop: "1rem", scrollBehavior: "smooth" }}
            >
              {step === 1 && (
                <Step1View
                  energy={energy}
                  energyStateLabel={energyStateLabel}
                  setEnergyValue={setEnergyValue}
                  handleEnergyKeyUp={handleEnergyKeyUp}
                  mood={mood}
                  setMoodValue={setMoodValue}
                  focus={focus}
                  setFocusValue={setFocusValue}
                  isStartRecovery={isStartRecovery}
                  topics={topics}
                  setTopics={setTopics}
                  notes={notes}
                  setNotes={setNotes}
                  notesRef={notesRef}
                />
              )}
              {step === 2 && tacticalAdvice && <Step2View tacticalAdvice={tacticalAdvice} />}
              <AnalysisOverlay isAnalyzing={isAnalyzing} />
            </div>
            <div className="p-5 border-t border-white/5 space-y-4">
              <p className="text-center text-[10px] font-bold h-4" style={{ color: footerHintColor }}>{footerHintText}</p>
              <p className={`text-center text-[10px] font-black tracking-[0.14em] uppercase ${isPrimaryEnabled ? "text-emerald-300" : "text-rose-300/70"}`}>
                {isPrimaryEnabled ? "جاهز للتنفيذ" : "اختار الطاقة + المزاج + اتجاهك الحالي"}
              </p>
              <div className="flex gap-3">
                {step > 1 && (
                  <button onClick={handlePreviousStep} className="flex-1 py-4 rounded-2xl bg-white/[0.03] text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all border border-white/5">رجع</button>
                )}
                <motion.button
                  onClick={step === 1 ? handleNextStep : handleSubmit}
                  disabled={step === 1 && !isComplete}
                  className={`flex-[2] py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${primaryCtaClassName}`}
                  whileTap={!isPrimaryEnabled ? {} : { scale: 0.98 }}
                  animate={!isPrimaryEnabled ? {} : { boxShadow: ["0 0 20px rgba(45,212,191,0.35)", "0 0 36px rgba(16,185,129,0.62)", "0 0 20px rgba(45,212,191,0.35)"] }}
                  transition={!isPrimaryEnabled ? {} : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  {step === 1 ? "تحليل البيانات" : "اعتماد النصيحة"}
                </motion.button>
              </div>
            </div>
            <WarpVelocityEffect isWarping={isWarping} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
