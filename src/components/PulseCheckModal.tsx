import type { CSSProperties, FC, KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PulseEnergyConfidence, PulseFocus, PulseMood } from "../state/pulseState";
import { usePulseState } from "../state/pulseState";
import { useAdminState, isFeatureAllowed, type PulseCopyOverrideValue } from "../state/adminState";
import { energyColorHex, energyPct } from "../utils/pulseUi";
import { recordFlowEvent } from "../services/journeyTracking";
import {
  getEnergySuggestion,
  getEnergySupportLineByVariant,
  getWeeklyEnergyTrend,
  getWeeklyEnergyRecommendation,
  type EnergyCopyVariant
} from "../utils/pulseEnergy";
import { getFromLocalStorage, removeFromLocalStorage, setInLocalStorage } from "../services/browserStorage";
import { getAudioContextConstructor, setDocumentBodyOverflow } from "../services/clientDom";


interface PulseCheckModalProps {
  isOpen: boolean;
  context?: "regular" | "start_recovery";
  onSubmit: (payload: {
    energy: number | null;
    mood: PulseMood | null;
    focus: PulseFocus | null;
    auto?: boolean;
    notes?: string;
    energyReasons?: string[];
    energyConfidence?: PulseEnergyConfidence;
  }) => void;
  onClose: (reason?: "backdrop" | "close_button") => void;
}

const MOODS: Array<{ id: PulseMood; label: string; emoji: string }> = [
  { id: "bright", label: "\u0631\u0627\u064a\u0642", emoji: "\u2600\uFE0F" },
  { id: "calm", label: "\u0647\u0627\u062f\u0626", emoji: "\uD83C\uDF24\uFE0F" },
  { id: "tense", label: "\u0645\u062a\u0648\u062a\u0631", emoji: "\uD83C\uDF2A\uFE0F" },
  { id: "hopeful", label: "\u0645\u062a\u0641\u0627\u0626\u0644", emoji: "\uD83C\uDF08" },
  { id: "anxious", label: "\u0642\u0644\u0642\u0627\u0646", emoji: "\u2601\uFE0F" },
  { id: "angry", label: "\u063a\u0636\u0628\u0627\u0646", emoji: "\u26C8\uFE0F" },
  { id: "sad", label: "\u062d\u0632\u064a\u0646", emoji: "\uD83C\uDF27\uFE0F" },
  { id: "overwhelmed", label: "\u0625\u0631\u0647\u0627\u0642", emoji: "\uD83C\uDF2B\uFE0F" }
];

const FOCUS_OPTIONS: Array<{ id: PulseFocus; labelKey: "event" | "thought" | "body" | "none_new" | "none_returning" }> = [
  { id: "event", labelKey: "event" },
  { id: "thought", labelKey: "thought" },
  { id: "body", labelKey: "body" },
  { id: "none", labelKey: "none_returning" }
];

const FOCUS_LABELS: Record<string, string> = {
  event: "\u0645\u0648\u0642\u0641 \u062d\u0635\u0644",
  thought: "\u0641\u0643\u0631\u0629 \u0645\u0634 \u0628\u062a\u0631\u0648\u062d",
  body: "\u062c\u0633\u062f\u064a \u062a\u0639\u0628\u0627\u0646",
  none_returning: "\u0648\u0644\u0627 \u062d\u0627\u062c\u0629\u060c \u062c\u0627\u064a \u0623\u0643\u0645\u0644",
  none_new: "\u0648\u0644\u0627 \u062d\u0627\u062c\u0629\u060c \u062c\u0627\u064a \u0623\u0643\u062a\u0634\u0641"
};

const MOOD_COSMIC: Record<PulseMood, { bg: string; border: string; glow: string; text: string; nebula: string }> = {
  bright: { bg: "rgba(250, 204, 21, 0.1)", border: "rgba(250, 204, 21, 0.5)", glow: "0 0 25px rgba(250, 204, 21, 0.3)", text: "#facc15", nebula: "radial-gradient(circle at 50% 0%, rgba(250, 204, 21, 0.5) 0%, transparent 70%)" },
  calm: { bg: "rgba(45, 212, 191, 0.1)", border: "rgba(45, 212, 191, 0.5)", glow: "0 0 25px rgba(45, 212, 191, 0.3)", text: "#2dd4bf", nebula: "radial-gradient(circle at 50% 0%, rgba(45, 212, 191, 0.5) 0%, transparent 70%)" },
  anxious: { bg: "rgba(251, 191, 36, 0.1)", border: "rgba(251, 191, 36, 0.5)", glow: "0 0 25px rgba(251, 191, 36, 0.3)", text: "#fbbf24", nebula: "radial-gradient(circle at 50% 0%, rgba(251, 191, 36, 0.5) 0%, transparent 70%)" },
  angry: { bg: "rgba(248, 113, 113, 0.1)", border: "rgba(248, 113, 113, 0.5)", glow: "0 0 25px rgba(248, 113, 113, 0.3)", text: "#f87171", nebula: "radial-gradient(circle at 50% 0%, rgba(248, 113, 113, 0.5) 0%, transparent 70%)" },
  sad: { bg: "rgba(96, 165, 250, 0.1)", border: "rgba(96, 165, 250, 0.5)", glow: "0 0 25px rgba(96, 165, 250, 0.3)", text: "#60a5fa", nebula: "radial-gradient(circle at 50% 0%, rgba(96, 165, 250, 0.5) 0%, transparent 70%)" },
  tense: { bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.5)", glow: "0 0 25px rgba(245, 158, 11, 0.3)", text: "#f59e0b", nebula: "radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.5) 0%, transparent 70%)" },
  hopeful: { bg: "rgba(34, 197, 94, 0.1)", border: "rgba(34, 197, 94, 0.5)", glow: "0 0 25px rgba(34, 197, 94, 0.3)", text: "#22c55e", nebula: "radial-gradient(circle at 50% 0%, rgba(34, 197, 94, 0.5) 0%, transparent 70%)" },
  overwhelmed: { bg: "rgba(139, 92, 246, 0.1)", border: "rgba(139, 92, 246, 0.5)", glow: "0 0 25px rgba(139, 92, 246, 0.3)", text: "#8b5cf6", nebula: "radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.5) 0%, transparent 70%)" }
};

const FOCUS_COSMIC: Record<PulseFocus, { bg: string; border: string; text: string }> = {
  event: { bg: "rgba(45, 212, 191, 0.12)", border: "rgba(45, 212, 191, 0.3)", text: "#2dd4bf" },
  thought: { bg: "rgba(167, 139, 250, 0.12)", border: "rgba(167, 139, 250, 0.3)", text: "#a78bfa" },
  body: { bg: "rgba(248, 113, 113, 0.12)", border: "rgba(248, 113, 113, 0.3)", text: "#f87171" },
  none: { bg: "rgba(45, 212, 191, 0.08)", border: "rgba(45, 212, 191, 0.2)", text: "#2dd4bf" }
};

function energyGradient(energy: number | null): string {
  if (energy == null || energy <= 0) return "radial-gradient(ellipse at 50% 60%, rgba(148, 163, 184, 0.1) 0%, transparent 60%)";
  if (energy <= 2) return "radial-gradient(ellipse at 50% 60%, rgba(248, 113, 113, 0.12) 0%, transparent 60%)";
  if (energy <= 4) return "radial-gradient(ellipse at 50% 60%, rgba(251, 191, 36, 0.1) 0%, transparent 60%)";
  if (energy <= 6) return "radial-gradient(ellipse at 50% 60%, rgba(45, 212, 191, 0.08) 0%, transparent 55%)";
  if (energy <= 8) return "radial-gradient(ellipse at 50% 60%, rgba(45, 212, 191, 0.12) 0%, transparent 55%)";
  return "radial-gradient(ellipse at 50% 60%, rgba(45, 212, 191, 0.18) 0%, rgba(139, 92, 246, 0.06) 40%, transparent 65%)";
}

function getEnergyStateLabel(energy: number | null): string {
  if (energy == null) return "\u063a\u064a\u0631 \u0645\u062d\u062f\u062f\u0629";
  if (energy <= 2) return "\u0645\u0646\u062e\u0641\u0636\u0629 \u062c\u062f\u064b\u0627";
  if (energy <= 4) return "\u0645\u0646\u062e\u0641\u0636\u0629";
  if (energy <= 6) return "\u0645\u062a\u0648\u0633\u0637\u0629";
  if (energy <= 8) return "\u0645\u0631\u062a\u0641\u0639\u0629";
  return "\u0645\u0631\u062a\u0641\u0639\u0629 \u062c\u062f\u064b\u0627";
}



function getEnergyQuickHint(energy: number | null): string {
  if (energy == null) return "\u0627\u062e\u062a\u0631 \u0627\u0644\u062f\u0631\u062c\u0629";
  if (energy <= 2) return "\u0628\u0627\u062d\u062a\u0627\u062c \u0647\u062f\u0648\u0621";
  if (energy <= 4) return "\u0647\u0627\u062f\u064a \u0628\u0634\u0648\u064a\u0629";
  if (energy <= 6) return "\u0645\u062a\u0648\u0627\u0632\u0646";
  if (energy <= 8) return "\u062c\u0627\u0647\u0632";
  return "\u0637\u0627\u0642\u0629 \u0639\u0627\u0644\u064a\u0629";
}

function getMoodStateLabel(mood: PulseMood | null): string {
  if (!mood) return "\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u0627\u062e\u062a\u064a\u0627\u0631";
  switch (mood) {
    case "bright":
      return "\u0645\u0632\u0627\u062c \u0645\u0636\u064a\u0621";
    case "calm":
      return "\u0647\u062f\u0648\u0621 \u0645\u0633\u062a\u0642\u0631";
    case "tense":
      return "\u062a\u0648\u062a\u0631 \u0642\u0627\u0628\u0644 \u0644\u0644\u062a\u0646\u0638\u064a\u0645";
    case "hopeful":
      return "\u062f\u0627\u0641\u0639 \u0625\u064a\u062c\u0627\u0628\u064a";
    case "anxious":
      return "\u0642\u0644\u0642 \u0645\u062d\u062a\u0627\u062c \u062a\u0647\u062f\u0626\u0629";
    case "angry":
      return "\u062d\u062f\u0629 \u0645\u0634\u0627\u0639\u0631";
    case "sad":
      return "\u0637\u0627\u0642\u0629 \u0645\u0646\u062e\u0641\u0636\u0629";
    case "overwhelmed":
      return "\u062a\u0634\u0628\u0639 \u0648\u0636\u063a\u0637 \u0639\u0627\u0644\u064a";
    default:
      return "\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u0627\u062e\u062a\u064a\u0627\u0631";
  }
}

function getMoodQuickHint(mood: PulseMood | null): string {
  if (!mood) return "\u0627\u062e\u062a\u0631 \u0648\u0635\u0641\u0627\u064b \u0642\u0631\u064a\u0628\u0627\u064b \u0645\u0646 \u062d\u0627\u0644\u062a\u0643";
  switch (mood) {
    case "bright":
      return "\u0627\u0633\u062a\u063a\u0644 \u0627\u0644\u0635\u0641\u0627\u0621 \u0628\u062e\u0637\u0648\u0629 \u0645\u0628\u0627\u0634\u0631\u0629.";
    case "calm":
      return "\u0645\u0645\u062a\u0627\u0632\u060c \u0627\u062d\u0627\u0641\u0638 \u0639\u0644\u0649 \u0627\u0644\u0646\u0633\u0642 \u0627\u0644\u0647\u0627\u062f\u0626.";
    case "tense":
      return "\u0646\u0641\u0633 \u0642\u0635\u064a\u0631 \u064a\u0642\u0644\u0644 \u0627\u0644\u062a\u0648\u062a\u0631 \u0642\u0628\u0644 \u0627\u0644\u062e\u0637\u0648\u0629.";
    case "hopeful":
      return "\u062e\u0644\u0651 \u0627\u0644\u062d\u0645\u0627\u0633 \u064a\u062a\u062d\u0648\u0644 \u0644\u062a\u0646\u0641\u064a\u0630 \u0641\u0639\u0644\u064a.";
    case "anxious":
      return "\u0627\u0628\u062f\u0623 \u0628\u062e\u0637\u0648\u0629 \u0645\u0648\u0636\u062d\u0629 \u0648\u0648\u0627\u062d\u062f\u0629 \u0641\u0642\u0637.";
    case "angry":
      return "\u062d\u0648\u0651\u0644 \u0627\u0644\u0627\u0646\u062f\u0641\u0627\u0639 \u0644\u0642\u0631\u0627\u0631 \u0645\u062d\u0633\u0648\u0628.";
    case "sad":
      return "\u0627\u0633\u0645\u062d \u0628\u062e\u0637\u0648\u0629 \u0635\u063a\u064a\u0631\u0629 \u0645\u0631\u0646\u0629.";
    case "overwhelmed":
      return "\u0628\u0633\u0651\u0637 \u0627\u0644\u0645\u0634\u0647\u062f: \u062e\u064a\u0627\u0631 \u0648\u0627\u062d\u062f \u0627\u0644\u0622\u0646.";
    default:
      return "\u0627\u062e\u062a\u0631 \u0648\u0635\u0641\u0627\u064b \u0642\u0631\u064a\u0628\u0627\u064b \u0645\u0646 \u062d\u0627\u0644\u062a\u0643";
  }
}

function getFocusStateLabel(focus: PulseFocus | null, isStartRecovery: boolean): string {
  if (!focus) return "\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u0627\u062e\u062a\u064a\u0627\u0631";
  if (focus === "event") return "\u0627\u0644\u062a\u0631\u0643\u064a\u0632 \u0639\u0644\u0649 \u0645\u0648\u0642\u0641 \u0645\u062d\u062f\u062f";
  if (focus === "thought") return "\u0627\u0644\u062a\u0631\u0643\u064a\u0632 \u0639\u0644\u0649 \u0641\u0643\u0631\u0629 \u0645\u062a\u0643\u0631\u0631\u0629";
  if (focus === "body") return "\u0627\u0644\u062a\u0631\u0643\u064a\u0632 \u0639\u0644\u0649 \u0625\u0634\u0627\u0631\u0627\u062a \u0627\u0644\u062c\u0633\u062f";
  return isStartRecovery
    ? "\u0628\u062f\u0627\u064a\u0629 \u0645\u0631\u0646\u0629 \u0644\u0644\u0627\u0633\u062a\u0643\u0634\u0627\u0641"
    : "\u0639\u0648\u062f\u0629 \u0644\u0644\u0625\u0643\u0645\u0627\u0644 \u0628\u062f\u0648\u0646 \u0645\u0634\u062a\u062a\u0627\u062a";
}

function getFocusQuickHint(focus: PulseFocus | null, isStartRecovery: boolean): string {
  if (!focus) return "\u0627\u062e\u062a\u0631 \u0623\u064a\u0646 \u062a\u0631\u064a\u062f \u062a\u0648\u062c\u064a\u0647 \u0627\u0646\u062a\u0628\u0627\u0647\u0643 \u0627\u0644\u0622\u0646";
  if (focus === "event") return "\u0627\u0628\u062f\u0623 \u0628\u0648\u0635\u0641 \u0645\u0648\u0642\u0641 \u0648\u0627\u062d\u062f \u0628\u0648\u0636\u0648\u062d.";
  if (focus === "thought") return "\u062d\u062f\u062f \u0627\u0644\u0641\u0643\u0631\u0629 \u0648\u0627\u062e\u062a\u0628\u0631\u0647\u0627 \u0628\u0647\u062f\u0648\u0621.";
  if (focus === "body") return "\u0644\u0627\u062d\u0638 \u0627\u0644\u0625\u062d\u0633\u0627\u0633 \u0627\u0644\u062c\u0633\u062f\u064a \u0642\u0628\u0644 \u0623\u064a \u062e\u0637\u0648\u0629.";
  return isStartRecovery
    ? "\u062c\u064a\u062f\u060c \u0646\u0628\u062f\u0623 \u0628\u0627\u0633\u062a\u0643\u0634\u0627\u0641 \u0647\u0627\u062f\u0626."
    : "\u0645\u0645\u062a\u0627\u0632\u060c \u0643\u0645\u0651\u0644 \u0645\u0646 \u062d\u064a\u062b \u062a\u0648\u0642\u0641\u062a.";
}

type EnergyConfidence = "low" | "medium" | "high";
type PulseDraft = {
  energy: number | null;
  previousEnergy: number | null;
  hasPickedEnergy: boolean;
  mood: PulseMood | null;
  focus: PulseFocus | null;
  notes: string;
  energyReasons: string[];
  energyConfidence: EnergyConfidence | null;
  step: 1 | 2 | 3 | 4;
};

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
    ? "\u0627\u062e\u062a\u0627\u0631 \u0648\u0635\u0641 \u0642\u0631\u064a\u0628 \u0645\u0646 \u0625\u062d\u0633\u0627\u0633\u0643 \u062f\u0644\u0648\u0642\u062a\u064a."
    : "\u0645\u0632\u0627\u062c\u0643 \u0627\u0644\u062d\u0627\u0644\u064a \u0628\u064a\u0648\u0636\u062d \u0634\u0643\u0644 \u062e\u0637\u0648\u062a\u0643 \u0627\u0644\u062c\u0627\u064a\u0629.";
}

function getFocusVariantSubtitle(variant: CopyVariant): string {
  return variant === "a"
    ? "\u062d\u062f\u062f \u0627\u0643\u062a\u0631 \u062d\u0627\u062c\u0629 \u0648\u0627\u062e\u062f\u0629 \u0627\u0646\u062a\u0628\u0627\u0647\u0643 \u062f\u0644\u0648\u0642\u062a\u064a."
    : "\u0633\u0645\u064a \u0645\u0635\u062f\u0631 \u0627\u0644\u062a\u0634\u062a\u064a\u062a \u0639\u0634\u0627\u0646 \u062a\u0628\u062f\u0623 \u0628\u0648\u0636\u0648\u062d.";
}

function getPostSaveAction(energy: number): string {
  if (energy <= 3) return "\u062e\u0637\u0648\u0629 \u062a\u0627\u0644\u064a\u0629: \u062f\u0642\u064a\u0642\u062a\u064a\u0646 \u062a\u0646\u0641\u0633 \u062b\u0645 \u062e\u0637\u0648\u0629 \u0635\u063a\u064a\u0631\u0629.";
  if (energy <= 7) return "\u062e\u0637\u0648\u0629 \u062a\u0627\u0644\u064a\u0629: \u0645\u0647\u0645\u0629 \u0648\u0627\u062d\u062f\u0629 \u0644\u0645\u062f\u0629 10 \u062f\u0642\u0627\u0626\u0642.";
  return "\u062e\u0637\u0648\u0629 \u062a\u0627\u0644\u064a\u0629: \u0627\u0628\u062f\u0623 \u0623\u0648\u0644 15 \u062f\u0642\u064a\u0642\u0629 \u0627\u0644\u0622\u0646.";
}

function getImmediateEnergyAction(energy: number | null): { cta: string; hint: string } | null {
  if (energy == null) return null;
  if (energy <= 3) {
    return {
      cta: "\u0628\u062f\u0623 \u062a\u0646\u0641\u0633 \u062f\u0642\u064a\u0642\u062a\u064a\u0646",
      hint: "\u062b\u0645 \u0627\u0644\u062a\u0632\u0645 \u0628\u062e\u0637\u0648\u0629 \u0635\u063a\u064a\u0631\u0629 \u0648\u0627\u062d\u062f\u0629."
    };
  }
  if (energy <= 7) {
    return {
      cta: "\u062b\u0628\u0651\u062a \u0645\u0647\u0645\u0629 10 \u062f\u0642\u0627\u0626\u0642",
      hint: "\u0645\u0647\u0645\u0629 \u0648\u0627\u062d\u062f\u0629 \u0628\u062f\u0648\u0646 \u062a\u0634\u062a\u062a."
    };
  }
  return {
    cta: "\u0627\u0628\u062f\u0623 \u0623\u0648\u0644 15 \u062f\u0642\u064a\u0642\u0629 \u0627\u0644\u0622\u0646",
    hint: "\u0637\u0627\u0642\u0629 \u0639\u0627\u0644\u064a\u0629 \u062a\u062d\u062a\u0627\u062c \u0628\u062f\u0627\u064a\u0629 \u0633\u0631\u064a\u0639\u0629."
  };
}

const ENERGY_ANCHORS = [0, 3, 6, 10] as const;
const ENERGY_FEEDBACK_POINTS = new Set<number>(ENERGY_ANCHORS);
const ENERGY_REASON_TAGS = [
  "\u0646\u0648\u0645",
  "\u0636\u063a\u0637",
  "\u0623\u0643\u0644",
  "\u0645\u062c\u0647\u0648\u062f",
  "\u0645\u0632\u0627\u062c"
] as const;
const PULSE_DRAFT_STORAGE_KEY = "dawayir-pulse-check-draft-v1";
const NOTES_QUICK_CHIPS = [
  "\u0641\u064a \u0645\u0648\u0642\u0641 \u0645\u0639\u064a\u0646 \u0645\u0636\u0627\u064a\u0642\u0646\u064a",
  "\u0641\u0643\u0631\u0629 \u0645\u062a\u0643\u0631\u0631\u0629 \u0645\u0634 \u0631\u0627\u0636\u064a\u0629 \u062a\u0633\u064a\u0628\u0646\u064a",
  "\u062c\u0633\u0645\u064a \u062a\u0639\u0628\u0627\u0646 \u0648\u0645\u062d\u062a\u0627\u062c \u0647\u062f\u0648\u0621",
  "\u0628\u0633 \u062d\u0627\u0628\u0628 \u0623\u0641\u0636\u0641\u0636 \u0628\u062c\u0645\u0644\u0629 \u0633\u0631\u064a\u0639\u0629"
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
  const pulseWeeklyRecommendationEnabled = isFeatureAllowed("pulse_weekly_recommendation");
  const pulseImmediateActionEnabled = isFeatureAllowed("pulse_immediate_action");
  const goldenNeedleEnabled = isFeatureAllowed("golden_needle_enabled");
  const allowSkip = true;

  const [energy, setEnergy] = useState<number | null>(null);
  const [previousEnergy, setPreviousEnergy] = useState<number | null>(null);
  const [hasPickedEnergy, setHasPickedEnergy] = useState(false);
  const [mood, setMood] = useState<PulseMood | null>(null);
  const [focus, setFocus] = useState<PulseFocus | null>(null);
  const [notes, setNotes] = useState("");
  const [energyReasons, setEnergyReasons] = useState<string[]>([]);
  const [energyConfidence, setEnergyConfidence] = useState<EnergyConfidence | null>(null);
  const [showRequiredHint, setShowRequiredHint] = useState(false);
  const [hasTrackedNotesUsage, setHasTrackedNotesUsage] = useState(false);
  const [suggestionApplied, setSuggestionApplied] = useState(false);
  const [isSavingPulse, setIsSavingPulse] = useState(false);
  const [saveToastText, setSaveToastText] = useState("\u062a\u0645 \u062d\u0641\u0638 \u062d\u0627\u0644\u062a\u0643");
  const [keyboardEnergyHint, setKeyboardEnergyHint] = useState<number | null>(null);
  const [isEnergySelectionUnstable, setIsEnergySelectionUnstable] = useState(false);
  const [needsEnergyConfirmation, setNeedsEnergyConfirmation] = useState(false);
  const [energyConfirmPulseActive, setEnergyConfirmPulseActive] = useState(false);
  const [energyUndoSnapshot, setEnergyUndoSnapshot] = useState<EnergyUndoSnapshot | null>(null);
  const [energyUndoLabel, setEnergyUndoLabel] = useState<string | null>(null);
  const [immediateActionApplied, setImmediateActionApplied] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [notesChars, setNotesChars] = useState(0);
  const [isWarping, setIsWarping] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
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
  const [isMoodSelectionUnstable, setIsMoodSelectionUnstable] = useState(false);
  const [needsMoodConfirmation, setNeedsMoodConfirmation] = useState(false);
  const energyAdjustmentsRef = useRef<number[]>([]);
  const lastTrackedEnergyRef = useRef<number | null>(null);
  const energyChangeLastTrackedAtRef = useRef<number>(0);
  const unstableEventTrackedRef = useRef(false);
  const copyVariantTrackedRef = useRef(false);
  const lastEnergyValue = pulseLogs[0]?.energy ?? null;

  const fillHex = hasPickedEnergy && energy != null ? energyColorHex(energy) : "rgba(148, 163, 184, 0.85)";
  const isEnergyDefault = !hasPickedEnergy || energy == null;
  const isLowEnergyNow = hasPickedEnergy && energy != null && energy <= 3;
  const pct = hasPickedEnergy && energy != null ? energyPct(energy, { min: 0, max: 10 }) : 0;
  const energyStateLabel = getEnergyStateLabel(energy);
  const energyQuickHint = getEnergyQuickHint(energy);
  const moodQuickHint = getMoodQuickHint(mood);
  const selectedFocusLabel = focus
    ? (focus === "none"
      ? FOCUS_LABELS[isStartRecovery ? "none_new" : "none_returning"]
      : FOCUS_LABELS[focus])
    : null;
  const focusStateLabel = getFocusStateLabel(focus, isStartRecovery);
  const focusQuickHint = getFocusQuickHint(focus, isStartRecovery);
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
  const energySupportLine = getEnergySupportLineByVariant(energy, energyCopyVariant);
  const moodSubtitle = getMoodVariantSubtitle(moodCopyVariant);
  const focusSubtitle = getFocusVariantSubtitle(focusCopyVariant);
  const weeklyTrend = useMemo(() => getWeeklyEnergyTrend(pulseLogs), [pulseLogs]);
  const weeklyEnergyRecommendation = useMemo(() => getWeeklyEnergyRecommendation(pulseLogs), [pulseLogs]);
  const weeklyMoodRecommendation = useMemo(
    () => getWeeklyMoodRecommendation(pulseLogs.map((item) => ({ mood: item.mood, timestamp: item.timestamp }))),
    [pulseLogs]
  );
  const shouldOfferWeeklyMoodRecommendation = Boolean(
    weeklyMoodRecommendation && (!mood || mood !== weeklyMoodRecommendation.mood)
  );
  const immediateEnergyAction = useMemo(() => getImmediateEnergyAction(energy), [energy]);
  const energySuggestion = useMemo(() => getEnergySuggestion(energy), [energy]);
  const shouldOfferWeeklyRecommendation = Boolean(
    weeklyEnergyRecommendation && (!hasPickedEnergy || energy == null || Math.abs(weeklyEnergyRecommendation.value - energy) >= 2)
  );
  const suggestionHelperText = useMemo(() => {
    if (!energySuggestion) return "";
    const hasSuggestedNote = notes.trim().includes(energySuggestion.note);
    return hasSuggestedNote
      ? "\u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0629 \u0627\u0644\u0630\u0643\u064a\u0629 \u0645\u062e\u0632\u0646\u0629 \u0641\u0639\u0644\u064b\u0627."
      : "\u0633\u064a\u062a\u0645 \u0625\u0636\u0627\u0641\u0629 \u0645\u0644\u0627\u062d\u0638\u0629 \u062c\u0627\u0647\u0632\u0629 \u0628\u062f\u0648\u0646 \u062a\u0643\u0631\u0627\u0631.";
  }, [energySuggestion, notes]);
  const historicalEnergyAverage = useMemo(() => {
    if (pulseLogs.length === 0) return null;
    const sum = pulseLogs.reduce((acc, item) => acc + item.energy, 0);
    const avg = Math.round((sum / pulseLogs.length) * 10) / 10;
    return { avg, count: pulseLogs.length };
  }, [pulseLogs]);
  const totalSteps = 4;
  const isComplete = true;
  const currentStepComplete =
    step === 1 ? hasPickedEnergy :
      step === 2 ? mood !== null :
        step === 3 ? focus !== null :
          true;

  const clearDraft = () => {
    if (typeof window === "undefined") return;
    try {
      removeFromLocalStorage(PULSE_DRAFT_STORAGE_KEY);
    } catch {
      // no-op
    }
  };

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

  const restoreUndoSnapshot = () => {
    if (!energyUndoSnapshot) return;
    recordFlowEvent("pulse_energy_undo_applied", {
      meta: { source: energyUndoSnapshot.source }
    });
    setEnergy(energyUndoSnapshot.energy);
    setPreviousEnergy(energyUndoSnapshot.previousEnergy);
    setHasPickedEnergy(energyUndoSnapshot.hasPickedEnergy);
    setFocus(energyUndoSnapshot.focus);
    setNotes(energyUndoSnapshot.notes);
    setSuggestionApplied(energyUndoSnapshot.suggestionApplied);
    setImmediateActionApplied(energyUndoSnapshot.immediateActionApplied);
    setNeedsEnergyConfirmation(false);
    clearUndoState();
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
    if (!isOpen) return;
    let restored = false;
    if (typeof window !== "undefined") {
      try {
        const raw = getFromLocalStorage(PULSE_DRAFT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as PulseDraft;
          if (parsed && typeof parsed === "object") {
            setEnergy(typeof parsed.energy === "number" ? parsed.energy : null);
            setPreviousEnergy(typeof parsed.previousEnergy === "number" ? parsed.previousEnergy : null);
            setHasPickedEnergy(Boolean(parsed.hasPickedEnergy));
            setMood(parsed.mood ?? null);
            setFocus(parsed.focus ?? null);
            setNotes(typeof parsed.notes === "string" ? parsed.notes : "");
            setEnergyReasons(Array.isArray(parsed.energyReasons) ? parsed.energyReasons.filter((x) => typeof x === "string") : []);
            setEnergyConfidence(parsed.energyConfidence ?? null);
            setStep(parsed.step ?? 1);
            lastFeedbackAnchorRef.current = typeof parsed.energy === "number" ? parsed.energy : null;
            restored = true;
          }
        }
      } catch {
        // ignore invalid drafts
      }
    }
    if (!restored) {
      if (typeof lastEnergyValue === "number") {
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
      setEnergyReasons([]);
      setEnergyConfidence(null);
      setStep(1);
    }
    setShowRequiredHint(false);
    setHasTrackedNotesUsage(false);
    setSuggestionApplied(false);
    setIsSavingPulse(false);
    setSaveToastText("\u062a\u0645 \u062d\u0641\u0638 \u062d\u0627\u0644\u062a\u0643");
    setKeyboardEnergyHint(null);
    setIsEnergySelectionUnstable(false);
    setNeedsEnergyConfirmation(false);
    setIsMoodSelectionUnstable(false);
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
  }, [isOpen, lastEnergyValue]);

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
    if (!isOpen || typeof window === "undefined") return;
    const draft: PulseDraft = {
      energy,
      previousEnergy,
      hasPickedEnergy,
      mood,
      focus,
      notes,
      energyReasons,
      energyConfidence,
      step
    };
    try {
      setInLocalStorage(PULSE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // no-op
    }
  }, [
    isOpen,
    energy,
    previousEnergy,
    hasPickedEnergy,
    mood,
    focus,
    notes,
    energyReasons,
    energyConfidence,
    step
  ]);

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

  const handleSubmit = () => {
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
        notes: mergedNotes || undefined,
        energyReasons: energyReasons.length > 0 ? energyReasons : undefined,
        energyConfidence: energyConfidence ?? undefined
      });
      clearDraft();
      clearUndoState();
      setIsSavingPulse(false);
    }, 220);
  };

  const handleNextStep = () => {
    if (step === 1 && isEnergySelectionUnstable && !needsEnergyConfirmation) {
      setNeedsEnergyConfirmation(true);
      return;
    }
    if (step === 1 && needsEnergyConfirmation) {
      triggerEnergyConfirmPulse();
    }
    if (step === 2 && isMoodSelectionUnstable && !needsMoodConfirmation) {
      setNeedsMoodConfirmation(true);
      return;
    }
    if (step === 2 && needsMoodConfirmation) {
      setNeedsMoodConfirmation(false);
    }
    if (!currentStepComplete && !showRequiredHint) {
      setShowRequiredHint(true);
      return;
    }
    setNeedsEnergyConfirmation(false);
    setShowRequiredHint(false);
    setIsWarping(true);
    window.setTimeout(() => {
      setStep((prev) => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : prev));
      window.setTimeout(() => {
        setIsWarping(false);
      }, 500);
    }, 250);
  };

  const handlePreviousStep = () => {
    setShowRequiredHint(false);
    setNeedsEnergyConfirmation(false);
    setNeedsMoodConfirmation(false);
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : prev));
  };

  const toggleEnergyReason = (reason: string) => {
    setEnergyReasons((prev) => (
      prev.includes(reason) ? prev.filter((item) => item !== reason) : [...prev, reason]
    ));
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

  const applyWeeklyRecommendation = () => {
    if (!weeklyEnergyRecommendation) return;
    rememberUndoSnapshot(
      "\u062a\u0645 \u062a\u0637\u0628\u064a\u0642 \u0627\u0642\u062a\u0631\u0627\u062d \u0627\u0644\u0623\u0633\u0628\u0648\u0639.",
      "weekly_recommendation"
    );
    recordFlowEvent("pulse_energy_weekly_recommendation_applied", {
      meta: { value: weeklyEnergyRecommendation.value, samples: weeklyEnergyRecommendation.samples }
    });
    setEnergyValue(weeklyEnergyRecommendation.value);
    setNeedsEnergyConfirmation(false);
  };

  const applyImmediateEnergyAction = () => {
    rememberUndoSnapshot(
      "\u062a\u0645 \u062a\u0637\u0628\u064a\u0642 \u0627\u0644\u062e\u0637\u0648\u0629 \u0627\u0644\u0641\u0648\u0631\u064a\u0629.",
      "immediate_action"
    );
    applyEnergySuggestion();
    setImmediateActionApplied(true);
  };

  const setMoodValue = (nextMood: PulseMood) => {
    const now = Date.now();
    if (mood !== nextMood) {
      const windowMs = 8000;
      const recent = moodAdjustmentsRef.current.filter((ts) => now - ts <= windowMs);
      recent.push(now);
      moodAdjustmentsRef.current = recent;
      const unstableNow = recent.length >= 4;
      setIsMoodSelectionUnstable(unstableNow);
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

  const applyWeeklyMoodRecommendation = () => {
    if (!weeklyMoodRecommendation) return;
    setMoodValue(weeklyMoodRecommendation.mood);
    recordFlowEvent("pulse_mood_weekly_recommendation_applied", {
      meta: { mood: weeklyMoodRecommendation.mood, count: weeklyMoodRecommendation.count }
    });
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

  const applyNotesQuickChip = (chip: string) => {
    setNotes((prev) => {
      const trimmed = prev.trim();
      if (trimmed.includes(chip)) return prev;
      const next = trimmed.length > 0 ? `${trimmed}\n${chip}` : chip;
      if (!hasTrackedNotesUsage && next.trim().length > 0) {
        recordFlowEvent("pulse_notes_used");
        setHasTrackedNotesUsage(true);
      }
      return next;
    });
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
      // Optional enhancement only.
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
      setIsEnergySelectionUnstable(unstableNow);
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

  const snapToAnchor = () => {
    if (energy == null) return;
    const closest = ENERGY_ANCHORS.reduce((acc, n) => {
      return Math.abs(n - energy) < Math.abs(acc - energy) ? n : acc;
    }, ENERGY_ANCHORS[0]);
    if (closest === energy) {
      setEnergyValue(closest, { skipHaptic: true });
    }
  };

  const handleEnergyKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    snapToAnchor();
    const key = e?.key ?? "";
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(key)) return;
    setKeyboardEnergyHint(energy ?? 0);
    if (keyboardHintTimerRef.current != null) window.clearTimeout(keyboardHintTimerRef.current);
    keyboardHintTimerRef.current = window.setTimeout(() => {
      setKeyboardEnergyHint(null);
      keyboardHintTimerRef.current = null;
    }, 900);
  };

  useEffect(() => {
    if (step !== 4) return;
    window.setTimeout(() => {
      notesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, [step]);

  const stepLabel = step === 1
    ? "\u0645\u0624\u0634\u0631 \u0627\u0644\u0637\u0627\u0642\u0629"
    : step === 2
      ? "\u0627\u0644\u0637\u0642\u0633 \u0627\u0644\u062f\u0627\u062e\u0644\u064a"
      : step === 3
        ? "\u0627\u0644\u062a\u0631\u0643\u064a\u0632 \u0627\u0644\u062d\u0627\u0644\u064a"
        : "\u0644\u0648 \u062d\u0627\u0628\u0628 \u062a\u0634\u0631\u062d \u0623\u0643\u062a\u0631";

  const footerHintText = needsEnergyConfirmation && step === 1
    ? `\u0627\u062e\u062a\u064a\u0627\u0631\u0643 \u0643\u0627\u0646 \u0645\u062a\u0630\u0628\u0630\u0628\u064b\u0627. \u0627\u0636\u063a\u0637 \u00ab\u0627\u0644\u062a\u0627\u0644\u064a\u00bb \u0645\u0631\u0629 \u0623\u062e\u0631\u0649 \u0644\u062a\u0623\u0643\u064a\u062f \u0642\u064a\u0645\u0629 ${energy ?? 0}/10.`
    : needsMoodConfirmation && step === 2
      ? "\u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0637\u0642\u0633 \u0627\u0644\u062f\u0627\u062e\u0644\u064a \u0643\u0627\u0646 \u0645\u062a\u0630\u0628\u0630\u0628\u064b\u0627. \u0627\u0636\u063a\u0637 \u00ab\u0627\u0644\u062a\u0627\u0644\u064a\u00bb \u0645\u0631\u0629 \u062b\u0627\u0646\u064a\u0629 \u0644\u0644\u062a\u0623\u0643\u064a\u062f."
      : showRequiredHint && !currentStepComplete
        ? (step === 1
          ? "\u0645\u0637\u0644\u0648\u0628 \u0627\u062e\u062a\u064a\u0627\u0631 \u0645\u0624\u0634\u0631 \u0627\u0644\u0637\u0627\u0642\u0629 \u0642\u0628\u0644 \u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629."
          : step === 2
            ? "\u0645\u0637\u0644\u0648\u0628 \u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0637\u0642\u0633 \u0627\u0644\u062f\u0627\u062e\u0644\u064a \u0642\u0628\u0644 \u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629."
            : "\u0645\u0637\u0644\u0648\u0628 \u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u062a\u0631\u0643\u064a\u0632 \u0627\u0644\u062d\u0627\u0644\u064a \u0642\u0628\u0644 \u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629.")
        : (!currentStepComplete
          ? (step === 1
            ? "\u0627\u062e\u062a\u064e\u0631 \u0645\u0624\u0634\u0631 \u0627\u0644\u0637\u0627\u0642\u0629 \u0623\u0648\u0644\u0627\u064b."
            : step === 2
              ? "\u0627\u062e\u062a\u064e\u0631 \u0627\u0644\u0637\u0642\u0633 \u0627\u0644\u062f\u0627\u062e\u0644\u064a \u0623\u0648\u0644\u0627\u064b."
              : "\u0627\u062e\u062a\u064e\u0631 \u0627\u0644\u062a\u0631\u0643\u064a\u0632 \u0627\u0644\u062d\u0627\u0644\u064a \u0623\u0648\u0644\u0627\u064b.")
          : "\u00A0");
  const footerHintColor = needsEnergyConfirmation && step === 1
    ? "rgba(251,191,36,0.96)"
    : needsMoodConfirmation && step === 2
      ? "rgba(251,191,36,0.96)"
      : showRequiredHint && !currentStepComplete
        ? "rgba(248, 113, 113, 0.95)"
        : "var(--text-muted)";

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
                style={{ background: "rgba(255, 255, 255, 0.3)", top: `${15 + i * 14}%`, left: `${10 + (i * 17) % 80}%` }}
                animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.5, 1] }}
                transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
              />
            ))}
          </div>

          <motion.div
            data-testid="pulse-check-shell"
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
              <div
                className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <div
                  className="rounded-full px-3 py-1 text-[11px] font-semibold"
                  style={{
                    color: "var(--text-primary)",
                    background: "rgba(16, 185, 129, 0.2)",
                    border: "1px solid rgba(16, 185, 129, 0.45)",
                    boxShadow: "0 8px 24px rgba(16,185,129,0.2)"
                  }}
                >
                  {saveToastText}
                </div>
              </div>
            )}
            <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
              {isSavingPulse ? saveToastText : ""}
            </p>
            <div className="pulse-check-header flex items-center justify-between p-3.5 sm:p-4">
              <motion.div custom={0} variants={cosmicUp} initial="hidden" animate="visible">
                <h2 className="text-base sm:text-lg font-bold" style={{ color: "var(--text-primary)", letterSpacing: "0.04em" }}>
                  {"\u0636\u0628\u0637 \u0627\u0644\u0628\u0648\u0635\u0644\u0629"}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {`\u062e\u0637\u0648\u0629 ${step} \u0645\u0646 ${totalSteps} \u2022 ${stepLabel}`}
                </p>
              </motion.div>
              {allowSkip && (
                <button
                  type="button"
                  onClick={requestSkipClose}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                  style={{ color: "var(--text-muted)", background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                  aria-label={"\u062a\u062e\u0637\u064a \u0627\u0644\u064a\u0648\u0645"}
                >
                  {"\u062a\u062e\u0637\u064a \u0627\u0644\u064a\u0648\u0645"}
                </button>
              )}
            </div>
            {showSkipConfirm && (
              <div className="mx-3.5 sm:mx-4 -mt-1 mb-1 rounded-xl px-3 py-2" style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.35)" }}>
                <p className="text-xs font-semibold text-center" style={{ color: "rgba(255,236,179,0.98)" }}>
                  {"هل تريد تخطي ضبط البوصلة اليوم؟"}
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSkipConfirm(false)}
                    className="rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer"
                    style={{ color: "var(--text-secondary)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)" }}
                  >
                    {"إلغاء"}
                  </button>
                  <button
                    type="button"
                    onClick={confirmSkipClose}
                    className="rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer"
                    style={{ color: "var(--text-primary)", background: "rgba(248,113,113,0.18)", border: "1px solid rgba(248,113,113,0.42)" }}
                  >
                    {"نعم، تخطي"}
                  </button>
                </div>
              </div>
            )}

            <div className="pulse-check-content flex-1 min-h-0 overflow-hidden px-4 sm:px-5 pb-3 sm:pb-4 pt-1">
              {step === 1 && (
                <motion.div className="pulse-check-section mt-1.5 sm:mt-2.5 flex flex-col gap-2 sm:gap-2.5" custom={1} variants={cosmicUp} initial="hidden" animate="visible">
                  <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {"\u0645\u0624\u0634\u0631 \u0637\u0627\u0642\u062a\u0643"}
                  </label>
                  <div className="flex justify-center py-0.5 sm:py-3 relative">
                    {/* Outer Glow / Nebula Effect */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      animate={{
                        opacity: hasPickedEnergy && energy != null ? [0.3, 0.5, 0.3] : 0.2,
                        scale: hasPickedEnergy && energy != null ? [1, 1.15, 1] : 1
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <div
                        className="w-48 h-48 sm:w-64 sm:h-64 rounded-full blur-3xl"
                        style={{
                          background: isEnergyDefault
                            ? "radial-gradient(circle, rgba(148,163,184,0.15), transparent 70%)"
                            : `radial-gradient(circle, ${fillHex}25, transparent 70%)`
                        }}
                      />
                    </motion.div>
                    <motion.div
                      data-testid="pulse-energy-orb"
                      className="pulse-check-energy-orb relative rounded-full flex items-center justify-center w-36 h-36 sm:w-48 sm:h-48"
                      style={{
                        background: isEnergyDefault
                          ? "radial-gradient(circle at 38% 30%, rgba(255,255,255,0.3), rgba(148,163,184,0.28) 30%, rgba(148,163,184,0.12) 62%, rgba(148,163,184,0.02) 88%)"
                          : `radial-gradient(circle at 38% 30%, rgba(255,255,255,0.24), ${fillHex}66 28%, ${fillHex}1f 58%, transparent 88%)`,
                        boxShadow: isEnergyDefault
                          ? "0 0 30px rgba(148,163,184,0.28), 0 0 62px rgba(148,163,184,0.24), inset 0 0 54px rgba(148,163,184,0.2)"
                          : `0 0 ${34 + energy! * 3.4}px ${fillHex}40, 0 0 ${54 + energy! * 4}px ${fillHex}20, inset 0 0 48px ${fillHex}26`,
                        border: isEnergyDefault ? "2px solid rgba(148,163,184,0.58)" : `2px solid ${fillHex}70`
                      }}
                      animate={{
                        scale: [1, hasPickedEnergy && energy != null ? 1.085 : 1.045, 1],
                        boxShadow: [
                          isEnergyDefault
                            ? "0 0 26px rgba(148,163,184,0.24), 0 0 48px rgba(148,163,184,0.16), inset 0 0 44px rgba(148,163,184,0.16)"
                            : `0 0 ${26 + energy! * 2.2}px ${fillHex}32, 0 0 ${46 + energy! * 2.6}px ${fillHex}16, inset 0 0 42px ${fillHex}20`,
                          isEnergyDefault
                            ? "0 0 42px rgba(148,163,184,0.36), 0 0 72px rgba(148,163,184,0.26), inset 0 0 58px rgba(148,163,184,0.24)"
                            : `0 0 ${42 + energy! * 2.6}px ${fillHex}52, 0 0 ${72 + energy! * 3.2}px ${fillHex}28, inset 0 0 62px ${fillHex}2e`,
                          isEnergyDefault
                            ? "0 0 26px rgba(148,163,184,0.24), 0 0 48px rgba(148,163,184,0.16), inset 0 0 44px rgba(148,163,184,0.16)"
                            : `0 0 ${26 + energy! * 2.2}px ${fillHex}32, 0 0 ${46 + energy! * 2.6}px ${fillHex}16, inset 0 0 42px ${fillHex}20`
                        ]
                      }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {/* Inner Core Layers */}
                      {hasPickedEnergy && energy != null && energy > 0 && (
                        <>
                          {/* Rotating Corona (for high energy) */}
                          {energy >= 7 && (
                            <motion.div
                              className="absolute inset-0 rounded-full"
                              style={{
                                background: `conic-gradient(from 0deg, transparent, ${fillHex}40, transparent, ${fillHex}40, transparent)`,
                                filter: "blur(8px)"
                              }}
                              animate={{ rotate: 360 }}
                              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            />
                          )}

                          {/* Particle Sparks (for very high energy) */}
                          {energy >= 8 && (
                            <>
                              {[...Array(6)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  className="absolute w-1 h-1 rounded-full"
                                  style={{
                                    background: fillHex,
                                    boxShadow: `0 0 4px ${fillHex}`,
                                    top: "50%",
                                    left: "50%"
                                  }}
                                  animate={{
                                    x: [0, Math.cos((i * 60 * Math.PI) / 180) * 60],
                                    y: [0, Math.sin((i * 60 * Math.PI) / 180) * 60],
                                    opacity: [0.8, 0],
                                    scale: [1, 0.3]
                                  }}
                                  transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.25,
                                    ease: "easeOut"
                                  }}
                                />
                              ))}
                            </>
                          )}

                          {/* Pulsing Inner Ring (for low energy - calm) */}
                          {energy <= 3 && (
                            <motion.div
                              className="absolute inset-8 rounded-full border-2"
                              style={{
                                borderColor: `${fillHex}40`,
                                filter: "blur(2px)"
                              }}
                              animate={{
                                scale: [1, 1.1, 1],
                                opacity: [0.3, 0.6, 0.3]
                              }}
                              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            />
                          )}
                        </>
                      )}

                      {energyConfirmPulseActive && (
                        <motion.span
                          className="absolute inset-0 rounded-full pointer-events-none"
                          style={{ border: `2px solid ${fillHex}` }}
                          initial={{ scale: 1, opacity: 0.9 }}
                          animate={{ scale: 1.22, opacity: 0 }}
                          transition={{ duration: 0.55, ease: "easeOut" }}
                        />
                      )}
                      {/* Energy Number Display */}
                      <div className="flex items-center gap-2 relative z-10">
                        <span className="text-4xl sm:text-6xl font-bold leading-none" style={{ color: fillHex, textShadow: `0 0 20px ${fillHex}60` }}>
                          {hasPickedEnergy && energy != null ? energy : "-"}
                        </span>
                        {weeklyTrend && hasPickedEnergy && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{
                              color:
                                weeklyTrend.direction === "up"
                                  ? "#2dd4bf"
                                  : weeklyTrend.direction === "down"
                                    ? "#f87171"
                                    : "var(--text-secondary)",
                              background:
                                weeklyTrend.direction === "up"
                                  ? "rgba(45,212,191,0.14)"
                                  : weeklyTrend.direction === "down"
                                    ? "rgba(248,113,113,0.14)"
                                    : "rgba(148,163,184,0.14)",
                              border:
                                weeklyTrend.direction === "up"
                                  ? "1px solid rgba(45,212,191,0.35)"
                                  : weeklyTrend.direction === "down"
                                    ? "1px solid rgba(248,113,113,0.35)"
                                    : "1px solid rgba(148,163,184,0.28)"
                            }}
                          >
                            {weeklyTrend.direction === "up" ? "\u2197" : weeklyTrend.direction === "down" ? "\u2198" : "\u2192"} {weeklyTrend.label}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  </div>
                  <p className="text-center text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                    {energyStateLabel}
                  </p>
                  <p className="text-center text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    {energySupportLine}
                  </p>
                  {goldenNeedleEnabled ? (
                    <div className="relative w-full py-6 flex flex-col items-center justify-center mb-6">
                      <div className="relative w-64 h-32">
                        {/* Golden Needle Compass Visual */}
                        <svg viewBox="0 0 200 110" className="w-full h-full overflow-visible drop-shadow-2xl">
                          <defs>
                            <linearGradient id="needleTrackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.1" />
                              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.1" />
                            </linearGradient>
                            <linearGradient id="needleActiveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                              <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.8" />
                              <stop offset="100%" stopColor="#fcd34d" stopOpacity="1" />
                            </linearGradient>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                              <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>

                          {/* Background Track (Arc) */}
                          <path
                            d="M 10,100 A 90,90 0 0,1 190,100"
                            fill="none"
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="16"
                            strokeLinecap="round"
                          />

                          {/* Active Track (Animated Arc) */}
                          {hasPickedEnergy && (
                            <motion.path
                              d="M 10,100 A 90,90 0 0,1 190,100"
                              fill="none"
                              stroke="url(#needleActiveGradient)"
                              strokeWidth="16"
                              strokeLinecap="round"
                              strokeDasharray="283"
                              initial={{ strokeDashoffset: 283 }}
                              animate={{ strokeDashoffset: 283 - (283 * ((energy ?? 0) / 10)) }}
                              transition={{ type: "spring", stiffness: 50, damping: 15 }}
                              style={{ filter: "url(#glow)" }}
                            />
                          )}

                          {/* Ticks */}
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((tick) => {
                            const angle = (tick / 10) * 180 - 180; // 0 -> -180 (left), 10 -> 0 (right) ?? No, arc is 180 deg.
                            // Let's recalculate: 0 should be at 180 deg (left), 10 at 0 deg (right), 5 at -90 (top).
                            // SVG coords: Top is negative Y.
                            // 0 -> Angle 180deg (left). 10 -> Angle 0deg (right).
                            // Wait, Standard trig: 0 is right, 180 is left.
                            // SVG path goes from 10,100 (left) to 190,100 (right).
                            // So 0 energy is at 180 degrees, 10 energy is at 0 degrees.
                            const rad = ((180 - (tick / 10) * 180) * Math.PI) / 180;
                            const x1 = 100 + 78 * Math.cos(rad); // Inner radius
                            const y1 = 100 - 78 * Math.sin(rad);
                            const x2 = 100 + 96 * Math.cos(rad); // Outer radius
                            const y2 = 100 - 96 * Math.sin(rad);
                            const isAnchor = tick === 0 || tick === 3 || tick === 6 || tick === 10;
                            return (
                              <line
                                key={tick}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke={isAnchor ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)"}
                                strokeWidth={isAnchor ? 2 : 1}
                              />
                            );
                          })}

                          {/* The Golden Needle */}
                          <motion.g
                            initial={{ rotate: -180, originX: "100px", originY: "100px" }}
                            animate={{ rotate: -(180 - ((energy ?? 0) / 10) * 180), originX: "100px", originY: "100px" }}
                            transition={{ type: "spring", stiffness: 90, damping: 14 }}
                          >
                            {/* Needle Body */}
                            <path d="M 96,100 L 100,25 L 104,100 Z" fill="#fbbf24" filter="url(#glow)" />
                            {/* Center Knob */}
                            <circle cx="100" cy="100" r="8" fill="#d97706" stroke="#fbbf24" strokeWidth="2" />
                          </motion.g>
                        </svg>

                        {/* Invisible Slider overlay for interaction */}
                        <input
                          data-testid="pulse-energy-needle-input"
                          type="range"
                          min={0}
                          max={10}
                          step={1}
                          value={energy ?? 0}
                          onChange={(e) => setEnergyValue(Number(e.target.value))}
                          onPointerUp={snapToAnchor}
                          onPointerCancel={snapToAnchor}
                          onKeyUp={handleEnergyKeyUp}
                          onBlur={snapToAnchor}
                          onMouseUp={snapToAnchor}
                          onTouchEnd={snapToAnchor}
                          className="absolute -top-4 -left-4 w-[115%] h-[120%] opacity-0 cursor-pointer z-20"
                          aria-label="مؤشر البوصلة"
                        />
                      </div>

                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mt-2"
                      >
                        <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-amber-500 font-mono tracking-widest">
                          {energy ?? 0}
                        </p>
                      </motion.div>
                    </div>
                  ) : (
                    <div className="relative w-full py-1.5">
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full" style={{ background: "rgba(255, 255, 255, 0.08)" }} />
                      <div
                        className="absolute right-0 top-1/2 -translate-y-1/2 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${fillHex}80, ${fillHex})`, boxShadow: `0 0 12px ${fillHex}40` }}
                      />
                      <input
                        data-testid="pulse-energy-slider"
                        type="range"
                        min={0}
                        max={10}
                        step={1}
                        value={energy ?? 0}
                        aria-label={"\u0645\u0624\u0634\u0631 \u0627\u0644\u0637\u0627\u0642\u0629"}
                        aria-valuemin={0}
                        aria-valuemax={10}
                        aria-valuenow={energy ?? 0}
                        aria-valuetext={hasPickedEnergy && energy != null
                          ? `\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0637\u0627\u0642\u0629 ${energy} \u0645\u0646 10\u060c \u062d\u0627\u0644\u062a\u0643 ${energyStateLabel}\u060c ${energyQuickHint}.`
                          : "\u0644\u0645 \u064a\u062a\u0645 \u0627\u062e\u062a\u064a\u0627\u0631 \u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0637\u0627\u0642\u0629 \u0628\u0639\u062f. \u0627\u0633\u062a\u062e\u062f\u0645 \u0627\u0644\u0623\u0633\u0647\u0645 \u0644\u0644\u062a\u0639\u062f\u064a\u0644 \u0645\u0646 \u0635\u0641\u0631 \u0625\u0644\u0649 \u0639\u0634\u0631\u0629."}
                        aria-describedby="pulse-energy-help"
                        onChange={(e) => setEnergyValue(Number(e.target.value))}
                        onPointerUp={snapToAnchor}
                        onPointerCancel={snapToAnchor}
                        onKeyUp={handleEnergyKeyUp}
                        onBlur={snapToAnchor}
                        onMouseUp={snapToAnchor}
                        onTouchEnd={snapToAnchor}
                        className="pulse-range relative w-full"
                        style={{ accentColor: fillHex, "--pulse-fill": fillHex } as CSSProperties}
                      />
                    </div>
                  )}
                  <p id="pulse-energy-help" className="sr-only">
                    {"\u0627\u0633\u062a\u062e\u062f\u0645 \u0623\u0632\u0631\u0627\u0631 \u0627\u0644\u0623\u0633\u0647\u0645 \u0644\u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0642\u064a\u0645\u0629\u060c \u0645\u0646 \u0635\u0641\u0631 \u0625\u0644\u0649 \u0639\u0634\u0631\u0629."}
                  </p>
                  {keyboardEnergyHint != null && (
                    <p className="text-center text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                      {`\u0627\u0644\u0642\u064a\u0645\u0629: ${keyboardEnergyHint}/10`}
                    </p>
                  )}
                  <div className="flex items-center justify-between px-0.5 -mt-0.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {Array.from({ length: 11 }, (_, i) => i).map((n) => {
                      const isAnchor = n === 0 || n === 3 || n === 6 || n === 10;
                      return (
                        <span
                          key={n}
                          className={isAnchor ? "font-extrabold" : "font-medium"}
                          style={isAnchor ? { color: "var(--text-primary)", letterSpacing: "0.01em" } : undefined}
                        >
                          {n}
                        </span>
                      );
                    })}
                  </div>
                  {needsEnergyConfirmation && (
                    <p className="text-center text-[11px] font-semibold" style={{ color: "rgba(251,191,36,0.98)" }}>
                      {`\u0627\u0636\u063a\u0637 \u00ab\u0627\u0644\u062a\u0627\u0644\u064a\u00bb \u0645\u0631\u0629 \u0623\u062e\u0631\u0649 \u0644\u062a\u0623\u0643\u064a\u062f ${energy ?? 0}/10.`}
                    </p>
                  )}
                  {pulseWeeklyRecommendationEnabled && shouldOfferWeeklyRecommendation && weeklyEnergyRecommendation && (
                    <div className="flex flex-col items-center gap-1 py-0.5">
                      <button
                        type="button"
                        onClick={applyWeeklyRecommendation}
                        className="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                        style={{
                          color: "var(--text-primary)",
                          background: "rgba(59,130,246,0.16)",
                          border: "1px solid rgba(59,130,246,0.4)"
                        }}
                      >
                        {`\u0627\u0633\u062a\u062e\u062f\u0645 \u0627\u0642\u062a\u0631\u0627\u062d \u0627\u0644\u0623\u0633\u0628\u0648\u0639 ${weeklyEnergyRecommendation?.value ?? 0}/10`}
                      </button>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {`\u0645\u0628\u0646\u064a \u0639\u0644\u0649 \u0622\u062e\u0631 ${weeklyEnergyRecommendation?.samples ?? 0} \u0642\u0631\u0627\u0621\u0627\u062a.`}
                      </p>
                    </div>
                  )}
                  {pulseImmediateActionEnabled && energySuggestion && hasPickedEnergy && (
                    <div className="flex flex-col items-center gap-1 py-0.5">
                      <button
                        type="button"
                        onClick={applyImmediateEnergyAction}
                        className="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                        style={{
                          color: "var(--text-primary)",
                          background: "rgba(15, 185, 177, 0.16)",
                          border: "1px solid rgba(15, 185, 177, 0.38)"
                        }}
                      >
                        {immediateEnergyAction?.cta ?? energySuggestion?.cta ?? ""}
                      </button>
                      <p className="text-[11px]" style={{ color: suggestionApplied ? "rgba(45,212,191,0.95)" : "var(--text-muted)" }}>
                        {suggestionApplied
                          ? "\u062a\u0645 \u062a\u062c\u0647\u064a\u0632 \u062e\u0637\u0648\u062a\u0643 \u0627\u0644\u062a\u0627\u0644\u064a\u0629."
                          : immediateActionApplied
                            ? "\u0645\u0645\u062a\u0627\u0632\u060c \u0627\u0644\u0622\u0646 \u0643\u0645\u0644 \u0628\u0627\u0644\u062e\u0637\u0648\u0629 \u0627\u0644\u062a\u0627\u0644\u064a\u0629."
                            : (immediateEnergyAction?.hint ?? suggestionHelperText)}
                      </p>
                    </div>
                  )}
                  {typeof lastEnergyValue === "number" && (
                    <div className="rounded-xl px-3 py-2 text-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
                      <p className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        {`\u0622\u062e\u0631 \u0642\u0631\u0627\u0621\u0629 \u0645\u0633\u062c\u0644\u0629: ${lastEnergyValue}/10`}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {"\u0644\u0644\u0645\u0642\u0627\u0631\u0646\u0629 \u0641\u0642\u0637 \u0645\u0639 \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u064a\u0648\u0645."}
                      </p>
                    </div>
                  )}
                  {historicalEnergyAverage && historicalEnergyAverage.count >= 3 && (
                    <div className="rounded-xl px-3 py-2 text-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
                      <p className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
                        {"معدل طاقتك"}
                      </p>
                      <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                        {`${historicalEnergyAverage.avg}/10`}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {`محسوب من ${historicalEnergyAverage.count} تسجيل`}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 2 && (
                <motion.div className="pulse-check-section mt-1.5 flex flex-col gap-2.5" custom={2} variants={cosmicUp} initial="hidden" animate="visible">
                  <label className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                    {"\u0627\u0644\u0637\u0642\u0633 \u0627\u0644\u062f\u0627\u062e\u0644\u064a"}
                  </label>
                  <p className="text-[11px] -mt-1 mb-0.5" style={{ color: "var(--text-muted)", minHeight: "1rem" }}>
                    {moodSubtitle}
                  </p>
                  <div className="pulse-check-mood-grid grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {MOODS.map((item) => {
                      const isSelected = mood === item.id;
                      const mStyle = MOOD_COSMIC[item.id];
                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setMoodValue(item.id);
                          }}
                          className="group relative inline-flex min-h-[100px] flex-col items-center justify-center gap-2 px-2 py-3 rounded-2xl text-xs font-semibold transition-all overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0"
                          style={{
                            background: isSelected ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.02)",
                            border: `1px solid ${isSelected ? mStyle.border : "rgba(255, 255, 255, 0.08)"}`,
                            color: isSelected ? mStyle.text : "var(--text-secondary)",
                            boxShadow: isSelected ? mStyle.glow : "none"
                          }}
                          whileTap={{ scale: 0.96 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <div
                            className="absolute inset-0 transition-opacity duration-700 ease-out"
                            style={{
                              background: mStyle.nebula,
                              opacity: isSelected ? 0.8 : 0.15,
                              filter: isSelected ? "blur(4px)" : "blur(8px)"
                            }}
                          />
                          <motion.span
                            className="relative z-10 text-3xl drop-shadow-md"
                            animate={{ scale: isSelected ? 1.15 : 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                          >
                            {item.emoji}
                          </motion.span>
                          <span className="relative z-10 leading-tight text-center drop-shadow-sm">{item.label}</span>
                          {isSelected && (
                            <motion.div
                              layoutId="mood-selection-ring"
                              className="absolute inset-0 rounded-2xl border-2"
                              style={{ borderColor: mStyle.text }}
                              initial={false}
                              transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                  <p className="text-center text-[11px]" style={{ color: isMoodSelectionUnstable ? "rgba(251,191,36,0.95)" : "var(--text-muted)", minHeight: "1rem" }}>
                    {isMoodSelectionUnstable
                      ? "\u0627\u0644\u0627\u062e\u062a\u064a\u0627\u0631 \u0628\u064a\u0646 \u0627\u0644\u0637\u0642\u0633 \u0627\u0644\u062f\u0627\u062e\u0644\u064a \u0645\u062a\u0630\u0628\u0630\u0628\u060c \u062b\u0628\u0651\u062a \u0627\u0644\u062d\u0627\u0644\u0629 \u0627\u0644\u0623\u0642\u0631\u0628 \u0644\u0634\u0639\u0648\u0631\u0643."
                      : moodQuickHint}
                  </p>
                  {needsMoodConfirmation && (
                    <p className="text-center text-[11px] font-semibold" style={{ color: "rgba(251,191,36,0.98)" }}>
                      {"\u0627\u0636\u063a\u0637 \u00ab\u0627\u0644\u062a\u0627\u0644\u064a\u00bb \u0645\u0631\u0629 \u0623\u062e\u0631\u0649 \u0644\u062a\u0623\u0643\u064a\u062f \u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0637\u0642\u0633 \u0627\u0644\u062f\u0627\u062e\u0644\u064a."}
                    </p>
                  )}
                  {shouldOfferWeeklyMoodRecommendation && weeklyMoodRecommendation && (
                    <div className="flex flex-col items-center gap-1 py-0.5">
                      <button
                        type="button"
                        onClick={applyWeeklyMoodRecommendation}
                        className="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                        style={{
                          color: "var(--text-primary)",
                          background: "rgba(59,130,246,0.16)",
                          border: "1px solid rgba(59,130,246,0.4)"
                        }}
                      >
                        {`\u0627\u0633\u062a\u062e\u062f\u0645 \u0627\u0642\u062a\u0631\u0627\u062d \u0627\u0644\u0623\u0633\u0628\u0648\u0639: ${MOODS.find((m) => m.id === weeklyMoodRecommendation.mood)?.label ?? ""}`}
                      </button>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {`\u0645\u0628\u0646\u064a \u0639\u0644\u0649 ${weeklyMoodRecommendation.count} \u0642\u0631\u0627\u0621\u0629 \u0645\u0624\u062e\u0631\u0629.`}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 3 && (
                <motion.div className="pulse-check-section mt-1.5 flex flex-col gap-2.5" custom={3} variants={cosmicUp} initial="hidden" animate="visible">
                  <label className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                    {"\u0627\u0644\u062a\u0631\u0643\u064a\u0632 \u0627\u0644\u062d\u0627\u0644\u064a"}
                  </label>
                  <p className="text-[11px] -mt-1 mb-0.5" style={{ color: "var(--text-muted)", minHeight: "1rem" }}>
                    {focusSubtitle}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {FOCUS_OPTIONS.map((item) => {
                      const isSelected = focus === item.id;
                      const label = item.id === "none"
                        ? FOCUS_LABELS[isStartRecovery ? "none_new" : "none_returning"]
                        : FOCUS_LABELS[item.labelKey];
                      const fStyle = FOCUS_COSMIC[item.id];
                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setFocusValue(item.id);
                          }}
                          className="min-h-[74px] px-2 py-2.5 rounded-xl text-xs font-semibold transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0"
                          style={{
                            background: isSelected ? fStyle.bg : "rgba(255, 255, 255, 0.04)",
                            border: `1px solid ${isSelected ? fStyle.border : "rgba(255, 255, 255, 0.12)"}`,
                            color: isSelected ? fStyle.text : "var(--text-secondary)",
                            boxShadow: isSelected ? "0 10px 24px rgba(15,23,42,0.22)" : "0 4px 14px rgba(2,6,23,0.14)"
                          }}
                          whileTap={{ scale: 0.96 }}
                        >
                          {label}
                        </motion.button>
                      );
                    })}
                  </div>
                  <p className="text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {focusQuickHint}
                  </p>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div className="pulse-check-section mt-1.5 flex flex-col gap-2.5" custom={4} variants={cosmicUp} initial="hidden" animate="visible">
                  <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {"\u0644\u0648 \u062d\u0627\u0628\u0628 \u062a\u0634\u0631\u062d \u0623\u0643\u062a\u0631"}
                  </label>
                  <div className="rounded-xl px-3 py-2 text-center" style={{ background: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.22)" }}>
                    <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                      {notesChars > 0 ? "\u062a\u0645 \u0627\u0644\u062a\u0633\u062c\u064a\u0644 \u0628\u0646\u062c\u0627\u062d" : "\u0627\u0644\u0643\u062a\u0627\u0628\u0629 \u0647\u0646\u0627 \u062a\u0633\u0627\u0639\u062f\u0643 \u062a\u0634\u0648\u0641 \u0635\u0648\u0631\u0629 \u0623\u0648\u0636\u062d"}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {notesChars > 0 ? `\u062a\u0645 \u0643\u062a\u0627\u0628\u0629 ${notesChars} \u062d\u0631\u0641.` : "\u062c\u0645\u0644\u0629 \u0648\u0627\u062d\u062f\u0629 \u0643\u0641\u0627\u064a\u0629 \u0644\u0628\u062f\u0627\u064a\u0629 \u062c\u064a\u062f\u0629."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {NOTES_QUICK_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          recordFlowEvent("pulse_notes_quick_chip_applied", { meta: { chip } });
                          applyNotesQuickChip(chip);
                        }}
                        className="rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
                        style={{
                          color: "var(--text-secondary)",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.12)"
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                  <textarea
                    ref={notesRef}
                    rows={4}
                    value={notes}
                    onFocus={(e) => {
                      window.setTimeout(() => {
                        e.currentTarget.scrollIntoView({ behavior: "smooth", block: "center" });
                      }, 120);
                    }}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNotes(value);
                      if (!hasTrackedNotesUsage && value.trim().length > 0) {
                        recordFlowEvent("pulse_notes_used");
                        setHasTrackedNotesUsage(true);
                      }
                    }}
                    placeholder={"\u0627\u0643\u062a\u0628 \u062c\u0645\u0644\u0629 \u0623\u0648 \u0645\u0648\u0642\u0641: \u0623\u0646\u0627 \u0645\u062e\u0646\u0648\u0642 \u0639\u0634\u0627\u0646 \u062d\u0635\u0644 \u0643\u0630\u0627..."}
                    className="w-full rounded-xl px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/30 focus-visible:ring-offset-0 resize-y min-h-[108px] max-h-44 overflow-auto"
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "var(--text-primary)",
                      letterSpacing: "0.02em"
                    }}
                  />
                </motion.div>
              )}
            </div>

            <div
              data-testid="pulse-footer"
              className="px-4 sm:px-5 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
              style={{
                background: "linear-gradient(180deg, rgba(15,20,50,0.12) 0%, rgba(15,20,50,0.92) 36%, rgba(15,20,50,0.98) 100%)",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(8px)"
              }}
            >
              <p className="text-xs mb-2 text-center" style={{ color: footerHintColor, minHeight: "1rem" }}>
                {footerHintText}
              </p>

              <div className="flex items-center gap-2">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="rounded-xl px-3 py-2 text-sm font-semibold"
                    style={{ color: "var(--text-secondary)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}
                  >
                    {"\u0631\u062c\u0648\u0639"}
                  </button>
                )}
                <motion.button
                  data-testid="pulse-primary-action"
                  type="button"
                  onClick={step < 4 ? handleNextStep : handleSubmit}
                  aria-disabled={step < 4 ? !currentStepComplete : !isComplete}
                  className={`w-full cta-primary py-2.5 text-sm font-semibold cosmic-shimmer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40 focus-visible:ring-offset-0 ${(step < 4 ? currentStepComplete : isComplete) ? "" : "opacity-80"}`}
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {step < 4 ? "\u0627\u0644\u062a\u0627\u0644\u064a" : (isSavingPulse ? "\u062a\u0645 \u0627\u0644\u062d\u0641\u0638" : "\u0627\u062d\u0641\u0638 \u062d\u0627\u0644\u062a\u0643")}
                </motion.button>
              </div>
            </div>
            {/* Warp Speed Effect */}
            <AnimatePresence>
              {isWarping && (
                <motion.div
                  key="warp-speed"
                  className="absolute inset-0 z-50 pointer-events-none overflow-hidden rounded-[1.5rem]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ background: "rgba(11, 15, 40, 0.4)", backdropFilter: "blur(2px)" }}
                >
                  <div className="relative w-full h-full">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute bg-gradient-to-b from-transparent via-teal-200 to-transparent w-[1px]"
                        style={{
                          left: `${5 + (i * 8)}%`,
                          height: "60px",
                          top: "50%",
                          filter: "blur(0.5px)"
                        }}
                        initial={{ scaleY: 0, opacity: 0, y: -200 }}
                        animate={{
                          scaleY: [0, 20, 0],
                          opacity: [0, 0.8, 0],
                          y: ["-100%", "100%"]
                        }}
                        transition={{
                          duration: 0.5,
                          ease: "easeInOut",
                          delay: i * 0.02
                        }}
                      />
                    ))}
                    <motion.div
                      className="absolute inset-0 bg-white"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.1, 0] }}
                      transition={{ duration: 0.3, times: [0, 0.5, 1] }}
                      style={{ mixBlendMode: "overlay" }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};









