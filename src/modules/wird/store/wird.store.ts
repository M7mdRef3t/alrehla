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
  dailyDirective: string | null;

  addRitual: (r: Omit<Ritual, "id">) => void;
  removeRitual: (id: string) => void;
  toggleRitual: (id: string) => void;
  completeRitual: (ritualId: string) => void;
  setIntention: (text: string) => void;
  setGratitude: (text: string) => void;
  getTodayCompletion: () => DayCompletion;
  fetchAIGeneratedWird: () => Promise<void>;
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
  { id: "r_foundation_1", title: "نبضة الوعي", emoji: "💓", time: "morning", type: "pulse", enabled: true },
  { id: "r_foundation_2", title: "نية اليوم", emoji: "🎯", time: "morning", type: "intention", enabled: true },
  { id: "r_foundation_3", title: "التدوينة التأملية", emoji: "📝", time: "evening", type: "journal", enabled: true },
  { id: "r_foundation_4", title: "حصاد الشكر", emoji: "🙏", time: "evening", type: "gratitude", enabled: true },
];

export const useWirdState = create<WirdState>()(
  persist(
    (set, get) => ({
      rituals: DEFAULT_RITUALS,
      history: [],
      streak: 0,
      bestStreak: 0,
      lastCompletedDate: null,
      dailyDirective: null,

      addRitual: (r) =>
        set((s) => ({
          rituals: [...s.rituals, { ...r, id: `r_${crypto.randomUUID()}` }],
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

      fetchAIGeneratedWird: async () => {
        const key = todayKey();
        const state = get();
        // If we already have a generated directive for today (assuming generating updates the date record)
        // Wait, realistically we might just overwrite. But purely to prevent abuse:
        if (state.dailyDirective && state.lastCompletedDate === key && state.rituals.length > DEFAULT_RITUALS.length) {
          return; // Already generated today
        }

        try {
           const res = await fetch("/api/swarm/daily-state", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({
                telemetry: {
                   stability: 0.6, // Using defaults here. Ideally fetched from actual InterventionEngine/Analytics
                   interactionCount: 5,
                   recentErrors: 0
                }
             })
           });

           if (!res.ok) throw new Error("Network Response Error");
           const data = await res.json();
           
           if (data.customRituals) {
              const aiRituals = data.customRituals.map((r: any, idx: number) => ({
                 id: `r_ai_${key}_${idx}`,
                 ...r,
                 enabled: true
              }));
              set({
                 rituals: [...DEFAULT_RITUALS, ...aiRituals],
                 dailyDirective: data.dailyDirective || null
              });
           }
        } catch (err) {
           console.error("[WirdStore] Failed to fetch AI state:", err);
        }
      }
    }),
    { name: "alrehla-wird" }
  )
);
