/**
 * ظل — Zill Store
 * Shadow Work: explore repressed emotions, denied traits, and unconscious patterns.
 * World-first: structured shadow integration in a personal growth app.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandIdbStorage } from '@/utils/idbStorage';


export type ShadowType = "emotion" | "trait" | "belief" | "memory" | "pattern" | "projection";
export type IntegrationLevel = 1 | 2 | 3 | 4 | 5; // 1=fully repressed, 5=integrated

export interface ShadowEntry {
  id: string;
  type: ShadowType;
  trigger: string;
  hiddenNeed: string;
  origin: string;
  integration: IntegrationLevel;
  reflections: string[];
  createdAt: number;
  date: string;
}

export interface ZillState {
  shadows: ShadowEntry[];
  addShadow: (data: Omit<ShadowEntry, "id" | "createdAt" | "date" | "reflections">) => void;
  removeShadow: (id: string) => void;
  addReflection: (id: string, text: string) => void;
  updateIntegration: (id: string, level: IntegrationLevel) => void;
  getByType: (type: ShadowType) => ShadowEntry[];
  getIntegrationScore: () => number;
  getMostRepressed: () => ShadowType | null;
  getMostIntegrated: () => ShadowType | null;
  getTotalShadows: () => number;
}

export const SHADOW_META: Record<ShadowType, { label: string; emoji: string; color: string; prompt: string }> = {
  emotion:    { label: "مشاعر مكبوتة",  emoji: "🌊", color: "#6366f1", prompt: "ما المشاعر التي تتجنب الاعتراف بها؟" },
  trait:      { label: "صفات منكرة",    emoji: "🪞", color: "#8b5cf6", prompt: "ما الصفات التي ترفض رؤيتها في نفسك؟" },
  belief:     { label: "معتقدات خفية",  emoji: "🔒", color: "#ef4444", prompt: "ما المعتقدات التي تتحكم فيك دون وعي؟" },
  memory:     { label: "ذكريات مدفونة", emoji: "🕳️", color: "#f97316", prompt: "ما الذكريات التي تتجنب تذكرها؟" },
  pattern:    { label: "أنماط لاواعية", emoji: "🔁", color: "#06b6d4", prompt: "ما الأنماط التي تتكرر رغم محاولاتك؟" },
  projection: { label: "إسقاطات",       emoji: "🎭", color: "#ec4899", prompt: "ما الذي يزعجك في الآخرين وهو فيك؟" },
};

export const INTEGRATION_META: Record<IntegrationLevel, { label: string; emoji: string; color: string }> = {
  1: { label: "مكبوت تماماً",  emoji: "⚫", color: "#1e1b4b" },
  2: { label: "يظهر أحياناً",  emoji: "🌑", color: "#4c1d95" },
  3: { label: "واعي به",       emoji: "🌓", color: "#7c3aed" },
  4: { label: "أتعامل معه",    emoji: "🌔", color: "#a78bfa" },
  5: { label: "مدمج وواعي",    emoji: "🌕", color: "#c4b5fd" },
};

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const useZillState = create<ZillState>()(
  persist(
    (set, get) => ({
      shadows: [],

      addShadow: (data) => {
        const entry: ShadowEntry = { ...data, id: genId(), createdAt: Date.now(), date: new Date().toISOString().slice(0, 10), reflections: [] };
        set(s => ({ shadows: [entry, ...s.shadows].slice(0, 200) }));
      },

      removeShadow: (id) => set(s => ({ shadows: s.shadows.filter(e => e.id !== id) })),

      addReflection: (id, text) => set(s => ({
        shadows: s.shadows.map(e => e.id === id ? { ...e, reflections: [...e.reflections, text.trim()].slice(0, 20) } : e),
      })),

      updateIntegration: (id, level) => set(s => ({
        shadows: s.shadows.map(e => e.id === id ? { ...e, integration: level } : e),
      })),

      getByType: (type) => get().shadows.filter(e => e.type === type),

      getIntegrationScore: () => {
        const s = get().shadows;
        if (!s.length) return 0;
        return Math.round((s.reduce((a, e) => a + e.integration, 0) / (s.length * 5)) * 100);
      },

      getMostRepressed: () => {
        const s = get().shadows;
        if (!s.length) return null;
        const byType: Record<string, number[]> = {};
        s.forEach(e => { (byType[e.type] ??= []).push(e.integration); });
        const avgs = Object.entries(byType).map(([t, vals]) => ({ t, avg: vals.reduce((a, v) => a + v, 0) / vals.length }));
        return (avgs.sort((a, b) => a.avg - b.avg)[0]?.t || null) as ShadowType | null;
      },

      getMostIntegrated: () => {
        const s = get().shadows;
        if (!s.length) return null;
        const byType: Record<string, number[]> = {};
        s.forEach(e => { (byType[e.type] ??= []).push(e.integration); });
        const avgs = Object.entries(byType).map(([t, vals]) => ({ t, avg: vals.reduce((a, v) => a + v, 0) / vals.length }));
        return (avgs.sort((a, b) => b.avg - a.avg)[0]?.t || null) as ShadowType | null;
      },

      getTotalShadows: () => get().shadows.length,
    }),
    { name: "alrehla-zill", storage: zustandIdbStorage }
  )
);
