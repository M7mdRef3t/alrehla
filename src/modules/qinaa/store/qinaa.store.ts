/**
 * قناع — Qinaa Store
 *
 * Mask Detection: explore the gap between your authentic self
 * and the masks you wear in different life contexts.
 * World-first: no app maps the mask-authenticity spectrum.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ═══════════════════════════════════════════ */
/*                 TYPES                      */
/* ═══════════════════════════════════════════ */

export type LifeContext = "family" | "work" | "friends" | "partner" | "social" | "alone";
export type MaskIntensity = 1 | 2 | 3 | 4 | 5; // 1=authentic, 5=full mask

export interface MaskLayer {
  id: string;
  context: LifeContext;
  whatIShow: string;      // "I pretend to be..."
  whatIHide: string;      // "I actually feel..."
  whyIMask: string;       // "Because I fear..."
  intensity: MaskIntensity;
  createdAt: number;
  date: string;
}

export interface AuthenticTrail {
  id: string;
  context: LifeContext;
  moment: string;         // "I was truly myself when..."
  feeling: string;        // How it felt
  createdAt: number;
}

export interface ContextProfile {
  context: LifeContext;
  avgIntensity: number;
  maskCount: number;
  authenticCount: number;
  gap: number;            // 0-100 gap score
}

export interface QinaaState {
  masks: MaskLayer[];
  authenticMoments: AuthenticTrail[];

  // Actions
  addMask: (data: Omit<MaskLayer, "id" | "createdAt" | "date">) => void;
  removeMask: (id: string) => void;
  addAuthenticMoment: (data: Omit<AuthenticTrail, "id" | "createdAt">) => void;
  removeAuthenticMoment: (id: string) => void;

  // Getters
  getByContext: (ctx: LifeContext) => MaskLayer[];
  getContextProfile: (ctx: LifeContext) => ContextProfile;
  getAllProfiles: () => ContextProfile[];
  getOverallAuthenticity: () => number;     // 0-100
  getMostMasked: () => LifeContext | null;
  getMostAuthentic: () => LifeContext | null;
  getTotalMasks: () => number;
}

/* ═══════════════════════════════════════════ */
/*              CONSTANTS                     */
/* ═══════════════════════════════════════════ */

export const CONTEXT_META: Record<LifeContext, { label: string; emoji: string; color: string; desc: string }> = {
  family:  { label: "العائلة",    emoji: "👨‍👩‍👧‍👦", color: "#ec4899", desc: "مع أهلك وعائلتك" },
  work:    { label: "العمل",      emoji: "💼",       color: "#f59e0b", desc: "في بيئة العمل" },
  friends: { label: "الأصدقاء",   emoji: "👥",       color: "#22c55e", desc: "مع أصحابك المقربين" },
  partner: { label: "الشريك",     emoji: "💞",       color: "#ef4444", desc: "مع شريك حياتك" },
  social:  { label: "المجتمع",    emoji: "🌐",       color: "#6366f1", desc: "على السوشيال ميديا والمجتمع" },
  alone:   { label: "وحدك",       emoji: "🪞",       color: "#8b5cf6", desc: "عندما تكون مع نفسك" },
};

export const INTENSITY_META: Record<MaskIntensity, { label: string; emoji: string; color: string }> = {
  1: { label: "حقيقي تماماً",   emoji: "🟢", color: "#22c55e" },
  2: { label: "شبه حقيقي",      emoji: "🟡", color: "#84cc16" },
  3: { label: "نصف ونصف",       emoji: "🟠", color: "#f59e0b" },
  4: { label: "قناع واضح",      emoji: "🔴", color: "#f97316" },
  5: { label: "قناع كامل",      emoji: "⚫", color: "#ef4444" },
};

/* ═══════════════════════════════════════════ */
/*               STORE                        */
/* ═══════════════════════════════════════════ */

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const useQinaaState = create<QinaaState>()(
  persist(
    (set, get) => ({
      masks: [],
      authenticMoments: [],

      addMask: (data) => {
        const mask: MaskLayer = { ...data, id: genId(), createdAt: Date.now(), date: new Date().toISOString().slice(0, 10) };
        set((s) => ({ masks: [mask, ...s.masks].slice(0, 200) }));
      },

      removeMask: (id) => set((s) => ({ masks: s.masks.filter((m) => m.id !== id) })),

      addAuthenticMoment: (data) => {
        const moment: AuthenticTrail = { ...data, id: genId(), createdAt: Date.now() };
        set((s) => ({ authenticMoments: [moment, ...s.authenticMoments].slice(0, 200) }));
      },

      removeAuthenticMoment: (id) => set((s) => ({
        authenticMoments: s.authenticMoments.filter((m) => m.id !== id),
      })),

      getByContext: (ctx) => get().masks.filter((m) => m.context === ctx),

      getContextProfile: (ctx) => {
        const ctxMasks = get().masks.filter((m) => m.context === ctx);
        const ctxAuth = get().authenticMoments.filter((m) => m.context === ctx);
        const avgIntensity = ctxMasks.length > 0
          ? ctxMasks.reduce((a, m) => a + m.intensity, 0) / ctxMasks.length
          : 0;
        const gap = Math.round(avgIntensity * 20); // 0-100
        return { context: ctx, avgIntensity, maskCount: ctxMasks.length, authenticCount: ctxAuth.length, gap };
      },

      getAllProfiles: () => {
        const contexts: LifeContext[] = ["family", "work", "friends", "partner", "social", "alone"];
        return contexts.map((c) => get().getContextProfile(c));
      },

      getOverallAuthenticity: () => {
        const profiles = get().getAllProfiles();
        const withData = profiles.filter((p) => p.maskCount > 0);
        if (withData.length === 0) return 100;
        const avgGap = withData.reduce((a, p) => a + p.gap, 0) / withData.length;
        return Math.max(0, Math.round(100 - avgGap));
      },

      getMostMasked: () => {
        const profiles = get().getAllProfiles().filter((p) => p.maskCount > 0);
        if (profiles.length === 0) return null;
        return profiles.sort((a, b) => b.gap - a.gap)[0].context;
      },

      getMostAuthentic: () => {
        const profiles = get().getAllProfiles().filter((p) => p.maskCount > 0);
        if (profiles.length === 0) return null;
        return profiles.sort((a, b) => a.gap - b.gap)[0].context;
      },

      getTotalMasks: () => get().masks.length,
    }),
    { name: "alrehla-qinaa" }
  )
);
