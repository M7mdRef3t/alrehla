/**
 * وِرد Store — Wird: Daily Rituals
 *
 * Persists daily rituals, streak, and completion history.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Ritual {
  id: string;
  title: string;
  emoji: string;
  time: "morning" | "evening" | "anytime";
  type: "pulse" | "journal" | "action" | "gratitude" | "intention";
  enabled: boolean;
}

export interface DayCompletion {
  dateKey: string; // YYYY-MM-DD
  completedRituals: string[]; // ritual IDs
  morningDone: boolean;
  eveningDone: boolean;
  intention: string;
  gratitude: string;
}

interface WirdState {
  rituals: Ritual[];
  history: DayCompletion[];
  streak: number;
  bestStreak: number;
  lastCompletedDate: string | null;

  addRitual: (r: Omit<Ritual, "id">) => void;
  removeRitual: (id: string) => void;
  toggleRitual: (id: string) => void;
  completeRitual: (ritualId: string) => void;
  setIntention: (text: string) => void;
  setGratitude: (text: string) => void;
  getTodayCompletion: () => DayCompletion;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DEFAULT_RITUALS: Ritual[] = [
  { id: "r1", title: "نبضة صباحية", emoji: "💓", time: "morning", type: "pulse", enabled: true },
  { id: "r2", title: "نية اليوم", emoji: "🎯", time: "morning", type: "intention", enabled: true },
  { id: "r3", title: "فعل صغير نحو هدفي", emoji: "⚡", time: "anytime", type: "action", enabled: true },
  { id: "r4", title: "لحظة تأمل", emoji: "🧘", time: "anytime", type: "action", enabled: true },
  { id: "r5", title: "تدوينة مسائية", emoji: "📝", time: "evening", type: "journal", enabled: true },
  { id: "r6", title: "شكر اليوم", emoji: "🙏", time: "evening", type: "gratitude", enabled: true },
];

export const useWirdState = create<WirdState>()(
  persist(
    (set, get) => ({
      rituals: DEFAULT_RITUALS,
      history: [],
      streak: 0,
      bestStreak: 0,
      lastCompletedDate: null,

      addRitual: (r) =>
        set((s) => ({
          rituals: [...s.rituals, { ...r, id: `r_${Date.now()}` }],
        })),

      removeRitual: (id) =>
        set((s) => ({ rituals: s.rituals.filter((r) => r.id !== id) })),

      toggleRitual: (id) =>
        set((s) => ({
          rituals: s.rituals.map((r) =>
            r.id === id ? { ...r, enabled: !r.enabled } : r
          ),
        })),

      completeRitual: (ritualId) => {
        const key = todayKey();
        set((s) => {
          const existing = s.history.find((h) => h.dateKey === key);
          const enabledRituals = s.rituals.filter((r) => r.enabled);

          let newHistory: DayCompletion[];
          if (existing) {
            if (existing.completedRituals.includes(ritualId)) return s;
            const updated = {
              ...existing,
              completedRituals: [...existing.completedRituals, ritualId],
            };
            // Check morning/evening completion
            const morningRituals = enabledRituals.filter((r) => r.time === "morning").map((r) => r.id);
            const eveningRituals = enabledRituals.filter((r) => r.time === "evening").map((r) => r.id);
            updated.morningDone = morningRituals.every((id) => updated.completedRituals.includes(id));
            updated.eveningDone = eveningRituals.every((id) => updated.completedRituals.includes(id));
            newHistory = s.history.map((h) => (h.dateKey === key ? updated : h));
          } else {
            newHistory = [
              ...s.history,
              { dateKey: key, completedRituals: [ritualId], morningDone: false, eveningDone: false, intention: "", gratitude: "" },
            ];
          }

          // Check full day completion for streak
          const todayEntry = newHistory.find((h) => h.dateKey === key)!;
          const allDone = enabledRituals.every((r) => todayEntry.completedRituals.includes(r.id));

          let newStreak = s.streak;
          let newBest = s.bestStreak;
          let newLastDate = s.lastCompletedDate;

          if (allDone && s.lastCompletedDate !== key) {
            if (s.lastCompletedDate === yesterdayKey()) {
              newStreak = s.streak + 1;
            } else if (!s.lastCompletedDate) {
              newStreak = 1;
            } else {
              newStreak = 1;
            }
            newLastDate = key;
            newBest = Math.max(newBest, newStreak);
          }

          return { history: newHistory, streak: newStreak, bestStreak: newBest, lastCompletedDate: newLastDate };
        });
      },

      setIntention: (text) => {
        const key = todayKey();
        set((s) => {
          const existing = s.history.find((h) => h.dateKey === key);
          if (existing) {
            return { history: s.history.map((h) => (h.dateKey === key ? { ...h, intention: text } : h)) };
          }
          return { history: [...s.history, { dateKey: key, completedRituals: [], morningDone: false, eveningDone: false, intention: text, gratitude: "" }] };
        });
      },

      setGratitude: (text) => {
        const key = todayKey();
        set((s) => {
          const existing = s.history.find((h) => h.dateKey === key);
          if (existing) {
            return { history: s.history.map((h) => (h.dateKey === key ? { ...h, gratitude: text } : h)) };
          }
          return { history: [...s.history, { dateKey: key, completedRituals: [], morningDone: false, eveningDone: false, intention: "", gratitude: text }] };
        });
      },

      getTodayCompletion: () => {
        const key = todayKey();
        const entry = get().history.find((h) => h.dateKey === key);
        return entry ?? { dateKey: key, completedRituals: [], morningDone: false, eveningDone: false, intention: "", gratitude: "" };
      },
    }),
    { name: "alrehla-wird" }
  )
);
