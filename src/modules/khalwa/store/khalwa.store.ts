/**
 * خلوة — Khalwa Store
 *
 * Deep focus mode. Enter isolation, set an intention,
 * track flow time, and reflect upon exit.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandIdbStorage } from '@/utils/idbStorage';


/* ═══════════════════════════════════════════ */
/*                 TYPES                      */
/* ═══════════════════════════════════════════ */

export type KhalwaIntention =
  | "thinking"    // تفكر
  | "planning"    // تخطيط
  | "healing"     // تشافي
  | "creating"    // إبداع
  | "praying"     // عبادة
  | "resting";    // راحة

export interface KhalwaSession {
  id: string;
  intention: KhalwaIntention;
  intentionNote: string;
  startedAt: number;
  endedAt?: number;
  /** Duration in seconds */
  durationSec: number;
  /** Reflection written after exiting */
  exitReflection?: string;
  /** Clarity score 1-5 after session */
  clarityScore?: number;
}

export interface KhalwaState {
  sessions: KhalwaSession[];
  /** Currently active session (null = not in khalwa) */
  activeSession: KhalwaSession | null;

  // Actions
  enterKhalwa: (intention: KhalwaIntention, note: string) => void;
  exitKhalwa: (reflection: string, clarityScore: number) => void;
  cancelKhalwa: () => void;

  // Getters
  getTotalMinutes: () => number;
  getSessionCount: () => number;
  getStreak: () => number;
  getIntentionStats: () => Record<KhalwaIntention, number>;
  getRecentSessions: (limit?: number) => KhalwaSession[];
}

/* ═══════════════════════════════════════════ */
/*              CONSTANTS                     */
/* ═══════════════════════════════════════════ */

export const INTENTION_META: Record<KhalwaIntention, { label: string; emoji: string; color: string }> = {
  thinking:  { label: "تفكّر",  emoji: "🧠", color: "#8b5cf6" },
  planning:  { label: "تخطيط",  emoji: "🗺️", color: "#3b82f6" },
  healing:   { label: "تشافي",  emoji: "💚", color: "#10b981" },
  creating:  { label: "إبداع",  emoji: "✨", color: "#f59e0b" },
  praying:   { label: "عبادة",  emoji: "🤲", color: "#a78bfa" },
  resting:   { label: "راحة",   emoji: "🌙", color: "#64748b" },
};

/* ═══════════════════════════════════════════ */
/*               HELPERS                      */
/* ═══════════════════════════════════════════ */

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function isSameDay(a: number, b: number): boolean {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

/* ═══════════════════════════════════════════ */
/*               STORE                        */
/* ═══════════════════════════════════════════ */

export const useKhalwaState = create<KhalwaState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSession: null,

      enterKhalwa: (intention, note) => {
        const session: KhalwaSession = {
          id: genId(),
          intention,
          intentionNote: note,
          startedAt: Date.now(),
          durationSec: 0,
        };
        set({ activeSession: session });
      },

      exitKhalwa: (reflection, clarityScore) => {
        const active = get().activeSession;
        if (!active) return;

        const now = Date.now();
        const completed: KhalwaSession = {
          ...active,
          endedAt: now,
          durationSec: Math.floor((now - active.startedAt) / 1000),
          exitReflection: reflection || undefined,
          clarityScore,
        };

        set((s) => ({
          sessions: [...s.sessions, completed],
          activeSession: null,
        }));
      },

      cancelKhalwa: () => {
        set({ activeSession: null });
      },

      // Getters
      getTotalMinutes: () => {
        return Math.floor(get().sessions.reduce((acc, s) => acc + s.durationSec, 0) / 60);
      },

      getSessionCount: () => get().sessions.length,

      getStreak: () => {
        const sorted = [...get().sessions].sort((a, b) => b.startedAt - a.startedAt);
        if (sorted.length === 0) return 0;

        let streak = 1;
        let prev = sorted[0]!.startedAt;

        // Check if today or yesterday
        const now = Date.now();
        if (!isSameDay(prev, now) && !isSameDay(prev, now - 86400000)) return 0;

        for (let i = 1; i < sorted.length; i++) {
          const curr = sorted[i]!.startedAt;
          const prevDay = new Date(prev);
          prevDay.setDate(prevDay.getDate() - 1);
          if (isSameDay(curr, prevDay.getTime())) {
            streak++;
            prev = curr;
          } else if (!isSameDay(curr, prev)) {
            break;
          }
        }
        return streak;
      },

      getIntentionStats: () => {
        const stats: Record<KhalwaIntention, number> = {
          thinking: 0, planning: 0, healing: 0, creating: 0, praying: 0, resting: 0,
        };
        get().sessions.forEach((s) => { stats[s.intention]++; });
        return stats;
      },

      getRecentSessions: (limit = 10) => {
        return [...get().sessions].sort((a, b) => b.startedAt - a.startedAt).slice(0, limit);
      },
    }),
    { name: "alrehla-khalwa", storage: zustandIdbStorage }
  )
);
