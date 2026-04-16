/**
 * بذرة — Bathra Store
 *
 * Micro-habits garden: plant seeds, water daily, watch them grow.
 * Growth stages: بذرة (seed) → برعم (sprout) → شتلة (sapling) → شجرة (tree)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ═══════════════════════════════════════════ */
/*                 TYPES                      */
/* ═══════════════════════════════════════════ */

export type GrowthStage = "seed" | "sprout" | "sapling" | "tree";

export type HabitCategory = "mind" | "body" | "soul" | "social" | "skill";

export interface WaterLog {
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface Seed {
  id: string;
  title: string;
  emoji: string;
  category: HabitCategory;
  /** How many minutes this habit takes (max 5) */
  duration: number;
  /** Growth stage based on streak */
  stage: GrowthStage;
  /** Total days watered */
  totalWatered: number;
  /** Current streak */
  currentStreak: number;
  /** Best streak ever */
  bestStreak: number;
  /** Daily water logs */
  waterLogs: WaterLog[];
  createdAt: number;
  /** If retired/archived */
  archivedAt?: number;
}

export interface BathraState {
  seeds: Seed[];

  // Actions
  plantSeed: (data: { title: string; emoji: string; category: HabitCategory; duration: number }) => void;
  waterSeed: (id: string, note?: string) => void;
  archiveSeed: (id: string) => void;

  // Getters
  getActiveSeeds: () => Seed[];
  getArchivedSeeds: () => Seed[];
  getGardenStats: () => {
    totalSeeds: number;
    totalWatered: number;
    treesGrown: number;
    bestStreak: number;
    todayWatered: number;
    todayTotal: number;
  };
  isWateredToday: (id: string) => boolean;
  getCategoryStats: () => { category: HabitCategory; count: number; avgStreak: number }[];
}

/* ═══════════════════════════════════════════ */
/*              CONSTANTS                     */
/* ═══════════════════════════════════════════ */

export const MS_PER_DAY = 86400000;

export const CATEGORY_META: Record<HabitCategory, { label: string; emoji: string; color: string }> = {
  mind:   { label: "العقل",    emoji: "🧠", color: "#818cf8" },
  body:   { label: "الجسم",    emoji: "💪", color: "#f472b6" },
  soul:   { label: "الروح",    emoji: "🕊️", color: "#a78bfa" },
  social: { label: "الاجتماعي", emoji: "🤝", color: "#fb923c" },
  skill:  { label: "المهارة",  emoji: "⚡", color: "#38bdf8" },
};

export const STAGE_META: Record<GrowthStage, { label: string; emoji: string; minDays: number }> = {
  seed:    { label: "بذرة",  emoji: "🌰", minDays: 0 },
  sprout:  { label: "برعم",  emoji: "🌱", minDays: 3 },
  sapling: { label: "شتلة",  emoji: "🌿", minDays: 7 },
  tree:    { label: "شجرة",  emoji: "🌳", minDays: 21 },
};

/* ═══════════════════════════════════════════ */
/*               HELPERS                      */
/* ═══════════════════════════════════════════ */

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const todayKey = () => new Date().toISOString().slice(0, 10);

function calcStage(streak: number): GrowthStage {
  if (streak >= 21) return "tree";
  if (streak >= 7) return "sapling";
  if (streak >= 3) return "sprout";
  return "seed";
}

function calcStreak(logs: WaterLog[]): number {
  if (logs.length === 0) return 0;

  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const today = todayKey();
  const yesterday = new Date(Date.now() - MS_PER_DAY).toISOString().slice(0, 10);

  // Check if the last log is today or yesterday
  if (sorted[0].date !== today && sorted[0].date !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const curr = new Date(sorted[i - 1].date);
    const prev = new Date(sorted[i].date);
    const diff = (curr.getTime() - prev.getTime()) / MS_PER_DAY;
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/* ═══════════════════════════════════════════ */
/*               STORE                        */
/* ═══════════════════════════════════════════ */

export const useBathraState = create<BathraState>()(
  persist(
    (set, get) => ({
      seeds: [],

      plantSeed: ({ title, emoji, category, duration }) => {
        const seed: Seed = {
          id: genId(),
          title,
          emoji,
          category,
          duration: Math.min(duration, 5),
          stage: "seed",
          totalWatered: 0,
          currentStreak: 0,
          bestStreak: 0,
          waterLogs: [],
          createdAt: Date.now(),
        };
        set((s) => ({ seeds: [...s.seeds, seed] }));
      },

      waterSeed: (id, note) => {
        const today = todayKey();
        set((s) => ({
          seeds: s.seeds.map((seed) => {
            if (seed.id !== id) return seed;
            // Don't water twice same day
            if (seed.waterLogs.some((l) => l.date === today)) return seed;

            const newLogs = [...seed.waterLogs, { date: today, note }];
            const streak = calcStreak(newLogs);
            const best = Math.max(seed.bestStreak, streak);
            const stage = calcStage(streak);

            return {
              ...seed,
              waterLogs: newLogs,
              totalWatered: seed.totalWatered + 1,
              currentStreak: streak,
              bestStreak: best,
              stage,
            };
          }),
        }));
      },

      archiveSeed: (id) => {
        set((s) => ({
          seeds: s.seeds.map((seed) =>
            seed.id === id ? { ...seed, archivedAt: Date.now() } : seed
          ),
        }));
      },

      // Getters
      getActiveSeeds: () => get().seeds.filter((s) => !s.archivedAt),
      getArchivedSeeds: () => get().seeds.filter((s) => !!s.archivedAt),

      getGardenStats: () => {
        const seeds = get().seeds.filter((s) => !s.archivedAt);
        const today = todayKey();
        return {
          totalSeeds: seeds.length,
          totalWatered: seeds.reduce((sum, s) => sum + s.totalWatered, 0),
          treesGrown: seeds.filter((s) => s.stage === "tree").length,
          bestStreak: seeds.reduce((max, s) => Math.max(max, s.bestStreak), 0),
          todayWatered: seeds.filter((s) => s.waterLogs.some((l) => l.date === today)).length,
          todayTotal: seeds.length,
        };
      },

      isWateredToday: (id) => {
        const seed = get().seeds.find((s) => s.id === id);
        if (!seed) return false;
        return seed.waterLogs.some((l) => l.date === todayKey());
      },

      getCategoryStats: () => {
        const seeds = get().seeds.filter((s) => !s.archivedAt);
        const cats = [...new Set(seeds.map((s) => s.category))];
        return cats.map((cat) => {
          const catSeeds = seeds.filter((s) => s.category === cat);
          return {
            category: cat,
            count: catSeeds.length,
            avgStreak: catSeeds.length > 0
              ? Math.round(catSeeds.reduce((sum, s) => sum + s.currentStreak, 0) / catSeeds.length)
              : 0,
          };
        });
      },
    }),
    { name: "alrehla-bathra" }
  )
);
