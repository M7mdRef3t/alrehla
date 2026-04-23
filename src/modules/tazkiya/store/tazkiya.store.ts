/**
 * تزكية — Tazkiya Store
 *
 * Daily emotional purification cycle: اعترف → سامح → اترك
 * Confess → Forgive → Release
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandIdbStorage } from '@/utils/idbStorage';


/* ═══════════════════════════════════════════ */
/*                 TYPES                      */
/* ═══════════════════════════════════════════ */

export type TazkiyaStep = "confess" | "forgive" | "release";

export type EmotionTag =
  | "guilt"      // ذنب
  | "anger"      // غضب
  | "sadness"    // حزن
  | "fear"       // خوف
  | "shame"      // خجل
  | "regret"     // ندم
  | "envy"       // حسد
  | "resentment"; // ضغينة

export interface TazkiyaCycle {
  id: string;
  date: string; // YYYY-MM-DD
  startedAt: number;
  completedAt?: number;

  // Step 1: اعترف
  confession: string;
  emotions: EmotionTag[];

  // Step 2: سامح
  forgiveTo: "self" | "other";
  forgiveTarget: string; // name or "نفسي"
  forgiveMessage: string;

  // Step 3: اترك
  releaseAffirmation: string;
  lightnessScore: number; // 1-5 — how light do you feel?

  isComplete: boolean;
}

export interface TazkiyaState {
  cycles: TazkiyaCycle[];
  /** Active in-progress cycle */
  activeCycle: Partial<TazkiyaCycle> | null;
  currentStep: TazkiyaStep;

  // Actions
  startCycle: () => void;
  setConfession: (text: string, emotions: EmotionTag[]) => void;
  setForgiveness: (to: "self" | "other", target: string, message: string) => void;
  setRelease: (affirmation: string, lightnessScore: number) => void;
  completeCycle: () => void;
  cancelCycle: () => void;

  // Getters
  getTodayCycle: () => TazkiyaCycle | undefined;
  getStreak: () => number;
  getTotalCycles: () => number;
  getEmotionStats: () => Record<EmotionTag, number>;
  getAverageLightness: () => number;
  getRecentCycles: (limit?: number) => TazkiyaCycle[];
}

/* ═══════════════════════════════════════════ */
/*              CONSTANTS                     */
/* ═══════════════════════════════════════════ */

export const EMOTION_META: Record<EmotionTag, { label: string; emoji: string; color: string }> = {
  guilt:      { label: "ذنب",    emoji: "😔", color: "#8b5cf6" },
  anger:      { label: "غضب",    emoji: "😤", color: "#ef4444" },
  sadness:    { label: "حزن",    emoji: "😢", color: "#3b82f6" },
  fear:       { label: "خوف",    emoji: "😰", color: "#f59e0b" },
  shame:      { label: "خجل",    emoji: "😳", color: "#ec4899" },
  regret:     { label: "ندم",    emoji: "😞", color: "#6366f1" },
  envy:       { label: "حسد",    emoji: "😒", color: "#10b981" },
  resentment: { label: "ضغينة",  emoji: "😑", color: "#f97316" },
};

export const STEP_META: Record<TazkiyaStep, { label: string; emoji: string; instruction: string; color: string }> = {
  confess: {
    label: "اعترف",
    emoji: "🪞",
    instruction: "ما الذي يثقل قلبك اليوم؟ اكتب بصدق — لا أحد يقرأ هذا غيرك.",
    color: "#a78bfa",
  },
  forgive: {
    label: "سامح",
    emoji: "🕊️",
    instruction: "من الذي تحتاج أن تسامحه — نفسك أم شخص آخر؟",
    color: "#10b981",
  },
  release: {
    label: "اترك",
    emoji: "🍃",
    instruction: "اكتب جملة واحدة تترك بها هذا الثقل. ثم تنفّس.",
    color: "#fbbf24",
  },
};

export const RELEASE_TEMPLATES = [
  "أنا أختار أن أترك هذا الثقل الآن",
  "أسامح نفسي وأمضي بخفة",
  "هذا لم يعد يعرّفني — أنا أكبر منه",
  "أتنفس النور وأُخرج الظلام",
  "ما مضى مضى — وأنا أبدأ من هنا",
];

/* ═══════════════════════════════════════════ */
/*               HELPERS                      */
/* ═══════════════════════════════════════════ */

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isSameDay(a: number, b: number): boolean {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

/* ═══════════════════════════════════════════ */
/*               STORE                        */
/* ═══════════════════════════════════════════ */

export const useTazkiyaState = create<TazkiyaState>()(
  persist(
    (set, get) => ({
      cycles: [],
      activeCycle: null,
      currentStep: "confess",

      startCycle: () => {
        set({
          activeCycle: {
            id: genId(),
            date: todayKey(),
            startedAt: Date.now(),
            confession: "",
            emotions: [],
            forgiveTo: "self",
            forgiveTarget: "",
            forgiveMessage: "",
            releaseAffirmation: "",
            lightnessScore: 3,
            isComplete: false,
          },
          currentStep: "confess",
        });
      },

      setConfession: (text, emotions) => {
        set((s) => ({
          activeCycle: s.activeCycle ? { ...s.activeCycle, confession: text, emotions } : null,
          currentStep: "forgive",
        }));
      },

      setForgiveness: (to, target, message) => {
        set((s) => ({
          activeCycle: s.activeCycle
            ? { ...s.activeCycle, forgiveTo: to, forgiveTarget: target, forgiveMessage: message }
            : null,
          currentStep: "release",
        }));
      },

      setRelease: (affirmation, lightnessScore) => {
        set((s) => ({
          activeCycle: s.activeCycle
            ? { ...s.activeCycle, releaseAffirmation: affirmation, lightnessScore }
            : null,
        }));
      },

      completeCycle: () => {
        const active = get().activeCycle;
        if (!active) return;

        const completed: TazkiyaCycle = {
          id: active.id || genId(),
          date: active.date || todayKey(),
          startedAt: active.startedAt || Date.now(),
          completedAt: Date.now(),
          confession: active.confession || "",
          emotions: active.emotions || [],
          forgiveTo: active.forgiveTo || "self",
          forgiveTarget: active.forgiveTarget || "",
          forgiveMessage: active.forgiveMessage || "",
          releaseAffirmation: active.releaseAffirmation || "",
          lightnessScore: active.lightnessScore || 3,
          isComplete: true,
        };

        set((s) => ({
          cycles: [...s.cycles, completed],
          activeCycle: null,
          currentStep: "confess",
        }));
      },

      cancelCycle: () => {
        set({ activeCycle: null, currentStep: "confess" });
      },

      // Getters
      getTodayCycle: () => {
        const today = todayKey();
        return get().cycles.find((c) => c.date === today && c.isComplete);
      },

      getStreak: () => {
        const sorted = [...get().cycles].filter((c) => c.isComplete).sort((a, b) => b.startedAt - a.startedAt);
        if (sorted.length === 0) return 0;

        let streak = 0;
        const now = Date.now();
        const latest = sorted[0]!.startedAt;
        if (!isSameDay(latest, now) && !isSameDay(latest, now - 86400000)) return 0;

        let prev = latest;
        streak = 1;

        for (let i = 1; i < sorted.length; i++) {
          const curr = sorted[i]!.startedAt;
          const prevDay = new Date(prev);
          prevDay.setDate(prevDay.getDate() - 1);
          if (isSameDay(curr, prevDay.getTime())) {
            streak++;
            prev = curr;
          } else if (!isSameDay(curr, prev)) {
            break;
          }
        }
        return streak;
      },

      getTotalCycles: () => get().cycles.filter((c) => c.isComplete).length,

      getEmotionStats: () => {
        const stats: Record<EmotionTag, number> = {
          guilt: 0, anger: 0, sadness: 0, fear: 0,
          shame: 0, regret: 0, envy: 0, resentment: 0,
        };
        get().cycles.forEach((c) => {
          c.emotions.forEach((e) => { stats[e]++; });
        });
        return stats;
      },

      getAverageLightness: () => {
        const completed = get().cycles.filter((c) => c.isComplete);
        if (completed.length === 0) return 0;
        return Math.round(
          (completed.reduce((acc, c) => acc + c.lightnessScore, 0) / completed.length) * 10
        ) / 10;
      },

      getRecentCycles: (limit = 10) => {
        return [...get().cycles]
          .filter((c) => c.isComplete)
          .sort((a, b) => b.startedAt - a.startedAt)
          .slice(0, limit);
      },
    }),
    { name: "alrehla-tazkiya", storage: zustandIdbStorage }
  )
);
