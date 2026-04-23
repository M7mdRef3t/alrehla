/**
 * صدى Store — Sada: Smart Nudge Engine
 *
 * Manages nudge preferences, history, and generation logic.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandIdbStorage } from '@/utils/idbStorage';


export type NudgeType =
  | "morning_brief"
  | "care_nudge"
  | "pattern_alert"
  | "celebration"
  | "follow_up"
  | "weekly_digest"
  | "streak_warning"
  | "energy_alert";

export interface Nudge {
  id: string;
  type: NudgeType;
  emoji: string;
  title: string;
  message: string;
  action?: { label: string; route: string };
  timestamp: number;
  read: boolean;
  priority: "high" | "medium" | "low";
}

export interface NudgePreference {
  type: NudgeType;
  label: string;
  emoji: string;
  enabled: boolean;
}

interface SadaState {
  nudges: Nudge[];
  preferences: NudgePreference[];
  lastGeneratedDate: string | null;
  weeklyDigestDay: number; // 0=Sun ... 6=Sat

  addNudge: (n: Omit<Nudge, "id" | "timestamp" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearNudge: (id: string) => void;
  clearAll: () => void;
  togglePreference: (type: NudgeType) => void;
  setLastGeneratedDate: (d: string) => void;
  getUnreadCount: () => number;
}

const DEFAULT_PREFERENCES: NudgePreference[] = [
  { type: "morning_brief", label: "ملخص الصباح", emoji: "🌅", enabled: true },
  { type: "care_nudge", label: "تنبيه اهتمام", emoji: "💚", enabled: true },
  { type: "pattern_alert", label: "تنبيه نمط", emoji: "⚠️", enabled: true },
  { type: "celebration", label: "احتفال", emoji: "🎉", enabled: true },
  { type: "follow_up", label: "متابعة", emoji: "🧭", enabled: true },
  { type: "weekly_digest", label: "ملخص أسبوعي", emoji: "📊", enabled: true },
  { type: "streak_warning", label: "تحذير streak", emoji: "🔥", enabled: true },
  { type: "energy_alert", label: "تنبيه طاقة", emoji: "⚡", enabled: true },
];

export const useSadaState = create<SadaState>()(
  persist(
    (set, get) => ({
      nudges: [],
      preferences: DEFAULT_PREFERENCES,
      lastGeneratedDate: null,
      weeklyDigestDay: 5, // Friday

      addNudge: (n) =>
        set((s) => ({
          nudges: [
            { ...n, id: `nd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now(), read: false },
            ...s.nudges,
          ].slice(0, 100), // Keep max 100
        })),

      markRead: (id) =>
        set((s) => ({ nudges: s.nudges.map((n) => (n.id === id ? { ...n, read: true } : n)) })),

      markAllRead: () =>
        set((s) => ({ nudges: s.nudges.map((n) => ({ ...n, read: true })) })),

      clearNudge: (id) =>
        set((s) => ({ nudges: s.nudges.filter((n) => n.id !== id) })),

      clearAll: () => set({ nudges: [] }),

      togglePreference: (type) =>
        set((s) => ({
          preferences: s.preferences.map((p) =>
            p.type === type ? { ...p, enabled: !p.enabled } : p
          ),
        })),

      setLastGeneratedDate: (d) => set({ lastGeneratedDate: d }),

      getUnreadCount: () => get().nudges.filter((n) => !n.read).length,
    }),
    { name: "alrehla-sada", storage: zustandIdbStorage }
  )
);
