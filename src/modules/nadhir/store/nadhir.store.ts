/**
 * نذير Store — Nadhir: Crisis Early Warning System
 *
 * Persists safety plan, crisis history, and safe contacts.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SafeContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
  emoji: string;
}

export interface SafetyStep {
  id: string;
  order: number;
  text: string;
  done: boolean;
}

export interface CrisisEvent {
  id: string;
  timestamp: number;
  level: number; // 1-10
  trigger: string;
  whatHelped: string;
  resolved: boolean;
}

interface NadhirState {
  safeContacts: SafeContact[];
  safetyPlan: SafetyStep[];
  crisisHistory: CrisisEvent[];
  cooldownEndTime: number | null;

  addSafeContact: (c: Omit<SafeContact, "id">) => void;
  removeSafeContact: (id: string) => void;
  updateSafetyStep: (id: string, updates: Partial<SafetyStep>) => void;
  addSafetyStep: (text: string) => void;
  removeSafetyStep: (id: string) => void;
  logCrisis: (level: number, trigger: string) => string;
  resolveCrisis: (id: string, whatHelped: string) => void;
  startCooldown: (minutes: number) => void;
  clearCooldown: () => void;
}

const DEFAULT_SAFETY_PLAN: SafetyStep[] = [
  { id: "s1", order: 1, text: "توقف — خذ نفس عميق واحد", done: false },
  { id: "s2", order: 2, text: "ابعد عن الشاشة / المكان المحفّز", done: false },
  { id: "s3", order: 3, text: "استخدم تمرين التأريض (5-4-3-2-1)", done: false },
  { id: "s4", order: 4, text: "اتصل بشخص آمن من قائمتك", done: false },
  { id: "s5", order: 5, text: "اكتب ما تشعر به — حتى لو جملة واحدة", done: false },
];

export const useNadhirState = create<NadhirState>()(
  persist(
    (set) => ({
      safeContacts: [],
      safetyPlan: DEFAULT_SAFETY_PLAN,
      crisisHistory: [],
      cooldownEndTime: null,

      addSafeContact: (c) =>
        set((s) => ({
          safeContacts: [...s.safeContacts, { ...c, id: `sc_${Date.now()}` }],
        })),

      removeSafeContact: (id) =>
        set((s) => ({ safeContacts: s.safeContacts.filter((c) => c.id !== id) })),

      updateSafetyStep: (id, updates) =>
        set((s) => ({
          safetyPlan: s.safetyPlan.map((step) =>
            step.id === id ? { ...step, ...updates } : step
          ),
        })),

      addSafetyStep: (text) =>
        set((s) => ({
          safetyPlan: [
            ...s.safetyPlan,
            { id: `s_${Date.now()}`, order: s.safetyPlan.length + 1, text, done: false },
          ],
        })),

      removeSafetyStep: (id) =>
        set((s) => ({
          safetyPlan: s.safetyPlan
            .filter((step) => step.id !== id)
            .map((step, i) => ({ ...step, order: i + 1 })),
        })),

      logCrisis: (level, trigger) => {
        const id = `cr_${Date.now()}`;
        set((s) => ({
          crisisHistory: [
            { id, timestamp: Date.now(), level, trigger, whatHelped: "", resolved: false },
            ...s.crisisHistory,
          ],
        }));
        return id;
      },

      resolveCrisis: (id, whatHelped) =>
        set((s) => ({
          crisisHistory: s.crisisHistory.map((c) =>
            c.id === id ? { ...c, resolved: true, whatHelped } : c
          ),
        })),

      startCooldown: (minutes) =>
        set({ cooldownEndTime: Date.now() + minutes * 60000 }),

      clearCooldown: () => set({ cooldownEndTime: null }),
    }),
    { name: "alrehla-nadhir" }
  )
);
