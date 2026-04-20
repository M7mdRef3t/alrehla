/**
 * جذر — Jathr Store
 *
 * Core Values Tracker: identify root values that drive you,
 * track daily alignment, and see patterns over time.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ═══════════════════════════════════════════ */
/*                 TYPES                      */
/* ═══════════════════════════════════════════ */

export type ValueDomain = "faith" | "family" | "knowledge" | "health" | "purpose" | "freedom" | "connection" | "creativity" | "integrity" | "growth";
export type AlignmentLevel = 1 | 2 | 3 | 4 | 5;

export interface CoreValue {
  id: string;
  domain: ValueDomain;
  customLabel: string;
  rank: number; // 1 = highest priority
  addedAt: number;
}

export interface AlignmentEntry {
  id: string;
  valueId: string;
  level: AlignmentLevel;
  note: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export interface JathrState {
  values: CoreValue[];
  alignments: AlignmentEntry[];

  // Actions
  addValue: (data: { domain: ValueDomain; customLabel?: string }) => void;
  removeValue: (id: string) => void;
  reorderValues: (orderedIds: string[]) => void;
  logAlignment: (data: { valueId: string; level: AlignmentLevel; note?: string }) => void;
  removeAlignment: (id: string) => void;

  // Getters
  getTodayAlignments: () => AlignmentEntry[];
  getValueById: (id: string) => CoreValue | undefined;
  getValueScore: (valueId: string) => number;
  getOverallAlignment: () => number;
  getWeekTrend: (valueId: string) => { date: string; level: AlignmentLevel | null }[];
  getAlignmentHistory: (n: number) => AlignmentEntry[];
}

/* ═══════════════════════════════════════════ */
/*              CONSTANTS                     */
/* ═══════════════════════════════════════════ */

export const VALUE_DOMAIN_META: Record<ValueDomain, { label: string; emoji: string; color: string; description: string }> = {
  faith:      { label: "إيمان",     emoji: "🕌", color: "#8b5cf6", description: "العلاقة مع الله والعبادة" },
  family:     { label: "عائلة",     emoji: "👨‍👩‍👧‍👦", color: "#ec4899", description: "الروابط الأسرية والحب" },
  knowledge:  { label: "علم",       emoji: "📚", color: "#6366f1", description: "التعلم المستمر والفضول" },
  health:     { label: "صحة",       emoji: "💪", color: "#10b981", description: "الجسد والعقل والروح" },
  purpose:    { label: "هدف",       emoji: "🎯", color: "#f59e0b", description: "الرسالة والمعنى في الحياة" },
  freedom:    { label: "حرية",      emoji: "🦅", color: "#06b6d4", description: "الاستقلالية والخيارات" },
  connection: { label: "تواصل",     emoji: "🤝", color: "#14b8a6", description: "العلاقات الاجتماعية العميقة" },
  creativity: { label: "إبداع",     emoji: "🎨", color: "#f97316", description: "التعبير والابتكار" },
  integrity:  { label: "أمانة",     emoji: "⚖️", color: "#64748b", description: "الصدق مع النفس والآخرين" },
  growth:     { label: "تطور",      emoji: "🌱", color: "#22c55e", description: "النمو الشخصي المستمر" },
};

export const ALIGNMENT_LABELS: Record<AlignmentLevel, { label: string; emoji: string; color: string }> = {
  1: { label: "بعيد جداً",  emoji: "🔴", color: "#ef4444" },
  2: { label: "بعيد",       emoji: "🟠", color: "#f97316" },
  3: { label: "متوسط",      emoji: "🟡", color: "#f59e0b" },
  4: { label: "قريب",       emoji: "🟢", color: "#22c55e" },
  5: { label: "متوافق تماماً", emoji: "💎", color: "#8b5cf6" },
};

/* ═══════════════════════════════════════════ */
/*               STORE                        */
/* ═══════════════════════════════════════════ */

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const todayKey = () => new Date().toISOString().slice(0, 10);

export const useJathrState = create<JathrState>()(
  persist(
    (set, get) => ({
      values: [],
      alignments: [],

      addValue: ({ domain, customLabel }) => {
        const existing = get().values;
        if (existing.length >= 5) return; // Max 5 core values
        if (existing.some((v) => v.domain === domain)) return; // No duplicates
        const entry: CoreValue = {
          id: genId(),
          domain,
          customLabel: customLabel || VALUE_DOMAIN_META[domain].label,
          rank: existing.length + 1,
          addedAt: Date.now(),
        };
        set((s) => ({ values: [...s.values, entry] }));
      },

      removeValue: (id) =>
        set((s) => ({
          values: s.values.filter((v) => v.id !== id).map((v, i) => ({ ...v, rank: i + 1 })),
          alignments: s.alignments.filter((a) => a.valueId !== id),
        })),

      reorderValues: (orderedIds) =>
        set((s) => ({
          values: orderedIds
            .map((id, i) => {
              const v = s.values.find((x) => x.id === id);
              return v ? { ...v, rank: i + 1 } : null;
            })
            .filter(Boolean) as CoreValue[],
        })),

      logAlignment: ({ valueId, level, note }) => {
        const today = todayKey();
        // Replace existing alignment for same value+date
        set((s) => ({
          alignments: [
            {
              id: genId(),
              valueId,
              level,
              note: note || "",
              date: today,
              timestamp: Date.now(),
            },
            ...s.alignments.filter((a) => !(a.valueId === valueId && a.date === today)),
          ].slice(0, 500),
        }));
      },

      removeAlignment: (id) =>
        set((s) => ({ alignments: s.alignments.filter((a) => a.id !== id) })),

      getTodayAlignments: () => {
        const today = todayKey();
        return get().alignments.filter((a) => a.date === today);
      },

      getValueById: (id) => get().values.find((v) => v.id === id),

      getValueScore: (valueId) => {
        const recent = get().alignments
          .filter((a) => a.valueId === valueId)
          .slice(0, 7);
        if (recent.length === 0) return 0;
        return Math.round((recent.reduce((sum, a) => sum + a.level, 0) / recent.length) * 10) / 10;
      },

      getOverallAlignment: () => {
        const values = get().values;
        if (values.length === 0) return 0;
        const scores = values.map((v) => get().getValueScore(v.id));
        const validScores = scores.filter((s) => s > 0);
        if (validScores.length === 0) return 0;
        return Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length / 5) * 100);
      },

      getWeekTrend: (valueId) => {
        const today = new Date();
        const alignments = get().alignments;
        return Array.from({ length: 7 }, (_, i) => {
          const d = new Date(today);
          d.setDate(d.getDate() - (6 - i));
          const key = d.toISOString().slice(0, 10);
          const entry = alignments.find((a) => a.valueId === valueId && a.date === key);
          return { date: key, level: entry?.level || null };
        });
      },

      getAlignmentHistory: (n) => get().alignments.slice(0, n),
    }),
    { name: "alrehla-jathr" }
  )
);
