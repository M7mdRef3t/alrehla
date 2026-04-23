/**
 * كنز — Kanz Store
 *
 * Personal Wisdom Bank: collect lessons, quotes, moments, and insights from your journey.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandIdbStorage } from '@/utils/idbStorage';


/* ═══════════════════════════════════════════ */
/*                 TYPES                      */
/* ═══════════════════════════════════════════ */

export type GemCategory = "lesson" | "quote" | "moment" | "insight" | "dua" | "gratitude";

export type GemSource = "manual" | "tazkiya" | "jisr" | "warsha" | "khalwa" | "risala" | "wird" | "other";

export interface Gem {
  id: string;
  content: string;
  category: GemCategory;
  source: GemSource;
  emoji: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: number;
}

export interface KanzState {
  gems: Gem[];

  // Actions
  addGem: (data: { content: string; category: GemCategory; source?: GemSource; emoji?: string; tags?: string[] }) => void;
  removeGem: (id: string) => void;
  toggleFavorite: (id: string) => void;
  updateGem: (id: string, updates: Partial<Pick<Gem, "content" | "category" | "emoji" | "tags">>) => void;

  // Getters
  getFavorites: () => Gem[];
  getByCategory: (cat: GemCategory) => Gem[];
  getBySource: (src: GemSource) => Gem[];
  getRecentGems: (n: number) => Gem[];
  getTotalCount: () => number;
  getCategoryStats: () => { category: GemCategory; count: number }[];
}

/* ═══════════════════════════════════════════ */
/*              CONSTANTS                     */
/* ═══════════════════════════════════════════ */

export const CATEGORY_META: Record<GemCategory, { label: string; emoji: string; color: string }> = {
  lesson:    { label: "درس",     emoji: "📖", color: "#f59e0b" },
  quote:     { label: "اقتباس",  emoji: "💬", color: "#8b5cf6" },
  moment:    { label: "لحظة",    emoji: "✨", color: "#ec4899" },
  insight:   { label: "بصيرة",   emoji: "👁️", color: "#06b6d4" },
  dua:       { label: "دعاء",    emoji: "🤲", color: "#10b981" },
  gratitude: { label: "امتنان",  emoji: "🙏", color: "#f97316" },
};

export const SOURCE_META: Record<GemSource, { label: string; emoji: string }> = {
  manual:  { label: "يدوي",     emoji: "✏️" },
  tazkiya: { label: "تزكية",    emoji: "🕊️" },
  jisr:    { label: "جسر",      emoji: "🌉" },
  warsha:  { label: "ورشة",     emoji: "🏋️" },
  khalwa:  { label: "خلوة",     emoji: "🧘" },
  risala:  { label: "رسالة",    emoji: "💌" },
  wird:    { label: "وِرد",     emoji: "📿" },
  other:   { label: "أخرى",     emoji: "📌" },
};

/* ═══════════════════════════════════════════ */
/*               STORE                        */
/* ═══════════════════════════════════════════ */

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const useKanzState = create<KanzState>()(
  persist(
    (set, get) => ({
      gems: [],

      addGem: ({ content, category, source = "manual", emoji, tags = [] }) => {
        const gem: Gem = {
          id: genId(),
          content,
          category,
          source,
          emoji: emoji || CATEGORY_META[category].emoji,
          tags,
          isFavorite: false,
          createdAt: Date.now(),
        };
        set((s) => ({ gems: [gem, ...s.gems] }));
      },

      removeGem: (id) => {
        set((s) => ({ gems: s.gems.filter((g) => g.id !== id) }));
      },

      toggleFavorite: (id) => {
        set((s) => ({
          gems: s.gems.map((g) => g.id === id ? { ...g, isFavorite: !g.isFavorite } : g),
        }));
      },

      updateGem: (id, updates) => {
        set((s) => ({
          gems: s.gems.map((g) => g.id === id ? { ...g, ...updates } : g),
        }));
      },

      getFavorites: () => get().gems.filter((g) => g.isFavorite),
      getByCategory: (cat) => get().gems.filter((g) => g.category === cat),
      getBySource: (src) => get().gems.filter((g) => g.source === src),
      getRecentGems: (n) => get().gems.slice(0, n),
      getTotalCount: () => get().gems.length,
      getCategoryStats: () => {
        const gems = get().gems;
        return (Object.keys(CATEGORY_META) as GemCategory[]).map((cat) => ({
          category: cat,
          count: gems.filter((g) => g.category === cat).length,
        }));
      },
    }),
    { name: "alrehla-kanz", storage: zustandIdbStorage }
  )
);
