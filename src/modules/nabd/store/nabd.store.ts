/**
 * نبض — Nabd Store
 * Daily Mood & Energy Pulse Check — fastest check-in possible (5 seconds)
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MoodLevel = 1 | 2 | 3 | 4 | 5;
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export interface PulseEntry {
  id: string;
  mood: MoodLevel;
  energy: EnergyLevel;
  note: string;
  date: string;
  time: string;
  createdAt: number;
}

export interface NabdState {
  pulses: PulseEntry[];
  addPulse: (mood: MoodLevel, energy: EnergyLevel, note?: string) => void;
  removePulse: (id: string) => void;
  getToday: () => PulseEntry[];
  getByDate: (date: string) => PulseEntry[];
  getStreak: () => number;
  getTodayAvg: () => { mood: number; energy: number };
  getWeekTrend: () => { date: string; mood: number; energy: number }[];
  getTotalPulses: () => number;
  hasCheckedToday: () => boolean;
}

export const MOOD_META: Record<MoodLevel, { label: string; emoji: string; color: string }> = {
  1: { label: "منهار", emoji: "😞", color: "#ef4444" },
  2: { label: "متعب",  emoji: "😕", color: "#f97316" },
  3: { label: "عادي",   emoji: "😐", color: "#f59e0b" },
  4: { label: "جيد",    emoji: "😊", color: "#22c55e" },
  5: { label: "ممتاز",  emoji: "🤩", color: "#10b981" },
};

export const ENERGY_META: Record<EnergyLevel, { label: string; emoji: string; color: string }> = {
  1: { label: "فارغ",    emoji: "🪫", color: "#ef4444" },
  2: { label: "منخفض",   emoji: "🔋", color: "#f97316" },
  3: { label: "متوسط",   emoji: "⚡", color: "#f59e0b" },
  4: { label: "مشحون",   emoji: "💪", color: "#22c55e" },
  5: { label: "طاقة قصوى", emoji: "🔥", color: "#10b981" },
};

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const todayKey = () => new Date().toISOString().slice(0, 10);

export const useNabdState = create<NabdState>()(
  persist(
    (set, get) => ({
      pulses: [],

      addPulse: (mood, energy, note = "") => {
        const now = new Date();
        const entry: PulseEntry = {
          id: genId(), mood, energy, note: note.trim(), date: todayKey(),
          time: now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
          createdAt: Date.now(),
        };
        set((s) => ({ pulses: [entry, ...s.pulses].slice(0, 500) }));
      },

      removePulse: (id) => set((s) => ({ pulses: s.pulses.filter((p) => p.id !== id) })),

      getToday: () => { const t = todayKey(); return get().pulses.filter((p) => p.date === t); },

      getByDate: (date) => get().pulses.filter((p) => p.date === date),

      getStreak: () => {
        const dates = [...new Set(get().pulses.map((p) => p.date))].sort().reverse();
        if (!dates.length) return 0;
        let streak = 0;
        const now = new Date();
        for (let i = 0; i < 365; i++) {
          const d = new Date(now); d.setDate(d.getDate() - i);
          if (dates.includes(d.toISOString().slice(0, 10))) streak++; else if (i > 0) break;
        }
        return streak;
      },

      getTodayAvg: () => {
        const today = get().getToday();
        if (!today.length) return { mood: 0, energy: 0 };
        return {
          mood: Math.round((today.reduce((a, p) => a + p.mood, 0) / today.length) * 10) / 10,
          energy: Math.round((today.reduce((a, p) => a + p.energy, 0) / today.length) * 10) / 10,
        };
      },

      getWeekTrend: () => {
        const result = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now); d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          const dayPulses = get().pulses.filter((p) => p.date === key);
          const mood = dayPulses.length ? dayPulses.reduce((a, p) => a + p.mood, 0) / dayPulses.length : 0;
          const energy = dayPulses.length ? dayPulses.reduce((a, p) => a + p.energy, 0) / dayPulses.length : 0;
          result.push({ date: key, mood: Math.round(mood * 10) / 10, energy: Math.round(energy * 10) / 10 });
        }
        return result;
      },

      getTotalPulses: () => get().pulses.length,
      hasCheckedToday: () => get().getToday().length > 0,
    }),
    { name: "alrehla-nabd" }
  )
);
