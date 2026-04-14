<<<<<<< HEAD
=======
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
>>>>>>> feat/sovereign-final-stabilization
/**
 * 🕐 Ritual State — المتجر المركزي لنظام العادات اليومية
 * ======================================================
 * يدير: العادات، سجلات الإتمام، وخطة اليوم.
 * Offline-first: يحفظ في localStorage + sync مع Supabase.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  DailyRitual,
  RitualLog,
  DailyPlan,
  DailyPriority,
  EveningReflection,
  DayTheme,
  PresetRitual,
  TimeOfDay,
} from "@/types/dailyRituals";
import { getTodayDate } from "@/types/dailyRituals";
import { useGamificationState } from "@/domains/gamification/store/gamification.store";


const STORAGE_KEY = "alrehla-daily-rituals";

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── State Interface ─────────────────────────────────────────────
interface RitualState {
  // Data
  rituals: DailyRitual[];
  logs: RitualLog[];
  plans: DailyPlan[];

  // Actions — Rituals
  addRitual: (ritual: Omit<DailyRitual, "id" | "createdAt" | "sortOrder" | "isPreset">) => string;
  addPresetRitual: (preset: PresetRitual) => string;
  updateRitual: (id: string, updates: Partial<DailyRitual>) => void;
  toggleRitualActive: (id: string) => void;
  removeRitual: (id: string) => void;
  reorderRituals: (ids: string[]) => void;

  // Actions — Logs
  logCompletion: (ritualId: string, note?: string, feeling?: RitualLog["feelingAfter"]) => void;
  undoCompletion: (ritualId: string) => void;

  // Actions — Daily Plan
  getOrCreateTodayPlan: () => DailyPlan;
  updateTodayPlan: (updates: Partial<DailyPlan>) => void;
  setMorningEnergy: (level: number) => void;
  setDayTheme: (theme: DayTheme) => void;
  startMorning: () => void;
  addPriority: (text: string, domainId: string) => void;
  togglePriority: (priorityId: string) => void;
  submitEveningReflection: (reflection: EveningReflection) => void;
  rateDayOverall: (rating: number) => void;

  // Gamification & Streaks
  perfectDayStreak: number;
  lastPerfectDay: string | null;

  // Getters
  getTodayLogs: () => RitualLog[];
  getTodayPlan: () => DailyPlan | null;
  isRitualCompletedToday: (ritualId: string) => boolean;
  getActiveRituals: () => DailyRitual[];
}

// ─── Store ───────────────────────────────────────────────────────
export const useRitualState = create<RitualState>()(
  persist(
    (set, get) => ({
      // Initial data
      rituals: [],
      logs: [],
      plans: [],

      // Perfect Day State
      perfectDayStreak: 0,
      lastPerfectDay: null,

      // ── Rituals ──
      addRitual: (ritualData) => {
        const id = uid();
        const ritual: DailyRitual = {
          ...ritualData,
          id,
          isPreset: false,
          sortOrder: get().rituals.length,
          createdAt: Date.now(),
        };
        set((s) => ({ rituals: [...s.rituals, ritual] }));
        return id;
      },

      addPresetRitual: (preset) => {
        const id = uid();
        const ritual: DailyRitual = {
          id,
          name: preset.name,
          icon: preset.icon,
          domainId: preset.domainId,
          targetTime: preset.targetTime,
          frequency: "daily",
          estimatedMinutes: preset.estimatedMinutes,
          isActive: true,
          isPreset: true,
          sortOrder: get().rituals.length,
          createdAt: Date.now(),
        };
        set((s) => ({ rituals: [...s.rituals, ritual] }));
        return id;
      },

      updateRitual: (id, updates) => {
        set((s) => ({
          rituals: s.rituals.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        }));
      },

      toggleRitualActive: (id) => {
        set((s) => ({
          rituals: s.rituals.map((r) =>
            r.id === id ? { ...r, isActive: !r.isActive } : r
          ),
        }));
      },

      removeRitual: (id) => {
        set((s) => ({
          rituals: s.rituals.filter((r) => r.id !== id),
        }));
      },

      reorderRituals: (ids) => {
        set((s) => ({
          rituals: s.rituals.map((r) => {
            const newOrder = ids.indexOf(r.id);
            return newOrder >= 0 ? { ...r, sortOrder: newOrder } : r;
          }),
        }));
      },

      // ── Logs ──
      logCompletion: (ritualId, note, feeling) => {
        const today = getTodayDate();
        // Prevent double logging
        const existing = get().logs.find(
          (l) => l.ritualId === ritualId && l.logDate === today
        );
        if (existing) return;

        const log: RitualLog = {
          id: uid(),
          ritualId,
          logDate: today,
          completedAt: Date.now(),
          note,
          feelingAfter: feeling,
        };
        
        const newLogs = [log, ...get().logs].slice(0, 5000);
        
        set(() => ({
          logs: newLogs,
        }));

        // Gamification Reward
        const gamification = useGamificationState.getState();
        const ritual = get().rituals.find(r => r.id === ritualId);
        gamification.addXP(30, `إتمام عادة: ${ritual?.name || ""}`);
        gamification.addCoins(10, "مكافأة انضباط");

        // Check for Perfect Day
        const activeRituals = get().getActiveRituals();
        const todayLogsCount = newLogs.filter((l) => l.logDate === today).length;
        
        if (activeRituals.length > 0 && todayLogsCount >= activeRituals.length) {
           const { lastPerfectDay, perfectDayStreak } = get();
           if (lastPerfectDay !== today) {
              const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
              const isConsecutive = lastPerfectDay === yesterday;
              const newStreak = isConsecutive ? perfectDayStreak + 1 : 1;
              
              set({
                 lastPerfectDay: today,
                 perfectDayStreak: newStreak
              });

              gamification.addXP(100 + (newStreak * 10), `اليوم المثالي! (${newStreak}x🔥)`);
              gamification.addCoins(50, "مكافأة اليوم المثالي");
           }
        }
      },


      undoCompletion: (ritualId) => {
        const today = getTodayDate();
        set((s) => ({
          logs: s.logs.filter(
            (l) => !(l.ritualId === ritualId && l.logDate === today)
          ),
        }));

        // Deduct rewards (penalty for undoing)
        const gamification = useGamificationState.getState();
        gamification.addXP(-30, "تراجع عن عادة");
        gamification.addCoins(-10, "تراجع مكافأة");
      },


      // ── Daily Plan ──
      getOrCreateTodayPlan: () => {
        const today = getTodayDate();
        const existing = get().plans.find((p) => p.planDate === today);
        if (existing) return existing;

        const newPlan: DailyPlan = {
          id: `plan-${today}`,
          planDate: today,
          morningEnergy: null,
          dayTheme: null,
          topPriorities: [],
          morningStarted: false,
          eveningReflection: null,
          dayRating: null,
          createdAt: Date.now(),
        };
        set((s) => ({
          plans: [newPlan, ...s.plans].slice(0, 90), // Keep last 90 days
        }));
        return newPlan;
      },

      updateTodayPlan: (updates) => {
        const today = getTodayDate();
        set((s) => ({
          plans: s.plans.map((p) =>
            p.planDate === today ? { ...p, ...updates } : p
          ),
        }));
      },

      setMorningEnergy: (level) => {
        get().getOrCreateTodayPlan();
        get().updateTodayPlan({ morningEnergy: level });
      },

      setDayTheme: (theme) => {
        get().getOrCreateTodayPlan();
        get().updateTodayPlan({ dayTheme: theme });
      },

      startMorning: () => {
        get().getOrCreateTodayPlan();
        get().updateTodayPlan({ morningStarted: true });
      },

      addPriority: (text, domainId) => {
        const plan = get().getOrCreateTodayPlan();
        const priority: DailyPriority = {
          id: uid(),
          text,
          domainId: domainId as any,
          isCompleted: false,
          source: "user",
        };
        get().updateTodayPlan({
          topPriorities: [...plan.topPriorities, priority].slice(0, 5),
        });
      },

      togglePriority: (priorityId) => {
        const plan = get().getTodayPlan();
        if (!plan) return;
        get().updateTodayPlan({
          topPriorities: plan.topPriorities.map((p) =>
            p.id === priorityId ? { ...p, isCompleted: !p.isCompleted } : p
          ),
        });
      },

      submitEveningReflection: (reflection) => {
        get().getOrCreateTodayPlan();
        get().updateTodayPlan({ eveningReflection: reflection });
      },

      rateDayOverall: (rating) => {
        get().getOrCreateTodayPlan();
        get().updateTodayPlan({ dayRating: rating });
      },

      // ── Getters ──
      getTodayLogs: () => {
        const today = getTodayDate();
        return get().logs.filter((l) => l.logDate === today);
      },

      getTodayPlan: () => {
        const today = getTodayDate();
        return get().plans.find((p) => p.planDate === today) ?? null;
      },

      isRitualCompletedToday: (ritualId) => {
        const today = getTodayDate();
        return get().logs.some(
          (l) => l.ritualId === ritualId && l.logDate === today
        );
      },

      getActiveRituals: () => {
        return get().rituals.filter((r) => r.isActive);
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        rituals: s.rituals,
        logs: s.logs.slice(0, 5000),
        plans: s.plans.slice(0, 90),
        perfectDayStreak: s.perfectDayStreak,
        lastPerfectDay: s.lastPerfectDay,
      }),
    }
  )
);
