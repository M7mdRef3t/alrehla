/**
 * سُلّم Store — Sullam: Growth Ladder
 *
 * Manages goals with steps (rungs), milestones, and area-based overview.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandIdbStorage } from '@/utils/idbStorage';


export type GrowthArea = "personal" | "social" | "health" | "career" | "spiritual" | "creative";

export interface Rung {
  id: string;
  label: string;
  done: boolean;
  completedAt: number | null;
}

export interface Goal {
  id: string;
  title: string;
  area: GrowthArea;
  emoji: string;
  rungs: Rung[];
  createdAt: number;
  completedAt: number | null;
  reflection: string;
}

interface SullamState {
  goals: Goal[];
  sanctuary: {
    isActive: boolean;
    startedAt: number | null;
    endsAt: number | null;
  };

  addGoal: (data: { title: string; area: GrowthArea; emoji: string; rungs: string[] }) => string;
  toggleRung: (goalId: string, rungId: string) => void;
  completeGoal: (goalId: string, reflection: string) => void;
  removeGoal: (id: string) => void;

  getActiveGoals: () => Goal[];
  getCompletedGoals: () => Goal[];
  getProgressForGoal: (id: string) => number;
  getAreaStats: () => { area: GrowthArea; total: number; completed: number }[];
  getStuckAreas: () => GrowthArea[];

  enterSanctuary: (days: number) => void;
  leaveSanctuary: () => void;
}

export const AREA_META: Record<GrowthArea, { label: string; emoji: string; color: string }> = {
  personal: { label: "شخصي", emoji: "🌱", color: "#10b981" },
  social: { label: "اجتماعي", emoji: "🤝", color: "#ec4899" },
  health: { label: "صحي", emoji: "💪", color: "#ef4444" },
  career: { label: "مهني", emoji: "💼", color: "#f59e0b" },
  spiritual: { label: "روحاني", emoji: "🕊️", color: "#8b5cf6" },
  creative: { label: "إبداعي", emoji: "🎨", color: "#06b6d4" },
};

export const useSullamState = create<SullamState>()(
  persist(
    (set, get) => ({
      goals: [],
      sanctuary: {
        isActive: false,
        startedAt: null,
        endsAt: null,
      },

      addGoal: (data) => {
        const id = `gl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        set((s) => ({
          goals: [
            {
              id,
              title: data.title,
              area: data.area,
              emoji: data.emoji,
              rungs: data.rungs.map((label, i) => ({
                id: `r_${Date.now()}_${i}`,
                label,
                done: false,
                completedAt: null,
              })),
              createdAt: Date.now(),
              completedAt: null,
              reflection: "",
            },
            ...s.goals,
          ],
        }));
        return id;
      },

      toggleRung: (goalId, rungId) => {
        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.id !== goalId) return g;
            return {
              ...g,
              rungs: g.rungs.map((r) =>
                r.id === rungId
                  ? { ...r, done: !r.done, completedAt: !r.done ? Date.now() : null }
                  : r
              ),
            };
          }),
        }));
      },

      completeGoal: (goalId, reflection) => {
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? { ...g, completedAt: Date.now(), reflection }
              : g
          ),
        }));
      },

      removeGoal: (id) => {
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
      },

      getActiveGoals: () => get().goals.filter((g) => !g.completedAt),
      getCompletedGoals: () => get().goals.filter((g) => g.completedAt),

      getProgressForGoal: (id) => {
        const goal = get().goals.find((g) => g.id === id);
        if (!goal || goal.rungs.length === 0) return 0;
        return Math.round((goal.rungs.filter((r) => r.done).length / goal.rungs.length) * 100);
      },

      getAreaStats: () => {
        const goals = get().goals;
        const areas = Object.keys(AREA_META) as GrowthArea[];
        return areas.map((area) => {
          const areaGoals = goals.filter((g) => g.area === area);
          return {
            area,
            total: areaGoals.length,
            completed: areaGoals.filter((g) => g.completedAt).length,
          };
        }).filter((s) => s.total > 0);
      },

      getStuckAreas: () => {
        if (get().sanctuary.isActive) return [];

        const goals = get().goals;
        const now = Date.now();
        const THRESHOLD = process.env.NODE_ENV === "development" ? 60 * 1000 : 3 * 24 * 60 * 60 * 1000;
        
        const stuckAreas = new Set<GrowthArea>();
        
        goals.forEach(g => {
          if (g.completedAt) return; // not stuck if done
          // Find last completed rung time
          const completedRungs = g.rungs.filter(r => r.done && r.completedAt).sort((a, b) => b.completedAt! - a.completedAt!);
          const lastProgressTime = completedRungs.length > 0 ? completedRungs[0].completedAt! : g.createdAt;
          
          if (now - lastProgressTime > THRESHOLD) {
            stuckAreas.add(g.area);
          }
        });
        
        return Array.from(stuckAreas);
      },

      enterSanctuary: (days) => {
        set({
          sanctuary: {
            isActive: true,
            startedAt: Date.now(),
            endsAt: Date.now() + days * 24 * 60 * 60 * 1000,
          },
        });
      },

      leaveSanctuary: () => {
        const { sanctuary, goals } = get();
        if (!sanctuary.isActive || !sanctuary.startedAt) return;

        const timeFrozen = Date.now() - sanctuary.startedAt;

        // Shift all timestamps by `timeFrozen` so they don't lose their relative age / streaks
        const shiftedGoals = goals.map(g => ({
          ...g,
          createdAt: g.createdAt + timeFrozen,
          completedAt: g.completedAt ? g.completedAt + timeFrozen : null,
          rungs: g.rungs.map(r => ({
            ...r,
            completedAt: r.completedAt ? r.completedAt + timeFrozen : null,
          }))
        }));

        set({
          goals: shiftedGoals,
          sanctuary: {
            isActive: false,
            startedAt: null,
            endsAt: null,
          },
        });
      },
    }),
    { name: "alrehla-sullam", storage: zustandIdbStorage }
  )
);
