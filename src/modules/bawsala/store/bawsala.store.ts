/**
 * بوصلة Store — Bawsala: Decision Compass
 *
 * Persists decision logs, active deliberations, and values alignment.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandIdbStorage } from '@/utils/idbStorage';


export interface BawsalaValue {
  id: string;
  label: string;
  emoji: string;
  weight: number; // 1-5
}

export interface DecisionOption {
  id: string;
  label: string;
  pros: string[];
  cons: string[];
  gutFeeling: number; // 1-10
  valuesAlignment: number; // 0-100
}

export interface Decision {
  id: string;
  question: string;
  context: string;
  options: DecisionOption[];
  chosenOptionId: string | null;
  status: "active" | "decided" | "reflected";
  createdAt: number;
  decidedAt: number | null;
  reflectionNote: string;
  futureCheck: string; // "in 1 week, check if..."
}

interface BawsalaState {
  values: BawsalaValue[];
  decisions: Decision[];
  addValue: (v: Omit<BawsalaValue, "id">) => void;
  removeValue: (id: string) => void;
  addDecision: (question: string, context: string) => string;
  addOption: (decisionId: string, label: string) => void;
  updateOption: (decisionId: string, optionId: string, updates: Partial<DecisionOption>) => void;
  chooseOption: (decisionId: string, optionId: string) => void;
  addReflection: (decisionId: string, note: string) => void;
  removeDecision: (id: string) => void;
}

const DEFAULT_VALUES: BawsalaValue[] = [
  { id: "v1", label: "راحة البال", emoji: "🕊️", weight: 5 },
  { id: "v2", label: "الصدق", emoji: "💎", weight: 4 },
  { id: "v3", label: "الاستقلالية", emoji: "🦅", weight: 4 },
  { id: "v4", label: "العلاقات", emoji: "💚", weight: 3 },
  { id: "v5", label: "النمو", emoji: "🌱", weight: 3 },
];

export const useBawsalaState = create<BawsalaState>()(
  persist(
    (set, get) => ({
      values: DEFAULT_VALUES,
      decisions: [],

      addValue: (v) =>
        set((s) => ({
          values: [...s.values, { ...v, id: `v_${crypto.randomUUID()}` }],
        })),

      removeValue: (id) =>
        set((s) => ({ values: s.values.filter((v) => v.id !== id) })),

      addDecision: (question, context) => {
        const id = `d_${crypto.randomUUID()}`;
        set((s) => ({
          decisions: [
            {
              id,
              question,
              context,
              options: [],
              chosenOptionId: null,
              status: "active",
              createdAt: Date.now(),
              decidedAt: null,
              reflectionNote: "",
              futureCheck: "",
            },
            ...s.decisions,
          ],
        }));
        return id;
      },

      addOption: (decisionId, label) =>
        set((s) => ({
          decisions: s.decisions.map((d) =>
            d.id === decisionId
              ? {
                  ...d,
                  options: [
                    ...d.options,
                    { id: `o_${crypto.randomUUID()}`, label, pros: [], cons: [], gutFeeling: 5, valuesAlignment: 50 },
                  ],
                }
              : d
          ),
        })),

      updateOption: (decisionId, optionId, updates) =>
        set((s) => ({
          decisions: s.decisions.map((d) =>
            d.id === decisionId
              ? {
                  ...d,
                  options: d.options.map((o) =>
                    o.id === optionId ? { ...o, ...updates } : o
                  ),
                }
              : d
          ),
        })),

      chooseOption: (decisionId, optionId) =>
        set((s) => ({
          decisions: s.decisions.map((d) =>
            d.id === decisionId
              ? { ...d, chosenOptionId: optionId, status: "decided", decidedAt: Date.now() }
              : d
          ),
        })),

      addReflection: (decisionId, note) =>
        set((s) => ({
          decisions: s.decisions.map((d) =>
            d.id === decisionId
              ? { ...d, reflectionNote: note, status: "reflected" }
              : d
          ),
        })),

      removeDecision: (id) =>
        set((s) => ({ decisions: s.decisions.filter((d) => d.id !== id) })),
    }),
    { name: "alrehla-bawsala", storage: zustandIdbStorage }
  )
);
