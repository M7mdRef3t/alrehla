/**
 * جسر — Jisr Store
 *
 * Relationship repair tool: حدّد → عبّر → افعل
 * Identify the fracture → Express what you need to say → One action step
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ═══════════════════════════════════════════ */
/*                 TYPES                      */
/* ═══════════════════════════════════════════ */

export type RepairPhase = "identify" | "express" | "act";

export type FractureType =
  | "distance"      // تباعد
  | "conflict"      // خلاف
  | "betrayal"      // خيانة ثقة
  | "neglect"       // إهمال
  | "misunderstand"  // سوء فهم
  | "boundary"      // حدود مكسورة
  | "silence";      // صمت طويل

export type RelationKind =
  | "family"   // عائلة
  | "friend"   // صديق
  | "partner"  // شريك
  | "colleague" // زميل
  | "self";     // نفسي

export interface RepairBridge {
  id: string;
  createdAt: number;
  completedAt?: number;

  // Phase 1: حدّد
  personName: string;
  relationKind: RelationKind;
  fractureType: FractureType;
  whatHappened: string;
  myRole: string; // ما دوري في هذا

  // Phase 2: عبّر
  whatIWantToSay: string;
  whatINeed: string; // ما الذي أحتاجه من هذه العلاقة

  // Phase 3: افعل
  actionStep: string; // خطوة واحدة ملموسة
  deadline: string;   // YYYY-MM-DD
  isComplete: boolean;
  completionNote?: string;
}

export interface JisrState {
  bridges: RepairBridge[];
  activeBridge: Partial<RepairBridge> | null;
  currentPhase: RepairPhase;

  // Actions
  startBridge: () => void;
  setIdentify: (data: {
    personName: string;
    relationKind: RelationKind;
    fractureType: FractureType;
    whatHappened: string;
    myRole: string;
  }) => void;
  setExpress: (whatIWantToSay: string, whatINeed: string) => void;
  setAct: (actionStep: string, deadline: string) => void;
  completeBridge: () => void;
  markDone: (id: string, note: string) => void;
  cancelBridge: () => void;
  removeBridge: (id: string) => void;

  // Getters
  getActiveBridges: () => RepairBridge[];
  getCompletedBridges: () => RepairBridge[];
  getTotalCount: () => number;
  getCompletedCount: () => number;
}

/* ═════════════════════════════════════════ */
/*              CONSTANTS                     */
/* ═══════════════════════════════════════════ */

export const FRACTURE_META: Record<FractureType, { label: string; emoji: string; color: string }> = {
  distance:      { label: "تباعد",         emoji: "📏", color: "#64748b" },
  conflict:      { label: "خلاف",          emoji: "⚡", color: "#ef4444" },
  betrayal:      { label: "خيانة ثقة",     emoji: "💔", color: "#dc2626" },
  neglect:       { label: "إهمال",         emoji: "🫥", color: "#f59e0b" },
  misunderstand: { label: "سوء فهم",       emoji: "🌫️", color: "#8b5cf6" },
  boundary:      { label: "حدود مكسورة",   emoji: "🚧", color: "#f97316" },
  silence:       { label: "صمت طويل",      emoji: "🤐", color: "#6366f1" },
};

export const RELATION_META: Record<RelationKind, { label: string; emoji: string; color: string }> = {
  family:    { label: "عائلة",  emoji: "👨‍👩‍👧", color: "#ec4899" },
  friend:    { label: "صديق",   emoji: "🤝",     color: "#10b981" },
  partner:   { label: "شريك",   emoji: "💕",     color: "#f43f5e" },
  colleague: { label: "زميل",   emoji: "💼",     color: "#3b82f6" },
  self:      { label: "نفسي",   emoji: "🪞",     color: "#a78bfa" },
};

/* ═══════════════════════════════════════════ */
/*               HELPERS                      */
/* ═══════════════════════════════════════════ */

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/* ═══════════════════════════════════════════ */
/*               STORE                        */
/* ═══════════════════════════════════════════ */

export const useJisrState = create<JisrState>()(
  persist(
    (set, get) => ({
      bridges: [],
      activeBridge: null,
      currentPhase: "identify",

      startBridge: () => {
        set({
          activeBridge: { id: genId(), createdAt: Date.now(), isComplete: false },
          currentPhase: "identify",
        });
      },

      setIdentify: (data) => {
        set((s) => ({
          activeBridge: s.activeBridge ? { ...s.activeBridge, ...data } : null,
          currentPhase: "express",
        }));
      },

      setExpress: (whatIWantToSay, whatINeed) => {
        set((s) => ({
          activeBridge: s.activeBridge ? { ...s.activeBridge, whatIWantToSay, whatINeed } : null,
          currentPhase: "act",
        }));
      },

      setAct: (actionStep, deadline) => {
        set((s) => ({
          activeBridge: s.activeBridge ? { ...s.activeBridge, actionStep, deadline } : null,
        }));
      },

      completeBridge: () => {
        const active = get().activeBridge;
        if (!active) return;

        const bridge: RepairBridge = {
          id: active.id || genId(),
          createdAt: active.createdAt || Date.now(),
          personName: active.personName || "",
          relationKind: active.relationKind || "friend",
          fractureType: active.fractureType || "distance",
          whatHappened: active.whatHappened || "",
          myRole: active.myRole || "",
          whatIWantToSay: active.whatIWantToSay || "",
          whatINeed: active.whatINeed || "",
          actionStep: active.actionStep || "",
          deadline: active.deadline || "",
          isComplete: false,
        };

        set((s) => ({
          bridges: [bridge, ...s.bridges],
          activeBridge: null,
          currentPhase: "identify",
        }));
      },

      markDone: (id, note) => {
        set((s) => ({
          bridges: s.bridges.map((b) =>
            b.id === id ? { ...b, isComplete: true, completedAt: Date.now(), completionNote: note } : b
          ),
        }));
      },

      cancelBridge: () => {
        set({ activeBridge: null, currentPhase: "identify" });
      },

      removeBridge: (id) => {
        set((s) => ({ bridges: s.bridges.filter((b) => b.id !== id) }));
      },

      // Getters
      getActiveBridges: () => get().bridges.filter((b) => !b.isComplete),
      getCompletedBridges: () => get().bridges.filter((b) => b.isComplete),
      getTotalCount: () => get().bridges.length,
      getCompletedCount: () => get().bridges.filter((b) => b.isComplete).length,
    }),
    { name: "alrehla-jisr" }
  )
);
