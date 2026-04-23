/**
 * رصيد — Raseed Store
 * Psychological Capital Counter — gamification layer that connects all tools.
 * Tracks 6 capital dimensions, XP, levels, and achievements.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandIdbStorage } from '@/utils/idbStorage';


export type CapitalDimension = "awareness" | "resilience" | "connection" | "growth" | "peace" | "purpose";

export interface XpEvent {
  id: string;
  source: string;       // module name e.g. "nabd", "wird", "qinaa"
  dimension: CapitalDimension;
  amount: number;
  label: string;
  createdAt: number;
  date: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  dimension: CapitalDimension;
  unlockedAt: number;
}

export interface RaseedState {
  xp: number;
  level: number;
  events: XpEvent[];
  achievements: Achievement[];
  capitals: Record<CapitalDimension, number>;

  addXp: (source: string, dimension: CapitalDimension, amount: number, label: string) => void;
  unlockAchievement: (data: Omit<Achievement, "id" | "unlockedAt">) => void;
  getLevel: () => number;
  getXpForNext: () => { current: number; needed: number; progress: number };
  getTopDimension: () => CapitalDimension;
  getWeakest: () => CapitalDimension;
  getRecentEvents: (n: number) => XpEvent[];
  getTodayXp: () => number;
  getBalance: () => number; // 0-100 how balanced
}

export const DIMENSION_META: Record<CapitalDimension, { label: string; emoji: string; color: string; desc: string }> = {
  awareness:  { label: "الوعي",     emoji: "👁",  color: "#8b5cf6", desc: "فهم الذات والأنماط" },
  resilience: { label: "المرونة",   emoji: "🛡",  color: "#ef4444", desc: "التعامل مع الضغوط" },
  connection: { label: "التواصل",   emoji: "🤝", color: "#22c55e", desc: "جودة العلاقات" },
  growth:     { label: "النمو",     emoji: "📈", color: "#f59e0b", desc: "التطور والتعلم" },
  peace:      { label: "السلام",    emoji: "🕊",  color: "#06b6d4", desc: "الهدوء الداخلي" },
  purpose:    { label: "المعنى",    emoji: "🎯", color: "#ec4899", desc: "الهدف والاتجاه" },
};

const LEVEL_XP = (lvl: number) => Math.floor(100 * Math.pow(1.3, lvl - 1));
const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const useRaseedState = create<RaseedState>()(
  persist(
    (set, get) => ({
      xp: 0, level: 1, events: [], achievements: [],
      capitals: { awareness: 0, resilience: 0, connection: 0, growth: 0, peace: 0, purpose: 0 },

      addXp: (source, dimension, amount, label) => {
        const event: XpEvent = { id: genId(), source, dimension, amount, label, createdAt: Date.now(), date: new Date().toISOString().slice(0, 10) };
        set((s) => {
          const newXp = s.xp + amount;
          const newCaps = { ...s.capitals, [dimension]: s.capitals[dimension] + amount };
          let newLevel = s.level;
          let remaining = newXp;
          while (remaining >= LEVEL_XP(newLevel)) { remaining -= LEVEL_XP(newLevel); newLevel++; }
          return { xp: newXp, level: newLevel, capitals: newCaps, events: [event, ...s.events].slice(0, 300) };
        });
      },

      unlockAchievement: (data) => {
        const exists = get().achievements.find(a => a.title === data.title);
        if (exists) return;
        set((s) => ({ achievements: [{ ...data, id: genId(), unlockedAt: Date.now() }, ...s.achievements] }));
      },

      getLevel: () => get().level,

      getXpForNext: () => {
        const s = get();
        let remaining = s.xp;
        let lvl = 1;
        while (remaining >= LEVEL_XP(lvl)) { remaining -= LEVEL_XP(lvl); lvl++; }
        const needed = LEVEL_XP(lvl);
        return { current: remaining, needed, progress: Math.round((remaining / needed) * 100) };
      },

      getTopDimension: () => {
        const c = get().capitals;
        return (Object.entries(c).sort(([,a], [,b]) => b - a)[0]?.[0] || "awareness") as CapitalDimension;
      },

      getWeakest: () => {
        const c = get().capitals;
        return (Object.entries(c).sort(([,a], [,b]) => a - b)[0]?.[0] || "awareness") as CapitalDimension;
      },

      getRecentEvents: (n) => get().events.slice(0, n),

      getTodayXp: () => {
        const today = new Date().toISOString().slice(0, 10);
        return get().events.filter(e => e.date === today).reduce((a, e) => a + e.amount, 0);
      },

      getBalance: () => {
        const c = get().capitals;
        const vals = Object.values(c);
        const max = Math.max(...vals, 1);
        const ratios = vals.map(v => v / max);
        const avg = ratios.reduce((a, r) => a + r, 0) / ratios.length;
        return Math.round(avg * 100);
      },
    }),
    { name: "alrehla-raseed", storage: zustandIdbStorage }
  )
);
