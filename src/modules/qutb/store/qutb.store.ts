/**
 * قطب — Qutb Store
 * North Star: your ONE ultimate life purpose that anchors everything.
 * Tracks alignment of daily actions with your deepest purpose.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandIdbStorage } from '@/utils/idbStorage';


export type AlignmentLevel = 1 | 2 | 3 | 4 | 5;
export type PillarCategory = "being" | "doing" | "giving" | "growing" | "connecting" | "creating";

export interface NorthStar {
  statement: string;
  setAt: number;
  revisedCount: number;
}

export interface Pillar {
  id: string;
  category: PillarCategory;
  name: string;
  why: string;
  alignment: AlignmentLevel;
  createdAt: number;
}

export interface AlignmentCheck {
  id: string;
  action: string;
  alignment: AlignmentLevel;
  pillarId: string | null;
  date: string;
  createdAt: number;
}

export interface QutbState {
  northStar: NorthStar | null;
  pillars: Pillar[];
  checks: AlignmentCheck[];
  setNorthStar: (statement: string) => void;
  addPillar: (category: PillarCategory, name: string, why?: string) => void;
  removePillar: (id: string) => void;
  updatePillarAlignment: (id: string, alignment: AlignmentLevel) => void;
  addCheck: (action: string, alignment: AlignmentLevel, pillarId?: string) => void;
  getOverallAlignment: () => number;
  getTodayChecks: () => AlignmentCheck[];
  getWeekAlignment: () => { date: string; avg: number }[];
  getStrongestPillar: () => Pillar | null;
  getWeakestPillar: () => Pillar | null;
}

export const PILLAR_META: Record<PillarCategory, { label: string; emoji: string; color: string }> = {
  being:      { label: "الكينونة",  emoji: "🧘", color: "#8b5cf6" },
  doing:      { label: "الإنجاز",   emoji: "⚡", color: "#f59e0b" },
  giving:     { label: "العطاء",    emoji: "🤲", color: "#22c55e" },
  growing:    { label: "النمو",     emoji: "🌱", color: "#06b6d4" },
  connecting: { label: "التواصل",   emoji: "🔗", color: "#ec4899" },
  creating:   { label: "الإبداع",   emoji: "🎨", color: "#6366f1" },
};

export const ALIGNMENT_META: Record<AlignmentLevel, { label: string; emoji: string; color: string }> = {
  1: { label: "منحرف",    emoji: "🔴", color: "#ef4444" },
  2: { label: "بعيد",     emoji: "🟠", color: "#f97316" },
  3: { label: "متذبذب",   emoji: "🟡", color: "#f59e0b" },
  4: { label: "قريب",     emoji: "🟢", color: "#22c55e" },
  5: { label: "متمركز",   emoji: "⭐", color: "#10b981" },
};

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const todayKey = () => new Date().toISOString().slice(0, 10);

export const useQutbState = create<QutbState>()(
  persist(
    (set, get) => ({
      northStar: null, pillars: [], checks: [],

      setNorthStar: (statement) => set(s => ({
        northStar: { statement: statement.trim(), setAt: Date.now(), revisedCount: (s.northStar?.revisedCount ?? 0) + (s.northStar ? 1 : 0) },
      })),

      addPillar: (category, name, why = "") => {
        set(s => ({ pillars: [...s.pillars, { id: genId(), category, name: name.trim(), why: why.trim(), alignment: 3, createdAt: Date.now() }].slice(0, 12) }));
      },
      removePillar: (id) => set(s => ({ pillars: s.pillars.filter(p => p.id !== id) })),
      updatePillarAlignment: (id, alignment) => set(s => ({
        pillars: s.pillars.map(p => p.id === id ? { ...p, alignment } : p),
      })),

      addCheck: (action, alignment, pillarId) => {
        const check: AlignmentCheck = { id: genId(), action: action.trim(), alignment, pillarId: pillarId || null, date: todayKey(), createdAt: Date.now() };
        set(s => ({ checks: [check, ...s.checks].slice(0, 300) }));
      },

      getOverallAlignment: () => {
        const p = get().pillars;
        if (!p.length) return 0;
        return Math.round((p.reduce((a, pl) => a + pl.alignment, 0) / (p.length * 5)) * 100);
      },

      getTodayChecks: () => { const t = todayKey(); return get().checks.filter(c => c.date === t); },

      getWeekAlignment: () => {
        const result = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now); d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          const dayChecks = get().checks.filter(c => c.date === key);
          const avg = dayChecks.length ? Math.round((dayChecks.reduce((a, c) => a + c.alignment, 0) / dayChecks.length) * 10) / 10 : 0;
          result.push({ date: key, avg });
        }
        return result;
      },

      getStrongestPillar: () => {
        const p = get().pillars;
        return p.length ? p.reduce((a, b) => a.alignment >= b.alignment ? a : b) : null;
      },
      getWeakestPillar: () => {
        const p = get().pillars;
        return p.length ? p.reduce((a, b) => a.alignment <= b.alignment ? a : b) : null;
      },
    }),
    { name: "alrehla-qutb", storage: zustandIdbStorage }
  )
);
