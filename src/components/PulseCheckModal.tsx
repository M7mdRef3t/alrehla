import type { FC, KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag } from "lucide-react";
import type { PulseEnergyConfidence, PulseFocus, PulseMood } from "../state/pulseState";
import { usePulseState } from "../state/pulseState";
import { useAdminState, isFeatureAllowed, type PulseCopyOverrideValue } from "../state/adminState";
import { recordFlowEvent } from "../services/journeyTracking";
import {
  getEnergySuggestion,
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
    topics?: string[];
    auto?: boolean;
    notes?: string;
    energyReasons?: string[];
    energyConfidence?: PulseEnergyConfidence;
  }) => void;
  onClose: (reason?: "backdrop" | "close_button") => void;
}

const TOPIC_OPTIONS = [
  { id: "work", label: "العمل" },
  { id: "family", label: "العائلة" },
  { id: "relationships", label: "العلاقات" },
  { id: "health", label: "الصحة" },
  { id: "finance", label: "المال" },
  { id: "future", label: "المستقبل" }
];

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
  { id: "event", labelKey: "event" },      // اشتبا دا
  { id: "thought", labelKey: "thought" },  // تف رادار
  { id: "body", labelKey: "body" },        // صاة اأظة
  { id: "none", labelKey: "none_new" }     // استطاع استراتج
];

const FOCUS_LABELS: Record<string, string> = {
  event: "اشتبا دا",
  thought: "تف رادار",
  body: "صاة اأظة",
  none_returning: "تفذ اخطة",
  none_new: "استطاع استراتج"
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

function getFocusQuickHint(focus: PulseFocus | null, isStartRecovery: boolean): string {
  if (!focus) return "حدد ع اعة ات تد تفذا اآ";
  if (focus === "event") return "تحدد إحداثات ااشتبا تح اثغرات.";
  if (focus === "thought") return "تج ارادار تف اظة افرة اعادة.";
  if (focus === "body") return "إاف اعات ؤتا صاة ارد اظا ابد.";
  return isStartRecovery
    ? "تح خرطة ااستطاع.. ابحث ع احة خف ازف."
    : "ت استعادة باات اجسة..  تفذ اة.";
}


type PulseDraft = {
  energy: number | null;
  previousEnergy: number | null;
  hasPickedEnergy: boolean;
  mood: PulseMood | null;
  focus: PulseFocus | null;
  topics: string[];
  notes: string;
  energyReasons: string[];
  energyConfidence: PulseEnergyConfidence | null;
  step: 1 | 2;
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


type TacticalAdvice = {
  title: string;
  message: string;
  action: string;
  theme: "attack" | "defend" | "recover";
  icon: string;
};

function generateTacticalAdvice(energy: number, mood: PulseMood | null, focus: PulseFocus | null): TacticalAdvice {
  // 1. Maintenance Protocol (صاة اأظة)
  if (focus === "body") {
    if (energy <= 4) {
      return {
        title: "PROTOCOL: SYSTEM REBOOT",
        message: "حاة اجسد تستدع اإاف اإجبار. ااسترار ف اعات ؤد استزاف .",
        action: "ابدأ دت تفس فرا افص ارادار.",
        theme: "recover",
        icon: ""
      };
    }
    return {
      title: "PROTOCOL: MAINTENANCE",
      message: "اأظة سترة ا تحتاج عارة بسطة حفاظ ع اأداء اعا.",
      action: "تر تدد سرع أ شرب اء.",
      theme: "recover",
      icon: ""
    };
  }

  // 2. Engagement Protocol (اشتبا دا)
  if (focus === "event") {
    if (energy <= 4) {
      return {
        title: "PROTOCOL: DEFENSIVE SHIELD",
        message: "حاة ااشتبا بطاة خفضة  خطة فاشة. اسحب خط ادفاع اأ.",
        action: "تجب أ اجة تف ع تح اف اآ.",
        theme: "defend",
        icon: "️"
      };
    }
    return {
      title: "PROTOCOL: TACTICAL ENGAGEMENT",
      message: "ادف رصد اطاة افة. استخد 'ابادئ اأ' تف اف.",
      action: "ابدأ بتد اثغرات اطة ف اف.",
      theme: "attack",
      icon: "️"
    };
  }

  // 3. Radar Deconstruction (تف رادار)
  if (focus === "thought") {
    return {
      title: "PROTOCOL: LOGICAL SCAN",
      message: "رصد فرة عادة تحا اخترا اع. تشغ عاج اتف.",
      action: "اسأ فس:  ذ افرة حة أ ",
      theme: "defend",
      icon: ""
    };
  }

  // 4. Strategic Recon (استطاع استراتج)
  if (energy >= 7) {
    return {
      title: "PROTOCOL: BLITZKRIEG",
      message: "جع أظة اع ف حاة استعداد ص. ات ثا ج.",
      action: "فذ أصعب ة ف ائت اآ.",
      theme: "attack",
      icon: ""
    };
  }

  return {
    title: "PROTOCOL: STEADY PROGRESS",
    message: "استرار ف اإشارات احة.  تفذ اخطة احاة بفس ادء.",
    action: "استر ف تفذ اا ارتة.",
    theme: "defend",
    icon: ""
  };
}

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

function getFocusVariantSubtitle(_variant: CopyVariant): string {
  return "تحدد ع اعة (ع ااشتبا) ات تد تفذا اآ.";
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
  isFeatureAllowed("pulse_weekly_recommendation");
  isFeatureAllowed("pulse_immediate_action");
  isFeatureAllowed("golden_needle_enabled");
  const allowSkip = true;

  const [energy, setEnergy] = useState<number | null>(null);
  const [previousEnergy, setPreviousEnergy] = useState<number | null>(null);
  const [hasPickedEnergy, setHasPickedEnergy] = useState(false);
  const [mood, setMood] = useState<PulseMood | null>(null);
  const [focus, setFocus] = useState<PulseFocus | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [energyReasons, setEnergyReasons] = useState<string[]>([]);
  const [energyConfidence, setEnergyConfidence] = useState<PulseEnergyConfidence | null>(null);
  const [showRequiredHint, setShowRequiredHint] = useState(false);
  const [hasTrackedNotesUsage, setHasTrackedNotesUsage] = useState(false);
  const [suggestionApplied, setSuggestionApplied] = useState(false);
  const [isSavingPulse, setIsSavingPulse] = useState(false);
  const [saveToastText, setSaveToastText] = useState("\u062a\u0645 \u062d\u0641\u0638 \u062d\u0627\u0644\u062a\u0643");
  const [, setKeyboardEnergyHint] = useState<number | null>(null);
  const isEnergySelectionUnstableRef = useRef(false);
  const [needsEnergyConfirmation, setNeedsEnergyConfirmation] = useState(false);
  const [, setEnergyConfirmPulseActive] = useState(false);
  const [, setEnergyUndoSnapshot] = useState<EnergyUndoSnapshot | null>(null);
  const [, setEnergyUndoLabel] = useState<string | null>(null);
  const [immediateActionApplied, setImmediateActionApplied] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [, setNotesChars] = useState(0);
  const [isWarping, setIsWarping] = useState(false);
  const [tacticalAdvice, setTacticalAdvice] = useState<TacticalAdvice | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
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

  useEffect(() => {
    const getAngleEnergy = (e: MouseEvent): number | null => {
      if (!needleContainerRef.current) return null;
      const rect = needleContainerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height * 0.83;
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      // 0=right(-90°) 10=left(+90°): angle from top, RTL
      const angle = Math.atan2(-deltaX, -deltaY) * (180 / Math.PI);
      const clampedAngle = Math.max(-90, Math.min(90, angle));
      return (clampedAngle + 90) / 18;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isNeedleDraggingRef.current) return;
      const val = getAngleEnergy(e);
      if (val !== null) setEnergyValue(val);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isNeedleDraggingRef.current) return;
      isNeedleDraggingRef.current = false;
      const val = getAngleEnergy(e);
      if (val !== null) setEnergyValue(Math.round(val), { skipHaptic: true });
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Only activate on the needle container itself, not the range input
      if (!needleContainerRef.current) return;
      isNeedleDraggingRef.current = true;
      e.preventDefault();
      const val = getAngleEnergy(e as unknown as MouseEvent);
      if (val !== null) setEnergyValue(val);
    };

    const el = needleContainerRef.current;
    el?.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      el?.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);





  const energyStateLabel = getEnergyStateLabel(energy);
  getEnergyQuickHint(energy);
  getMoodQuickHint(mood);
  getFocusQuickHint(focus, isStartRecovery);
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

  getMoodVariantSubtitle(moodCopyVariant);
  getFocusVariantSubtitle(focusCopyVariant);

  const weeklyEnergyRecommendation = useMemo(() => getWeeklyEnergyRecommendation(pulseLogs), [pulseLogs]);
  const weeklyMoodRecommendation = useMemo(
    () => getWeeklyMoodRecommendation(pulseLogs.map((item) => ({ mood: item.mood, timestamp: item.timestamp }))),
    [pulseLogs]
  );
  Boolean(weeklyMoodRecommendation && (!mood || mood !== weeklyMoodRecommendation.mood));
  useMemo(() => getImmediateEnergyAction(energy), [energy]);
  const energySuggestion = useMemo(() => getEnergySuggestion(energy), [energy]);
  Boolean(weeklyEnergyRecommendation && (!hasPickedEnergy || energy == null || Math.abs(weeklyEnergyRecommendation.value - energy) >= 2));
  useMemo(() => { if (!energySuggestion) return ""; const hasSuggestedNote = notes.trim().includes(energySuggestion.note); return hasSuggestedNote ? "ready" : "pending"; }, [energySuggestion, notes]);
  useMemo(() => { if (pulseLogs.length === 0) return null; const sum = pulseLogs.reduce((acc, item) => acc + item.energy, 0); const avg = Math.round((sum / pulseLogs.length) * 10) / 10; return { avg, count: pulseLogs.length }; }, [pulseLogs]);
  const isComplete = hasPickedEnergy && mood !== null && focus !== null;
  const currentStepComplete = isComplete;

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

    let restored = false;
    if (typeof window !== "undefined" && !isStartRecovery) { // Don't restore draft if starting fresh recovery
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
            setTopics(Array.isArray(parsed.topics) ? parsed.topics.filter((x) => typeof x === "string") : []);
            setNotes(typeof parsed.notes === "string" ? parsed.notes : "");
            setEnergyReasons(Array.isArray(parsed.energyReasons) ? parsed.energyReasons.filter((x) => typeof x === "string") : []);
            setEnergyConfidence(parsed.energyConfidence ?? null);
            setStep(parsed.step === 2 ? 2 : 1);
            lastFeedbackAnchorRef.current = typeof parsed.energy === "number" ? parsed.energy : null;
            restored = true;
          }
        }
      } catch {
        // ignore invalid drafts
      }
    }
    if (!restored) {
      if (typeof lastEnergyValue === "number" && !isStartRecovery) { // Only pre-fill energy if NOT starting a fresh recovery
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
      setTopics([]);
      setNotes("");
      setEnergyReasons([]);
      setEnergyConfidence(null);
      setStep(1);
    }

    setInLocalStorage(PULSE_DRAFT_STORAGE_KEY, JSON.stringify({
      energy: restored ? energy : (typeof lastEnergyValue === "number" ? lastEnergyValue : null),
      hasPickedEnergy: restored ? hasPickedEnergy : (typeof lastEnergyValue === "number"),
      mood: restored ? mood : null,
      focus: restored ? focus : null,
      topics: restored ? topics : [],
      notes: restored ? notes : "",
      step: restored ? step : 1
    }));

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
  }, [isOpen, lastEnergyValue, isStartRecovery]);

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
      topics,
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
    topics,
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

  const handleTacticalAnalysis = async () => {
    if (energy === null) return;
    setIsAnalyzing(true);

    // Simulate AI Processing
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

  const _applyWeeklyRecommendation = () => {
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

  const _applyImmediateEnergyAction = () => {
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

  const _applyWeeklyMoodRecommendation = () => {
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

  const _applyNotesQuickChip = (chip: string) => {
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

  const handleEnergyKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
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

  useEffect(() => {
    if (step === 1) {
      notesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [step]);

  const stepLabel = step === 1
    ? "ترر احاة اتتة"
    : "ابرت اترح";

  const footerHintText = showRequiredHint && !currentStepComplete
    ? "طب إا باات اسح اح (اطاة ازاج) ع اعة."
    : "راجع إحداثات حات ب اضغط ع تفذ.";

  const footerHintColor = showRequiredHint && !currentStepComplete
    ? "rgba(248, 113, 113, 0.95)"
    : "var(--text-muted)";
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
                  {" ترد تخط ضبط ابصة ا"}
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSkipConfirm(false)}
                    className="rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer"
                    style={{ color: "var(--text-secondary)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)" }}
                  >
                    {"إغاء"}
                  </button>
                  <button
                    type="button"
                    onClick={confirmSkipClose}
                    className="rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer"
                    style={{ color: "var(--text-primary)", background: "rgba(248,113,113,0.18)", border: "1px solid rgba(248,113,113,0.42)" }}
                  >
                    {"ع تخط"}
                  </button>
                </div>
              </div>
            )}

            <div className="pulse-check-content flex-1 overflow-y-auto px-4 sm:px-5 pb-3 sm:pb-4 pt-1 custom-scrollbar">
              {step === 1 && (
                <motion.div className="pulse-check-section flex flex-col gap-6 py-4" custom={1} variants={cosmicUp} initial="hidden" animate="visible">

                  {/* 1. Biometric Energy (Needle) */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      ؤشر اأظة احة
                    </label>
                    <div
                      ref={needleContainerRef}
                      className="relative w-full flex flex-col items-center justify-center p-8 rounded-[2.5rem] bg-slate-950/40 border border-white/5 shadow-2xl overflow-hidden group cursor-crosshair touch-none"
                    >

                      {/* Ambient background glow */}
                      <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                      <div className="relative w-full max-w-[240px] h-32 scale-90 sm:scale-105 transition-transform duration-500">
                        <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
                          <defs>
                            <linearGradient id="needleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                              <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.8" />
                              <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
                            </linearGradient>
                            <radialGradient id="pivotGlow" cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                            </radialGradient>
                            <filter id="needleGlow" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="3" result="blur" />
                              <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                          </defs>

                          {/* Dial Ticks */}
                          {[...Array(11)].map((_, i) => {
                            const angle = ((10 - i) * 18) - 180;
                            const rad = (angle * Math.PI) / 180;
                            const r1 = 82;
                            const r2 = 90;
                            const x1 = 100 + r1 * Math.cos(rad);
                            const y1 = 100 + r1 * Math.sin(rad);
                            const x2 = 100 + r2 * Math.cos(rad);
                            const y2 = 100 + r2 * Math.sin(rad);
                            return (
                              <line
                                key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                                stroke={(energy ?? 0) >= i ? "rgba(251,191,36,0.6)" : "rgba(255,255,255,0.1)"}
                                strokeWidth="2" strokeLinecap="round"
                              />
                            );
                          })}

                          {/* Background Arc */}
                          <path d="M 10,100 A 90,90 0 0,1 190,100" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="12" strokeLinecap="round" />

                          {/* Active Filled Arc */}
                          <motion.path
                            d="M 190,100 A 90,90 0 0,0 10,100" fill="none" stroke="url(#needleGrad)" strokeWidth="12" strokeLinecap="round"
                            strokeDasharray="283"
                            initial={{ strokeDashoffset: 283 }}
                            animate={{
                              strokeDashoffset: 283 * (1 - ((energy ?? 0) / 10))
                            }}
                            transition={{
                              type: "tween",
                              ease: "linear",
                              duration: 0.05
                            }}
                            style={{ filter: energy != null && energy > 7 ? 'drop-shadow(0 0 8px rgba(251,191,36,0.3))' : 'none' }}
                          />


                          {/* Center Pivot Glow */}
                          <circle cx="100" cy="100" r="16" fill="url(#pivotGlow)" />

                          {/* The Needle - Balanced Group for Perfect Center Rotation */}
                          <motion.g
                            animate={{
                              rotate: 90 - (energy ?? 0) * 18
                            }}
                            transition={{
                              type: "tween",
                              ease: "linear",
                              duration: 0.05
                            }}
                          >

                            {/* 1. The Invisible Anchor: Forces the group's bounding box center to be exactly (100, 100) */}
                            <circle cx="100" cy="100" r="90" fill="transparent" pointerEvents="none" />

                            {/* 2. The Actual Needle */}
                            <path
                              d="M 98.5,100 L 100,10 L 101.5,100 Z"
                              fill="#fbbf24"
                              filter="url(#needleGlow)"
                            />
                          </motion.g>

                          {/* Fixed Pivot circles (No rotation for better stability) */}
                          <circle cx="100" cy="100" r="6" fill="#0f172a" stroke="#fbbf24" strokeWidth="2" />
                          <circle cx="100" cy="100" r="2" fill="#fbbf24" />
                        </svg>

                        <input
                          type="range" min={0} max={10} step={1}
                          value={Math.round(energy ?? 5)}
                          onChange={(e) => setEnergyValue(Number(e.target.value))}
                          onKeyUp={handleEnergyKeyUp}
                          className="needle-range-input absolute inset-0 w-full h-full opacity-0 z-10 appearance-none m-0 p-0"
                          tabIndex={0}
                          aria-label="ست اطاة"
                        />
                      </div>
                      <div className="text-center -mt-4 relative z-10">
                        <motion.p
                          key={energy}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-5xl font-black text-white font-mono tracking-tighter"
                        >
                          {energy !== null ? Math.round(energy) : 0}
                        </motion.p>
                        <p className="text-[10px] font-black text-amber-500 mt-1 uppercase tracking-[0.3em]">{energyStateLabel}</p>
                      </div>
                    </div>
                  </div>

                  {/* 2. interior Weather (Mood) */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--soft-teal)]/30 animate-pulse" />
                      اطس اشعر
                    </label>
                    <div className="grid grid-cols-4 gap-2.5 p-3 rounded-3xl bg-white/[0.03] border border-white/5">
                      {MOODS.map((m) => {
                        const isSelected = mood === m.id;
                        const mStyle = MOOD_COSMIC[m.id];
                        return (
                          <button
                            key={m.id} type="button" onClick={() => setMoodValue(m.id)}
                            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all"
                            style={{ background: isSelected ? `${mStyle.text}22` : 'transparent' }}
                          >
                            <span className="text-2xl" style={{ filter: isSelected ? 'none' : 'grayscale(1) opacity(0.3)' }}>{m.emoji}</span>
                            <span className={`text-[8px] font-black whitespace-nowrap ${isSelected ? 'text-white' : 'text-slate-500'}`}>{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Objective Selection (Focus) */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                      تج ابصة
                    </label>
                    <div className="grid grid-cols-2 gap-3 pb-2">
                      {FOCUS_OPTIONS.map((f) => {
                        const isSelected = focus === f.id;
                        const label = f.id === "none" ? FOCUS_LABELS["none_new"] : FOCUS_LABELS[f.labelKey];
                        const fStyle = FOCUS_COSMIC[f.id];
                        return (
                          <button
                            key={f.id} type="button" onClick={() => setFocusValue(f.id)}
                            className="relative flex flex-col items-center justify-center p-4 rounded-2xl border text-[10px] font-black transition-all"
                            style={{
                              background: isSelected ? `${fStyle.bg}44` : 'rgba(255,255,255,0.02)',
                              borderColor: isSelected ? fStyle.border : 'rgba(255,255,255,0.06)',
                              color: isSelected ? 'white' : 'rgba(255,255,255,0.3)',
                            }}
                          >
                            {isSelected && <motion.div layoutId="f-dot" className="absolute top-2 right-2 w-1 h-1 rounded-full bg-white shadow-[0_0_8px_white]" />}
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3.5. Topics (Tax) */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      مواضيع الاستنزاف (اختياري)
                    </label>
                    <div className="flex flex-wrap gap-2 pb-2">
                      {TOPIC_OPTIONS.map((t) => {
                        const isSelected = topics.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setTopics((prev) =>
                                isSelected ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                              );
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all"
                            style={{
                              background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                              borderColor: isSelected ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.06)',
                              color: isSelected ? '#818cf8' : 'rgba(255,255,255,0.4)',
                            }}
                          >
                            <Tag className="w-3 h-3" />
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Notes */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">باات اسح اإضافة</label>
                    <textarea
                      ref={notesRef} value={notes} onChange={(e) => setNotes(e.target.value)}
                      placeholder="اتب احظة ختصرة..."
                      className="w-full h-24 p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-sm text-white focus:outline-none focus:border-white/10 resize-none transition-all placeholder:text-white/10"
                    />
                  </div>

                </motion.div>
              )}

              {step === 2 && tacticalAdvice && (
                <motion.div className="pulse-check-section flex flex-col items-center justify-center text-center gap-8 py-10" custom={2} variants={cosmicUp} initial="hidden" animate="visible">
                  <div className="w-32 h-32 rounded-[2.5rem] flex items-center justify-center text-6xl relative"
                    style={{
                      background: tacticalAdvice.theme === 'attack' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                      border: `2px solid ${tacticalAdvice.theme === 'attack' ? '#34d39966' : '#fbbf2466'}`
                    }}
                  >
                    {tacticalAdvice.icon}
                    <div className="absolute inset-0 animate-pulse opacity-20 bg-current rounded-[2.5rem]" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-3xl font-black tracking-tighter text-white">{tacticalAdvice.title}</h3>
                    <p className="text-slate-400 text-base max-w-[280px] leading-relaxed mx-auto font-medium">
                      {tacticalAdvice.message}
                    </p>
                  </div>
                  <div className="w-full p-6 rounded-[2rem] bg-white/[0.03] border border-dashed border-white/10 scale-105 shadow-2xl">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 block mb-3">اتج اس اباشر</span>
                    <p className="text-xl font-black text-white leading-tight">{tacticalAdvice.action}</p>
                  </div>
                </motion.div>
              )}

              {/* Analysis Overlay */}
              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="w-12 h-12 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mb-6" />
                    <p className="text-teal-400 font-mono text-[10px] tracking-[0.5em] animate-pulse">GENERATING TACTICAL PROTOCOL</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Area */}
            <div className="p-5 border-t border-white/5 space-y-4">
              <p className="text-center text-[10px] font-bold h-4" style={{ color: footerHintColor }}>
                {footerHintText}
              </p>
              <p className={`text-center text-[10px] font-black tracking-[0.14em] uppercase ${isPrimaryEnabled ? "text-emerald-300" : "text-rose-300/70"}`}>
                {isPrimaryEnabled ? "جاز تح" : "أ اطاة + ازاج + ابصة"}
              </p>
              <div className="flex gap-3">
                {step > 1 && (
                  <button
                    onClick={handlePreviousStep}
                    className="flex-1 py-4 rounded-2xl bg-white/[0.03] text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all border border-white/5"
                  >
                    رجع
                  </button>
                )}
                <motion.button
                  onClick={step === 1 ? handleNextStep : handleSubmit}
                  disabled={step === 1 && !isComplete}
                  className={`flex-[2] py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${primaryCtaClassName}`}
                  whileTap={!isPrimaryEnabled ? {} : { scale: 0.98 }}
                  animate={!isPrimaryEnabled ? {} : { boxShadow: ["0 0 20px rgba(45,212,191,0.35)", "0 0 36px rgba(16,185,129,0.62)", "0 0 20px rgba(45,212,191,0.35)"] }}
                  transition={!isPrimaryEnabled ? {} : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  {step === 1 ? "تح اباات" : "اعتاد ابرت"}
                </motion.button>
              </div>
            </div>

            {/* Warp Velocity Effect */}
            <AnimatePresence>
              {isWarping && (
                <motion.div
                  key="warp-speed"
                  className="absolute inset-0 z-50 pointer-events-none overflow-hidden rounded-[2rem]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ background: "rgba(10, 15, 30, 0.4)", backdropFilter: "blur(2px)" }}
                >
                  <div className="relative w-full h-full">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute bg-gradient-to-b from-transparent via-teal-400 to-transparent w-[1px]"
                        style={{ left: `${12 + (i * 12)}%`, height: "100px", top: "50%" }}
                        initial={{ scaleY: 0, opacity: 0, y: -200 }}
                        animate={{ scaleY: [0, 15, 0], opacity: [0, 0.5, 0], y: ["-100%", "100%"] }}
                        transition={{ duration: 0.4, ease: "easeInOut", delay: i * 0.03 }}
                      />
                    ))}
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


