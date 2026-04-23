/**
 * راية — Raya Store
 *
 * Long-term Vision Board: 90-day goals with milestones,
 * progress tracking, and vision statements.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ═══════════════════════════════════════════ */
/*                 TYPES                      */
/* ═══════════════════════════════════════════ */

export type GoalStatus = "active" | "completed" | "paused" | "abandoned";
export type GoalCategory = "self" | "relationships" | "career" | "health" | "spiritual" | "creative";

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt: number | null;
  dueDay: number; // Day number in the 90-day cycle (1-90)
}

export interface VisionGoal {
  id: string;
  title: string;
  vision: string; // "I will be..." statement
  category: GoalCategory;
  status: GoalStatus;
  emoji: string;
  milestones: Milestone[];
  startedAt: number;
  completedAt: number | null;
  targetDays: number; // Default 90
  notes: string;
}

export interface RayaState {
  goals: VisionGoal[];
  activeVision: string; // Free-text overarching vision

  // Actions
  addGoal: (data: Omit<VisionGoal, "id" | "status" | "startedAt" | "completedAt">) => void;
  updateGoal: (id: string, updates: Partial<VisionGoal>) => void;
  removeGoal: (id: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  completeGoal: (id: string) => void;
  pauseGoal: (id: string) => void;
  resumeGoal: (id: string) => void;
  setActiveVision: (v: string) => void;

  // Getters
  getActive: () => VisionGoal[];
  getCompleted: () => VisionGoal[];
  getByCategory: (cat: GoalCategory) => VisionGoal[];
  getOverallProgress: () => number;
  getDaysRemaining: (goalId: string) => number;
}

/* ═══════════════════════════════════════════ */
/*              CONSTANTS                     */
/* ═══════════════════════════════════════════ */

export const CATEGORY_META: Record<GoalCategory, { label: string; emoji: string; color: string }> = {
  self:          { label: "الذات",     emoji: "🧘", color: "#8b5cf6" },
  relationships: { label: "العلاقات", emoji: "💞", color: "#ec4899" },
  career:        { label: "المهنة",   emoji: "💼", color: "#f59e0b" },
  health:        { label: "الصحة",    emoji: "🏃", color: "#22c55e" },
  spiritual:     { label: "الروحاني", emoji: "🕌", color: "#6366f1" },
  creative:      { label: "الإبداع",  emoji: "🎨", color: "#06b6d4" },
};

const DEFAULT_GOALS: VisionGoal[] = [
  {
    id: "self-awareness-90",
    title: "أعرف نفسي بعمق",
    vision: "بعد 90 يوم سأكون إنسان يعرف قيمه، حدوده، ونقاط قوته بوضوح تام.",
    category: "self",
    status: "active",
    emoji: "🪞",
    targetDays: 90,
    startedAt: Date.now(),
    completedAt: null,
    notes: "",
    milestones: [
      { id: "m1", title: "أكمل تشخيص الدوائر", completed: false, completedAt: null, dueDay: 7 },
      { id: "m2", title: "أحدد 5 قيم جذرية", completed: false, completedAt: null, dueDay: 14 },
      { id: "m3", title: "أكتب وثيقة الذات الأولى", completed: false, completedAt: null, dueDay: 30 },
      { id: "m4", title: "أراجع أنماطي السلوكية", completed: false, completedAt: null, dueDay: 60 },
      { id: "m5", title: "أكتب رسالة لنفسي بعد سنة", completed: false, completedAt: null, dueDay: 90 },
    ],
  },
];

/* ═══════════════════════════════════════════ */
/*               STORE                        */
/* ═══════════════════════════════════════════ */

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const useRayaState = create<RayaState>()(
  persist(
    (set, get) => ({
      goals: DEFAULT_GOALS,
      activeVision: "أن أعيش حياة واعية، متوازنة، وذات أثر حقيقي.",

      addGoal: (data) => {
        const goal: VisionGoal = { ...data, id: genId(), status: "active", startedAt: Date.now(), completedAt: null };
        set((s) => ({ goals: [...s.goals, goal] }));
      },

      updateGoal: (id, updates) => set((s) => ({
        goals: s.goals.map((g) => g.id === id ? { ...g, ...updates } : g),
      })),

      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      toggleMilestone: (goalId, milestoneId) => set((s) => ({
        goals: s.goals.map((g) => {
          if (g.id !== goalId) return g;
          const milestones = g.milestones.map((m) =>
            m.id === milestoneId ? { ...m, completed: !m.completed, completedAt: !m.completed ? Date.now() : null } : m
          );
          return { ...g, milestones };
        }),
      })),

      completeGoal: (id) => set((s) => ({
        goals: s.goals.map((g) => g.id === id ? { ...g, status: "completed", completedAt: Date.now() } : g),
      })),

      pauseGoal: (id) => set((s) => ({
        goals: s.goals.map((g) => g.id === id ? { ...g, status: "paused" } : g),
      })),

      resumeGoal: (id) => set((s) => ({
        goals: s.goals.map((g) => g.id === id ? { ...g, status: "active" } : g),
      })),

      setActiveVision: (v) => set({ activeVision: v }),

      getActive: () => get().goals.filter((g) => g.status === "active"),
      getCompleted: () => get().goals.filter((g) => g.status === "completed"),
      getByCategory: (cat) => get().goals.filter((g) => g.category === cat),

      getOverallProgress: () => {
        const active = get().goals.filter((g) => g.status === "active");
        if (active.length === 0) return 0;
        const totalMilestones = active.reduce((a, g) => a + g.milestones.length, 0);
        const completedMilestones = active.reduce((a, g) => a + g.milestones.filter((m) => m.completed).length, 0);
        return totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
      },

      getDaysRemaining: (goalId) => {
        const goal = get().goals.find((g) => g.id === goalId);
        if (!goal) return 0;
        const elapsed = Math.floor((Date.now() - goal.startedAt) / 86400000);
        return Math.max(0, goal.targetDays - elapsed);
      },
    }),
    { name: "alrehla-raya" }
  )
);
