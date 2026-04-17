/**
 * صمت — Samt Store
 *
 * Circular Breathing Timer + Mindful Silence Minutes Counter.
 * Tracks daily/total silence minutes, session history, and streaks.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ═══════════════════════════════════════════ */
/*                 TYPES                      */
/* ═══════════════════════════════════════════ */

export type BreathPattern = "box" | "calm" | "energize" | "sleep";
export type SessionPhase = "idle" | "inhale" | "hold" | "exhale" | "holdOut";

export interface BreathConfig {
  label: string;
  emoji: string;
  color: string;
  /** Durations in seconds: [inhale, hold, exhale, holdOut] */
  pattern: [number, number, number, number];
  description: string;
}

export interface SilenceSession {
  id: string;
  breathPattern: BreathPattern;
  durationSeconds: number;
  completedAt: number;
  date: string; // YYYY-MM-DD
}

export interface SamtState {
  sessions: SilenceSession[];
  totalMinutes: number;

  // Actions
  logSession: (pattern: BreathPattern, durationSeconds: number) => void;
  removeSession: (id: string) => void;

  // Getters
  getTodayMinutes: () => number;
  getTodaySessions: () => SilenceSession[];
  getStreak: () => number;
  getRecentSessions: (n: number) => SilenceSession[];
  getPatternBreakdown: () => { pattern: BreathPattern; count: number; minutes: number }[];
}

/* ═══════════════════════════════════════════ */
/*              CONSTANTS                     */
/* ═══════════════════════════════════════════ */

export const BREATH_CONFIGS: Record<BreathPattern, BreathConfig> = {
  box: {
    label: "صندوقي",
    emoji: "⬜",
    color: "#06b6d4",
    pattern: [4, 4, 4, 4],
    description: "4-4-4-4 — توازن وهدوء",
  },
  calm: {
    label: "هدوء",
    emoji: "🌊",
    color: "#8b5cf6",
    pattern: [4, 7, 8, 0],
    description: "4-7-8 — استرخاء عميق",
  },
  energize: {
    label: "طاقة",
    emoji: "⚡",
    color: "#f59e0b",
    pattern: [3, 0, 3, 0],
    description: "3-0-3-0 — تنشيط سريع",
  },
  sleep: {
    label: "نوم",
    emoji: "🌙",
    color: "#6366f1",
    pattern: [4, 7, 8, 0],
    description: "4-7-8 بطيء — تحضير للنوم",
  },
};

export const PHASE_LABELS: Record<SessionPhase, string> = {
  idle: "ابدأ",
  inhale: "شهيق",
  hold: "إمساك",
  exhale: "زفير",
  holdOut: "توقف",
};

/* ═══════════════════════════════════════════ */
/*               STORE                        */
/* ═══════════════════════════════════════════ */

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const todayKey = () => new Date().toISOString().slice(0, 10);

export const useSamtState = create<SamtState>()(
  persist(
    (set, get) => ({
      sessions: [],
      totalMinutes: 0,

      logSession: (pattern, durationSeconds) => {
        const session: SilenceSession = {
          id: genId(),
          breathPattern: pattern,
          durationSeconds,
          completedAt: Date.now(),
          date: todayKey(),
        };
        const addedMinutes = Math.round(durationSeconds / 60 * 10) / 10;
        set((s) => ({
          sessions: [session, ...s.sessions].slice(0, 500),
          totalMinutes: Math.round((s.totalMinutes + addedMinutes) * 10) / 10,
        }));
      },

      removeSession: (id) =>
        set((s) => {
          const session = s.sessions.find((x) => x.id === id);
          const removedMinutes = session ? Math.round(session.durationSeconds / 60 * 10) / 10 : 0;
          return {
            sessions: s.sessions.filter((x) => x.id !== id),
            totalMinutes: Math.max(0, Math.round((s.totalMinutes - removedMinutes) * 10) / 10),
          };
        }),

      getTodayMinutes: () => {
        const today = todayKey();
        return Math.round(
          get().sessions
            .filter((s) => s.date === today)
            .reduce((sum, s) => sum + s.durationSeconds / 60, 0) * 10
        ) / 10;
      },

      getTodaySessions: () => get().sessions.filter((s) => s.date === todayKey()),

      getStreak: () => {
        const sessions = get().sessions;
        if (sessions.length === 0) return 0;
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 90; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          if (sessions.some((s) => s.date === key)) {
            streak++;
          } else break;
        }
        return streak;
      },

      getRecentSessions: (n) => get().sessions.slice(0, n),

      getPatternBreakdown: () => {
        const sessions = get().sessions;
        return (Object.keys(BREATH_CONFIGS) as BreathPattern[])
          .map((p) => {
            const filtered = sessions.filter((s) => s.breathPattern === p);
            return {
              pattern: p,
              count: filtered.length,
              minutes: Math.round(filtered.reduce((sum, s) => sum + s.durationSeconds / 60, 0) * 10) / 10,
            };
          })
          .filter((p) => p.count > 0)
          .sort((a, b) => b.minutes - a.minutes);
      },
    }),
    { name: "alrehla-samt" }
  )
);
