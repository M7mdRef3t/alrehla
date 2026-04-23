/**
 * دورة — Dawra Store
 * Personal Cycle Tracker: energy, productivity, mood, social patterns.
 * Discover your recurring rhythms across days, weeks, and months.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CycleType = "energy" | "productivity" | "mood" | "social" | "creativity" | "focus";
export type CyclePhase = "peak" | "rising" | "stable" | "declining" | "low";

export interface CycleEntry {
  id: string;
  type: CycleType;
  value: number; // 1-10
  note: string;
  date: string;
  dayOfWeek: number; // 0-6
  createdAt: number;
}

export interface CyclePattern {
  type: CycleType;
  avgByDay: number[]; // 7 days avg
  currentPhase: CyclePhase;
  trend: "up" | "down" | "stable";
  periodDays: number; // detected cycle length
}

export interface DawraState {
  entries: CycleEntry[];
  addEntry: (type: CycleType, value: number, note?: string) => void;
  removeEntry: (id: string) => void;
  getByType: (type: CycleType) => CycleEntry[];
  getToday: () => CycleEntry[];
  getPattern: (type: CycleType) => CyclePattern;
  getAllPatterns: () => CyclePattern[];
  getBestDay: (type: CycleType) => string;
  getWorstDay: (type: CycleType) => string;
  getTotalEntries: () => number;
}

export const CYCLE_META: Record<CycleType, { label: string; emoji: string; color: string }> = {
  energy:       { label: "الطاقة",     emoji: "⚡", color: "#f59e0b" },
  productivity: { label: "الإنتاجية",  emoji: "📈", color: "#22c55e" },
  mood:         { label: "المزاج",     emoji: "🌡️", color: "#8b5cf6" },
  social:       { label: "الاجتماعية", emoji: "👥", color: "#06b6d4" },
  creativity:   { label: "الإبداع",    emoji: "🎨", color: "#ec4899" },
  focus:        { label: "التركيز",    emoji: "🎯", color: "#6366f1" },
};

export const PHASE_META: Record<CyclePhase, { label: string; emoji: string; color: string }> = {
  peak:      { label: "ذروة",    emoji: "🔥", color: "#22c55e" },
  rising:    { label: "صعود",    emoji: "📈", color: "#84cc16" },
  stable:    { label: "استقرار", emoji: "➡️", color: "#f59e0b" },
  declining: { label: "هبوط",    emoji: "📉", color: "#f97316" },
  low:       { label: "قاع",     emoji: "🔋", color: "#ef4444" },
};

const DAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const useDawraState = create<DawraState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (type, value, note = "") => {
        const now = new Date();
        const entry: CycleEntry = { id: genId(), type, value: Math.max(1, Math.min(10, value)), note: note.trim(), date: now.toISOString().slice(0, 10), dayOfWeek: now.getDay(), createdAt: Date.now() };
        set(s => ({ entries: [entry, ...s.entries].slice(0, 500) }));
      },

      removeEntry: (id) => set(s => ({ entries: s.entries.filter(e => e.id !== id) })),
      getByType: (type) => get().entries.filter(e => e.type === type),
      getToday: () => { const t = new Date().toISOString().slice(0, 10); return get().entries.filter(e => e.date === t); },

      getPattern: (type) => {
        const items = get().entries.filter(e => e.type === type);
        const avgByDay = Array(7).fill(0).map((_, d) => {
          const dayItems = items.filter(e => e.dayOfWeek === d);
          return dayItems.length ? Math.round((dayItems.reduce((a, e) => a + e.value, 0) / dayItems.length) * 10) / 10 : 0;
        });
        const recent5 = items.slice(0, 5).map(e => e.value);
        const avg = recent5.length ? recent5.reduce((a, v) => a + v, 0) / recent5.length : 5;
        const prev5 = items.slice(5, 10).map(e => e.value);
        const prevAvg = prev5.length ? prev5.reduce((a, v) => a + v, 0) / prev5.length : avg;
        const trend: "up" | "down" | "stable" = avg > prevAvg + 0.5 ? "up" : avg < prevAvg - 0.5 ? "down" : "stable";
        const currentPhase: CyclePhase = avg >= 8 ? "peak" : avg >= 6.5 ? "rising" : avg >= 4.5 ? "stable" : avg >= 3 ? "declining" : "low";
        return { type, avgByDay, currentPhase, trend, periodDays: 7 };
      },

      getAllPatterns: () => (Object.keys(CYCLE_META) as CycleType[]).map(t => get().getPattern(t)),

      getBestDay: (type) => {
        const p = get().getPattern(type);
        const maxIdx = p.avgByDay.indexOf(Math.max(...p.avgByDay));
        return DAYS_AR[maxIdx] || "—";
      },

      getWorstDay: (type) => {
        const p = get().getPattern(type);
        const nonZero = p.avgByDay.map((v, i) => ({ v, i })).filter(x => x.v > 0);
        if (!nonZero.length) return "—";
        const minIdx = nonZero.sort((a, b) => a.v - b.v)[0].i;
        return DAYS_AR[minIdx] || "—";
      },

      getTotalEntries: () => get().entries.length,
    }),
    { name: "alrehla-dawra" }
  )
);
