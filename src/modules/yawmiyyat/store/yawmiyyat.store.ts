/**
 * يوميّات — Yawmiyyat Store
 *
 * Daily Timeline: unified journal entries from across the ecosystem,
 * mood snapshots, activity log, and daily reflections.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ═══════════════════════════════════════════ */
/*                 TYPES                      */
/* ═══════════════════════════════════════════ */

export type EntryType = "note" | "mood" | "gratitude" | "lesson" | "milestone" | "question" | "memory";
export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface DayEntry {
  id: string;
  type: EntryType;
  content: string;
  emoji: string;
  mood?: MoodLevel;
  tags: string[];
  createdAt: number;
  date: string; // YYYY-MM-DD
  pinned: boolean;
}

export interface DaySummary {
  date: string;
  avgMood: number;
  entryCount: number;
  dominantType: EntryType;
}

export interface YawmiyyatState {
  entries: DayEntry[];

  // Actions
  addEntry: (data: Omit<DayEntry, "id" | "createdAt" | "date" | "pinned">) => void;
  removeEntry: (id: string) => void;
  togglePin: (id: string) => void;
  updateEntry: (id: string, updates: Partial<DayEntry>) => void;

  // Getters
  getToday: () => DayEntry[];
  getByDate: (date: string) => DayEntry[];
  getPinned: () => DayEntry[];
  getByType: (type: EntryType) => DayEntry[];
  getStreak: () => number;
  getDaySummary: (date: string) => DaySummary;
  getRecentDays: (n: number) => string[];
  getTotalEntries: () => number;
}

/* ═══════════════════════════════════════════ */
/*              CONSTANTS                     */
/* ═══════════════════════════════════════════ */

export const ENTRY_TYPE_META: Record<EntryType, { label: string; emoji: string; color: string; placeholder: string }> = {
  note:      { label: "ملاحظة",   emoji: "📝", color: "#6366f1", placeholder: "ماذا يدور في بالك؟" },
  mood:      { label: "مزاج",     emoji: "🌡️", color: "#f59e0b", placeholder: "كيف تشعر الآن؟" },
  gratitude: { label: "امتنان",   emoji: "🙏", color: "#22c55e", placeholder: "ما الذي تشكره اليوم؟" },
  lesson:    { label: "درس",      emoji: "💡", color: "#8b5cf6", placeholder: "ما الذي تعلمته اليوم؟" },
  milestone: { label: "إنجاز",    emoji: "🏆", color: "#ec4899", placeholder: "ما الذي حققته اليوم؟" },
  question:  { label: "سؤال",     emoji: "❓", color: "#06b6d4", placeholder: "ما السؤال الذي يشغلك؟" },
  memory:    { label: "ذكرى",     emoji: "📸", color: "#f97316", placeholder: "لحظة تستحق الحفظ..." },
};

export const MOOD_META: Record<MoodLevel, { label: string; emoji: string; color: string }> = {
  1: { label: "سيء جداً",  emoji: "😞", color: "#ef4444" },
  2: { label: "ليس جيداً", emoji: "😕", color: "#f97316" },
  3: { label: "عادي",       emoji: "😐", color: "#f59e0b" },
  4: { label: "جيد",        emoji: "😊", color: "#22c55e" },
  5: { label: "ممتاز",      emoji: "🤩", color: "#10b981" },
};

/* ═══════════════════════════════════════════ */
/*               STORE                        */
/* ═══════════════════════════════════════════ */

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const todayKey = () => new Date().toISOString().slice(0, 10);

export const useYawmiyyatState = create<YawmiyyatState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (data) => {
        const entry: DayEntry = { ...data, id: genId(), createdAt: Date.now(), date: todayKey(), pinned: false };
        set((s) => ({ entries: [entry, ...s.entries].slice(0, 500) }));
      },

      removeEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

      togglePin: (id) => set((s) => ({
        entries: s.entries.map((e) => e.id === id ? { ...e, pinned: !e.pinned } : e),
      })),

      updateEntry: (id, updates) => set((s) => ({
        entries: s.entries.map((e) => e.id === id ? { ...e, ...updates } : e),
      })),

      getToday: () => {
        const today = todayKey();
        return get().entries.filter((e) => e.date === today);
      },

      getByDate: (date) => get().entries.filter((e) => e.date === date),

      getPinned: () => get().entries.filter((e) => e.pinned),

      getByType: (type) => get().entries.filter((e) => e.type === type),

      getStreak: () => {
        const dates = [...new Set(get().entries.map((e) => e.date))].sort().reverse();
        if (dates.length === 0) return 0;
        let streak = 0;
        const now = new Date();
        for (let i = 0; i < 365; i++) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          if (dates.includes(key)) { streak++; } else if (i > 0) { break; }
        }
        return streak;
      },

      getDaySummary: (date) => {
        const dayEntries = get().entries.filter((e) => e.date === date);
        const moods = dayEntries.filter((e) => e.mood).map((e) => e.mood!);
        const avgMood = moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : 0;
        const typeCounts: Record<string, number> = {};
        dayEntries.forEach((e) => { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1; });
        const dominantType = (Object.entries(typeCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || "note") as EntryType;
        return { date, avgMood: Math.round(avgMood * 10) / 10, entryCount: dayEntries.length, dominantType };
      },

      getRecentDays: (n) => {
        const dates = [...new Set(get().entries.map((e) => e.date))].sort().reverse();
        return dates.slice(0, n);
      },

      getTotalEntries: () => get().entries.length,
    }),
    { name: "alrehla-yawmiyyat" }
  )
);
