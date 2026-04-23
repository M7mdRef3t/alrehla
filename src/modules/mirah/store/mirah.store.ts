/**
 * مرآة Store — Mir'ah: Self-Awareness Mirror
 *
 * Aggregates cross-product data to generate personality insights,
 * behavioral patterns, and self-discovery prompts.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandIdbStorage } from '@/utils/idbStorage';


export type InsightCategory =
  | "energy"
  | "emotion"
  | "behavior"
  | "growth"
  | "social"
  | "values";

export interface SelfInsight {
  id: string;
  category: InsightCategory;
  title: string;
  description: string;
  emoji: string;
  confidence: number; // 0-100
  generatedAt: number;
  acknowledged: boolean;
}

export interface GrowthMilestone {
  id: string;
  label: string;
  emoji: string;
  achievedAt: number;
  metric: string;
}

export interface ReflectionPrompt {
  id: string;
  question: string;
  answer: string;
  answeredAt: number | null;
}

interface MirahState {
  insights: SelfInsight[];
  milestones: GrowthMilestone[];
  reflections: ReflectionPrompt[];
  lastAnalysisDate: string | null;

  addInsight: (i: Omit<SelfInsight, "id" | "generatedAt" | "acknowledged">) => void;
  acknowledgeInsight: (id: string) => void;
  clearInsights: () => void;

  addMilestone: (m: Omit<GrowthMilestone, "id" | "achievedAt">) => void;

  setReflections: (prompts: Omit<ReflectionPrompt, "id" | "answer" | "answeredAt">[]) => void;
  answerReflection: (id: string, answer: string) => void;

  setLastAnalysisDate: (d: string) => void;
}

const uid = () => `mi_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

export const useMirahState = create<MirahState>()(
  persist(
    (set, get) => ({
      insights: [],
      milestones: [],
      reflections: [],
      lastAnalysisDate: null,

      addInsight: (i) =>
        set((s) => ({
          insights: [
            { ...i, id: uid(), generatedAt: Date.now(), acknowledged: false },
            ...s.insights,
          ].slice(0, 50),
        })),

      acknowledgeInsight: (id) =>
        set((s) => ({
          insights: s.insights.map((i) =>
            i.id === id ? { ...i, acknowledged: true } : i
          ),
        })),

      clearInsights: () => set({ insights: [] }),

      addMilestone: (m) =>
        set((s) => ({
          milestones: [
            ...s.milestones,
            { ...m, id: uid(), achievedAt: Date.now() },
          ],
        })),

      setReflections: (prompts) =>
        set({
          reflections: prompts.map((p) => ({
            ...p,
            id: uid(),
            answer: "",
            answeredAt: null,
          })),
        }),

      answerReflection: (id, answer) =>
        set((s) => ({
          reflections: s.reflections.map((r) =>
            r.id === id ? { ...r, answer, answeredAt: Date.now() } : r
          ),
        })),

      setLastAnalysisDate: (d) => set({ lastAnalysisDate: d }),
    }),
    { name: "alrehla-mirah", storage: zustandIdbStorage }
  )
);
