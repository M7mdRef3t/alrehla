/**
 * أثر — Athar Store
 *
 * Life Impact Log: auto-collects actions from the ecosystem into a personal timeline.
 * Each entry = one meaningful action the user took during their journey.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ═══════════════════════════════════════════ */
/*                 TYPES                      */
/* ═══════════════════════════════════════════ */

export type ImpactCategory =
  | "purification"  // تزكية
  | "repair"        // جسر
  | "message"       // رسالة
  | "stillness"     // خلوة
  | "challenge"     // ورشة
  | "wisdom"        // كنز
  | "habit"         // بذرة
  | "pledge"        // ميثاق
  | "milestone"     // شهادة
  | "reflection"    // تأمل شخصي
  | "manual";       // يدوي

export interface ImpactEntry {
  id: string;
  content: string;
  category: ImpactCategory;
  emoji: string;
  timestamp: number;
  isStarred: boolean;
  meta?: Record<string, unknown>;
}

export interface AtharState {
  entries: ImpactEntry[];
  journalNotes: string; // free-form personal reflection

  // Actions
  addEntry: (data: { content: string; category: ImpactCategory; emoji?: string; meta?: Record<string, unknown> }) => void;
  removeEntry: (id: string) => void;
  toggleStar: (id: string) => void;
  setJournalNotes: (notes: string) => void;

  // Getters
  getRecent: (n: number) => ImpactEntry[];
  getStarred: () => ImpactEntry[];
  getByCategory: (cat: ImpactCategory) => ImpactEntry[];
  getTotalCount: () => number;
  getTimeline: () => { date: string; entries: ImpactEntry[] }[];
  getCategoryBreakdown: () => { category: ImpactCategory; count: number }[];
}

/* ═══════════════════════════════════════════ */
/*              CONSTANTS                     */
/* ═══════════════════════════════════════════ */

export const CATEGORY_META: Record<ImpactCategory, { label: string; emoji: string; color: string }> = {
  purification: { label: "تطهير",     emoji: "🕊️", color: "#a78bfa" },
  repair:       { label: "إصلاح",     emoji: "🌉", color: "#10b981" },
  message:      { label: "رسالة",     emoji: "💌", color: "#06b6d4" },
  stillness:    { label: "سكينة",     emoji: "🧘", color: "#8b5cf6" },
  challenge:    { label: "تحدي",      emoji: "🏋️", color: "#f97316" },
  wisdom:       { label: "حكمة",      emoji: "💎", color: "#f59e0b" },
  habit:        { label: "عادة",      emoji: "🌱", color: "#10b981" },
  pledge:       { label: "عهد",       emoji: "🤝", color: "#fbbf24" },
  milestone:    { label: "إنجاز",     emoji: "🏆", color: "#eab308" },
  reflection:   { label: "تأمل",      emoji: "🪞", color: "#ec4899" },
  manual:       { label: "شخصي",      emoji: "✏️", color: "#64748b" },
};

/* ═══════════════════════════════════════════ */
/*               STORE                        */
/* ═══════════════════════════════════════════ */

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const useAtharState = create<AtharState>()(
  persist(
    (set, get) => ({
      entries: [],
      journalNotes: "",

      addEntry: ({ content, category, emoji, meta }) => {
        const entry: ImpactEntry = {
          id: genId(),
          content,
          category,
          emoji: emoji || CATEGORY_META[category].emoji,
          timestamp: Date.now(),
          isStarred: false,
          meta,
        };
        set((s) => ({ entries: [entry, ...s.entries].slice(0, 500) }));
      },

      removeEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

      toggleStar: (id) => set((s) => ({
        entries: s.entries.map((e) => e.id === id ? { ...e, isStarred: !e.isStarred } : e),
      })),

      setJournalNotes: (notes) => set({ journalNotes: notes }),

      getRecent: (n) => get().entries.slice(0, n),
      getStarred: () => get().entries.filter((e) => e.isStarred),
      getByCategory: (cat) => get().entries.filter((e) => e.category === cat),
      getTotalCount: () => get().entries.length,

      getTimeline: () => {
        const entries = get().entries;
        const map = new Map<string, ImpactEntry[]>();
        entries.forEach((e) => {
          const date = new Date(e.timestamp).toISOString().slice(0, 10);
          if (!map.has(date)) map.set(date, []);
          map.get(date)!.push(e);
        });
        return Array.from(map.entries())
          .map(([date, entries]) => ({ date, entries }))
          .sort((a, b) => b.date.localeCompare(a.date));
      },

      getCategoryBreakdown: () => {
        const entries = get().entries;
        return (Object.keys(CATEGORY_META) as ImpactCategory[])
          .map((cat) => ({ category: cat, count: entries.filter((e) => e.category === cat).length }))
          .filter((c) => c.count > 0)
          .sort((a, b) => b.count - a.count);
      },
    }),
    { name: "alrehla-athar" }
  )
);
