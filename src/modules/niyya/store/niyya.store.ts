/**
 * نية — Niyya Store
 *
 * Daily Intention Setting: set one clear intention each morning,
 * track commitment throughout the day, review at night.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandIdbStorage } from '@/utils/idbStorage';


/* ═══════════════════════════════════════════ */
/*                 TYPES                      */
/* ═══════════════════════════════════════════ */

export type IntentionCategory = "worship" | "growth" | "relationship" | "health" | "work" | "soul" | "gratitude";
export type CommitmentLevel = "not_started" | "partial" | "fulfilled" | "exceeded";

export interface DailyIntention {
  id: string;
  date: string; // YYYY-MM-DD
  intention: string;
  category: IntentionCategory;
  commitment: CommitmentLevel;
  reflection: string;
  isActive: boolean;
  createdAt: number;
  completedAt: number | null;
}

export interface NiyyaState {
  intentions: DailyIntention[];

  // Actions
  setTodayIntention: (data: { intention: string; category: IntentionCategory }) => void;
  updateCommitment: (id: string, level: CommitmentLevel) => void;
  addReflection: (id: string, reflection: string) => void;
  removeIntention: (id: string) => void;

  // Getters
  getToday: () => DailyIntention | null;
  getRecent: (n: number) => DailyIntention[];
  getStreak: () => number;
  getFulfilledCount: () => number;
  getCategoryBreakdown: () => { category: IntentionCategory; count: number }[];
  getCommitmentRate: () => number;
  getWeekSummary: () => { date: string; commitment: CommitmentLevel | null }[];
}

/* ═══════════════════════════════════════════ */
/*              CONSTANTS                     */
/* ═══════════════════════════════════════════ */

export const CATEGORY_META: Record<IntentionCategory, { label: string; emoji: string; color: string }> = {
  worship:      { label: "عبادة",     emoji: "🕌", color: "#8b5cf6" },
  growth:       { label: "نمو",       emoji: "🌱", color: "#10b981" },
  relationship: { label: "علاقة",     emoji: "💞", color: "#ec4899" },
  health:       { label: "صحة",       emoji: "💪", color: "#f59e0b" },
  work:         { label: "عمل",       emoji: "💼", color: "#6366f1" },
  soul:         { label: "روح",       emoji: "✨", color: "#06b6d4" },
  gratitude:    { label: "امتنان",    emoji: "🤲", color: "#14b8a6" },
};

export const COMMITMENT_META: Record<CommitmentLevel, { label: string; emoji: string; color: string }> = {
  not_started: { label: "لم أبدأ",   emoji: "⭕", color: "#64748b" },
  partial:     { label: "جزئياً",    emoji: "🟡", color: "#f59e0b" },
  fulfilled:   { label: "وفّيت",     emoji: "✅", color: "#10b981" },
  exceeded:    { label: "تجاوزت",    emoji: "🌟", color: "#8b5cf6" },
};

/* ═══════════════════════════════════════════ */
/*               STORE                        */
/* ═══════════════════════════════════════════ */

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const todayKey = () => new Date().toISOString().slice(0, 10);

export const useNiyyaState = create<NiyyaState>()(
  persist(
    (set, get) => ({
      intentions: [],

      setTodayIntention: ({ intention, category }) => {
        const today = todayKey();
        // Deactivate any existing today intention
        set((s) => ({
          intentions: s.intentions.map((i) =>
            i.date === today ? { ...i, isActive: false } : i
          ),
        }));
        const entry: DailyIntention = {
          id: genId(),
          date: today,
          intention,
          category,
          commitment: "not_started",
          reflection: "",
          isActive: true,
          createdAt: Date.now(),
          completedAt: null,
        };
        set((s) => ({ intentions: [entry, ...s.intentions].slice(0, 365) }));
      },

      updateCommitment: (id, level) =>
        set((s) => ({
          intentions: s.intentions.map((i) =>
            i.id === id
              ? {
                  ...i,
                  commitment: level,
                  completedAt: level === "fulfilled" || level === "exceeded" ? Date.now() : i.completedAt,
                }
              : i
          ),
        })),

      addReflection: (id, reflection) =>
        set((s) => ({
          intentions: s.intentions.map((i) =>
            i.id === id ? { ...i, reflection } : i
          ),
        })),

      removeIntention: (id) =>
        set((s) => ({ intentions: s.intentions.filter((i) => i.id !== id) })),

      getToday: () => {
        const today = todayKey();
        return get().intentions.find((i) => i.date === today && i.isActive) || null;
      },

      getRecent: (n) => get().intentions.slice(0, n),

      getStreak: () => {
        const intentions = get().intentions;
        if (intentions.length === 0) return 0;
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 90; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          const dayIntention = intentions.find((x) => x.date === key && x.isActive);
          if (dayIntention && (dayIntention.commitment === "fulfilled" || dayIntention.commitment === "exceeded")) {
            streak++;
          } else if (i > 0) break; // Allow today to be not yet fulfilled
          else if (i === 0 && !dayIntention) break;
        }
        return streak;
      },

      getFulfilledCount: () =>
        get().intentions.filter((i) => i.commitment === "fulfilled" || i.commitment === "exceeded").length,

      getCategoryBreakdown: () => {
        const intentions = get().intentions;
        return (Object.keys(CATEGORY_META) as IntentionCategory[])
          .map((cat) => ({ category: cat, count: intentions.filter((i) => i.category === cat).length }))
          .filter((c) => c.count > 0)
          .sort((a, b) => b.count - a.count);
      },

      getCommitmentRate: () => {
        const all = get().intentions.filter((i) => i.commitment !== "not_started");
        if (all.length === 0) return 0;
        const fulfilled = all.filter((i) => i.commitment === "fulfilled" || i.commitment === "exceeded").length;
        return Math.round((fulfilled / all.length) * 100);
      },

      getWeekSummary: () => {
        const today = new Date();
        const intentions = get().intentions;
        return Array.from({ length: 7 }, (_, i) => {
          const d = new Date(today);
          d.setDate(d.getDate() - (6 - i));
          const key = d.toISOString().slice(0, 10);
          const entry = intentions.find((x) => x.date === key && x.isActive);
          return { date: key, commitment: entry?.commitment || null };
        });
      },
    }),
    { name: "alrehla-niyya", storage: zustandIdbStorage }
  )
);
