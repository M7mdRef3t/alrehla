/**
 * قلب — Qalb Store
 *
 * Heart Health Meter: unified emotional health index from the entire ecosystem.
 * Reads from: tazkiya, jisr, risala, khalwa, warsha, kanz, wird, bathra, mithaq
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ═══════════════════════════════════════════ */
/*                 TYPES                      */
/* ═══════════════════════════════════════════ */

export type HeartZone = "critical" | "weak" | "healing" | "healthy" | "radiant";

export interface HeartDimension {
  id: string;
  label: string;
  emoji: string;
  score: number; // 0-100
  source: string;
  color: string;
}

export interface DailyPulse {
  date: string; // YYYY-MM-DD
  score: number;
  zone: HeartZone;
  dimensions: HeartDimension[];
}

export interface QalbState {
  history: DailyPulse[];
  lastCalculated: number;

  // Actions
  recordPulse: (pulse: DailyPulse) => void;

  // Getters
  getToday: () => DailyPulse | undefined;
  getHistory: (days: number) => DailyPulse[];
  getStreak: () => number;
  getAverageScore: () => number;
  getBestScore: () => number;
}

/* ═══════════════════════════════════════════ */
/*              CONSTANTS                     */
/* ═══════════════════════════════════════════ */

export const ZONE_META: Record<HeartZone, { label: string; emoji: string; color: string; bgColor: string; pulseSpeed: number }> = {
  critical: { label: "حرج",    emoji: "🖤", color: "#ef4444", bgColor: "rgba(239,68,68,0.08)",  pulseSpeed: 2.0 },
  weak:     { label: "ضعيف",   emoji: "🩶", color: "#f59e0b", bgColor: "rgba(245,158,11,0.08)", pulseSpeed: 1.5 },
  healing:  { label: "يتعافى", emoji: "💛", color: "#eab308", bgColor: "rgba(234,179,8,0.08)",  pulseSpeed: 1.2 },
  healthy:  { label: "صحي",    emoji: "💚", color: "#10b981", bgColor: "rgba(16,185,129,0.08)", pulseSpeed: 1.0 },
  radiant:  { label: "مشع",    emoji: "💜", color: "#a78bfa", bgColor: "rgba(167,139,250,0.08)", pulseSpeed: 0.8 },
};

export const DIMENSION_DEFS = [
  { id: "purification", label: "التطهير",  emoji: "🕊️", source: "tazkiya", color: "#a78bfa" },
  { id: "connection",   label: "التواصل",  emoji: "🌉", source: "jisr",    color: "#10b981" },
  { id: "giving",       label: "العطاء",   emoji: "💌", source: "risala",  color: "#06b6d4" },
  { id: "stillness",    label: "السكينة",  emoji: "🧘", source: "khalwa",  color: "#8b5cf6" },
  { id: "growth",       label: "النمو",    emoji: "🏋️", source: "warsha",  color: "#f97316" },
  { id: "wisdom",       label: "الحكمة",   emoji: "💎", source: "kanz",    color: "#f59e0b" },
  { id: "discipline",   label: "الانضباط", emoji: "📿", source: "wird",    color: "#6366f1" },
  { id: "nurture",      label: "الرعاية",  emoji: "🌱", source: "bathra",  color: "#10b981" },
  { id: "integrity",    label: "الأمانة",  emoji: "🤝", source: "mithaq",  color: "#fbbf24" },
];

export function scoreToZone(score: number): HeartZone {
  if (score >= 80) return "radiant";
  if (score >= 60) return "healthy";
  if (score >= 40) return "healing";
  if (score >= 20) return "weak";
  return "critical";
}

const todayKey = () => new Date().toISOString().slice(0, 10);

/* ═══════════════════════════════════════════ */
/*               STORE                        */
/* ═══════════════════════════════════════════ */

export const useQalbState = create<QalbState>()(
  persist(
    (set, get) => ({
      history: [],
      lastCalculated: 0,

      recordPulse: (pulse) => {
        set((s) => {
          const existing = s.history.findIndex((p) => p.date === pulse.date);
          if (existing >= 0) {
            const updated = [...s.history];
            updated[existing] = pulse;
            return { history: updated, lastCalculated: Date.now() };
          }
          return { history: [pulse, ...s.history].slice(0, 90), lastCalculated: Date.now() };
        });
      },

      getToday: () => get().history.find((p) => p.date === todayKey()),
      getHistory: (days) => get().history.slice(0, days),
      getStreak: () => {
        const hist = get().history;
        if (hist.length === 0) return 0;
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < hist.length; i++) {
          const expected = new Date(today);
          expected.setDate(expected.getDate() - i);
          const key = expected.toISOString().slice(0, 10);
          if (hist.find((p) => p.date === key)) {
            streak++;
          } else {
            break;
          }
        }
        return streak;
      },
      getAverageScore: () => {
        const hist = get().history;
        if (hist.length === 0) return 0;
        return Math.round(hist.reduce((sum, p) => sum + p.score, 0) / hist.length);
      },
      getBestScore: () => {
        const hist = get().history;
        if (hist.length === 0) return 0;
        return Math.max(...hist.map((p) => p.score));
      },
    }),
    { name: "alrehla-qalb" }
  )
);
