/**
 * بصمة — Basma Store
 * Meta-Identity Fingerprint: aggregates insights from all ecosystem tools
 * into a unique personality profile — your psychological DNA.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandIdbStorage } from '@/utils/idbStorage';


export type TraitCategory = "cognitive" | "emotional" | "social" | "spiritual" | "creative" | "resilience";

export interface PersonalityTrait {
  id: string;
  category: TraitCategory;
  name: string;
  strength: number; // 1-10
  source: string; // which module discovered it
  evidence: string;
  createdAt: number;
}

export interface CoreValue {
  id: string;
  value: string;
  rank: number; // 1-5
  why: string;
  createdAt: number;
}

export interface IdentityStatement {
  id: string;
  statement: string; // "أنا شخص..."
  confidence: number; // 1-5
  date: string;
  createdAt: number;
}

export interface BasmaState {
  traits: PersonalityTrait[];
  values: CoreValue[];
  statements: IdentityStatement[];
  addTrait: (data: Omit<PersonalityTrait, "id" | "createdAt">) => void;
  removeTrait: (id: string) => void;
  addValue: (value: string, rank: number, why?: string) => void;
  removeValue: (id: string) => void;
  addStatement: (statement: string, confidence: number) => void;
  removeStatement: (id: string) => void;
  getByCategory: (cat: TraitCategory) => PersonalityTrait[];
  getTopTraits: (n: number) => PersonalityTrait[];
  getIdentityScore: () => number;
  getCategoryStrengths: () => Record<TraitCategory, number>;
  getUniqueSignature: () => string;
}

export const CATEGORY_META: Record<TraitCategory, { label: string; emoji: string; color: string }> = {
  cognitive:   { label: "العقلي",    emoji: "🧠", color: "#6366f1" },
  emotional:   { label: "العاطفي",   emoji: "💗", color: "#ec4899" },
  social:      { label: "الاجتماعي", emoji: "🤝", color: "#22c55e" },
  spiritual:   { label: "الروحي",    emoji: "🕊️", color: "#8b5cf6" },
  creative:    { label: "الإبداعي",  emoji: "🎨", color: "#f59e0b" },
  resilience:  { label: "المرونة",   emoji: "🛡️", color: "#ef4444" },
};

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const useBasmaState = create<BasmaState>()(
  persist(
    (set, get) => ({
      traits: [], values: [], statements: [],

      addTrait: (data) => {
        const trait: PersonalityTrait = { ...data, id: genId(), createdAt: Date.now() };
        set(s => ({ traits: [trait, ...s.traits].slice(0, 100) }));
      },
      removeTrait: (id) => set(s => ({ traits: s.traits.filter(t => t.id !== id) })),

      addValue: (value, rank, why = "") => {
        set(s => ({ values: [{ id: genId(), value: value.trim(), rank, why: why.trim(), createdAt: Date.now() }, ...s.values].slice(0, 20) }));
      },
      removeValue: (id) => set(s => ({ values: s.values.filter(v => v.id !== id) })),

      addStatement: (statement, confidence) => {
        set(s => ({ statements: [{ id: genId(), statement: statement.trim(), confidence, date: new Date().toISOString().slice(0, 10), createdAt: Date.now() }, ...s.statements].slice(0, 50) }));
      },
      removeStatement: (id) => set(s => ({ statements: s.statements.filter(st => st.id !== id) })),

      getByCategory: (cat) => get().traits.filter(t => t.category === cat),

      getTopTraits: (n) => [...get().traits].sort((a, b) => b.strength - a.strength).slice(0, n),

      getIdentityScore: () => {
        const { traits, values, statements } = get();
        const traitScore = Math.min(traits.length * 5, 30);
        const valueScore = Math.min(values.length * 8, 30);
        const statementScore = Math.min(statements.length * 6, 20);
        const categoryCount = new Set(traits.map(t => t.category)).size;
        const diversityScore = Math.min(categoryCount * 5, 20);
        return Math.min(traitScore + valueScore + statementScore + diversityScore, 100);
      },

      getCategoryStrengths: () => {
        const cats = Object.keys(CATEGORY_META) as TraitCategory[];
        const result: Record<string, number> = {};
        cats.forEach(c => {
          const items = get().traits.filter(t => t.category === c);
          result[c] = items.length ? Math.round((items.reduce((a, t) => a + t.strength, 0) / items.length) * 10) / 10 : 0;
        });
        return result as Record<TraitCategory, number>;
      },

      getUniqueSignature: () => {
        const top = get().getTopTraits(3);
        if (!top.length) return "بصمتك في انتظار الاكتشاف";
        return top.map(t => t.name).join(" · ");
      },
    }),
    { name: "alrehla-basma", storage: zustandIdbStorage }
  )
);
