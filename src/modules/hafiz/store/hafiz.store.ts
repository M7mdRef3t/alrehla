/**
 * حافظ Store — Hafiz: Memory Vault
 *
 * Manages bookmarked moments, collections, and memory retrieval.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandIdbStorage } from '@/utils/idbStorage';


export type MemorySource =
  | "pulse"
  | "wird"
  | "bawsala"
  | "watheeqa"
  | "nadhir"
  | "riwaya"
  | "connection_event"
  | "manual";

export type MemoryTag =
  | "joy"
  | "achievement"
  | "lesson"
  | "pain"
  | "gratitude"
  | "turning_point"
  | "nonmaterial_connection"
  | "custom";

export interface Memory {
  id: string;
  title: string;
  content: string;
  source: MemorySource;
  tags: MemoryTag[];
  customTag?: string;
  emoji: string;
  timestamp: number;
  savedAt: number;
  starred: boolean;
}

export interface Collection {
  id: string;
  name: string;
  emoji: string;
  memoryIds: string[];
  createdAt: number;
}

interface HafizState {
  memories: Memory[];
  collections: Collection[];

  // Memory CRUD
  addMemory: (m: Omit<Memory, "id" | "savedAt">) => string;
  removeMemory: (id: string) => void;
  toggleStar: (id: string) => void;
  updateMemory: (id: string, updates: Partial<Pick<Memory, "title" | "content" | "tags" | "emoji" | "customTag">>) => void;

  // Collection CRUD
  addCollection: (name: string, emoji: string) => string;
  removeCollection: (id: string) => void;
  addToCollection: (collectionId: string, memoryId: string) => void;
  removeFromCollection: (collectionId: string, memoryId: string) => void;

  // Queries
  getMemoriesByTag: (tag: MemoryTag) => Memory[];
  getMemoriesBySource: (source: MemorySource) => Memory[];
  getStarred: () => Memory[];
  searchMemories: (query: string) => Memory[];
  getOnThisDay: () => Memory[];
}

export const useHafizState = create<HafizState>()(
  persist(
    (set, get) => ({
      memories: [],
      collections: [],

      addMemory: (m) => {
        const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        set((s) => ({
          memories: [{ ...m, id, savedAt: Date.now() }, ...s.memories],
        }));
        return id;
      },

      removeMemory: (id) =>
        set((s) => ({
          memories: s.memories.filter((m) => m.id !== id),
          collections: s.collections.map((c) => ({
            ...c,
            memoryIds: c.memoryIds.filter((mid) => mid !== id),
          })),
        })),

      toggleStar: (id) =>
        set((s) => ({
          memories: s.memories.map((m) =>
            m.id === id ? { ...m, starred: !m.starred } : m
          ),
        })),

      updateMemory: (id, updates) =>
        set((s) => ({
          memories: s.memories.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      addCollection: (name, emoji) => {
        const id = `col_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        set((s) => ({
          collections: [...s.collections, { id, name, emoji, memoryIds: [], createdAt: Date.now() }],
        }));
        return id;
      },

      removeCollection: (id) =>
        set((s) => ({ collections: s.collections.filter((c) => c.id !== id) })),

      addToCollection: (collectionId, memoryId) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === collectionId && !c.memoryIds.includes(memoryId)
              ? { ...c, memoryIds: [...c.memoryIds, memoryId] }
              : c
          ),
        })),

      removeFromCollection: (collectionId, memoryId) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === collectionId
              ? { ...c, memoryIds: c.memoryIds.filter((mid) => mid !== memoryId) }
              : c
          ),
        })),

      getMemoriesByTag: (tag) => get().memories.filter((m) => m.tags.includes(tag)),
      getMemoriesBySource: (source) => get().memories.filter((m) => m.source === source),
      getStarred: () => get().memories.filter((m) => m.starred),

      searchMemories: (query) => {
        const q = query.toLowerCase();
        return get().memories.filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            m.content.toLowerCase().includes(q) ||
            m.customTag?.toLowerCase().includes(q)
        );
      },

      getOnThisDay: () => {
        const now = new Date();
        const month = now.getMonth();
        const day = now.getDate();
        return get().memories.filter((m) => {
          const d = new Date(m.timestamp);
          return d.getMonth() === month && d.getDate() === day && d.getFullYear() < now.getFullYear();
        });
      },
    }),
    { name: "alrehla-hafiz", storage: zustandIdbStorage }
  )
);

/**
 * ◈ Vertical Resonance State ◈
 * Rich state object for the Divine Connection.
 * Used by AI agents, components, and scoring systems.
 */
export interface VerticalResonanceState {
  /** Connection strength (0 to 1) */
  strength: number;
  /** Human-readable level */
  level: 'disconnected' | 'flickering' | 'steady' | 'radiant';
  /** Arabic label for the level */
  label: string;
  /** Consecutive days of Wird activity */
  daysActive: number;
  /** Timestamp of last spiritual activity */
  lastActivity: number | null;
  /** Days since last activity (0 = today) */
  daysSinceLastActivity: number;
  /** Today's total dhikr count */
  todayCount: number;
}

/**
 * Calculates the "Spiritual Resonance" (Vertical Connection Strength)
 * Based on recent (last 7 days) Wird activity and Gratitude moments.
 * ⚠️ Legacy: uses hafiz memories. For accurate data use getVerticalResonanceState().
 */
export const calculateVerticalResonance = (memories: Memory[]): number => {
  // Try to get real Wird data first (lazy import to avoid circular deps)
  try {
    const { useWirdState } = require('@/modules/wird/store/wird.store');
    const wirdState = useWirdState.getState();
    const streak = wirdState.getStreak();
    const todayTotal = wirdState.getDailyTotal();
    
    // Base connection of 0.4 (Fitra)
    // Streak adds 5% per day (max 6 days = +30%)
    // Today's activity adds bonus (max 30%)
    const streakBonus = Math.min(streak * 0.05, 0.3);
    const todayBonus = Math.min(todayTotal / 100, 0.3);
    return Math.min(1, 0.4 + streakBonus + todayBonus);
  } catch {
    // Fallback to hafiz memories
    const recentDays = 7;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const recentMemories = memories.filter(m => (now - m.timestamp) < (recentDays * dayMs));
    const wirdCount = recentMemories.filter(m => m.source === 'wird').length;
    const gratitudeCount = recentMemories.filter(m => m.tags.includes('gratitude')).length;
    const strength = 0.4 + (wirdCount * 0.1) + (gratitudeCount * 0.1);
    return Math.min(1, strength);
  }
};

/**
 * ◈ Get Vertical Resonance State ◈
 * Returns a rich state object that AI agents and components can consume.
 * This is the "system-wide signal" for the Divine Connection.
 * 
 * Reads from BOTH wird.store (primary) and hafiz.store (supplementary).
 */
export const getVerticalResonanceState = (memories: Memory[]): VerticalResonanceState => {
  let streak = 0;
  let todayTotal = 0;
  let lastWirdDate: string | null = null;
  
  // Read from Wird store (the actual source of truth)
  try {
    const { useWirdState } = require('@/modules/wird/store/wird.store');
    const wirdState = useWirdState.getState();
    streak = wirdState.getStreak();
    todayTotal = wirdState.getDailyTotal();
    
    // Find last activity date from progress
    const progress = wirdState.progress || [];
    if (progress.length > 0) {
      const sorted = [...progress].sort((a: any, b: any) => b.date.localeCompare(a.date));
      lastWirdDate = sorted[0]?.date;
    }
  } catch {
    // wird store not available, fall through
  }
  
  // Supplement with hafiz memories (gratitude)
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const gratitudeMemories = memories
    .filter(m => m.tags.includes('gratitude'))
    .sort((a, b) => b.timestamp - a.timestamp);
  const gratitudeCount = gratitudeMemories
    .filter(m => (now - m.timestamp) < (7 * dayMs)).length;
  
  // Calculate strength
  // Base: 0.4 (Fitra) + streak bonus + today bonus + gratitude bonus
  const streakBonus = Math.min(streak * 0.05, 0.3);
  const todayBonus = Math.min(todayTotal / 100, 0.2);
  const gratitudeBonus = Math.min(gratitudeCount * 0.05, 0.1);
  const strength = Math.min(1, 0.4 + streakBonus + todayBonus + gratitudeBonus);

  // Calculate days since last activity
  let daysSinceLastActivity = 999;
  let lastActivity: number | null = null;
  
  if (lastWirdDate) {
    const lastDate = new Date(lastWirdDate).getTime();
    daysSinceLastActivity = Math.floor((now - lastDate) / dayMs);
    lastActivity = lastDate;
  } else if (gratitudeMemories.length > 0) {
    lastActivity = gratitudeMemories[0].timestamp;
    daysSinceLastActivity = Math.floor((now - lastActivity) / dayMs);
  }

  // Determine level
  let level: VerticalResonanceState['level'];
  let label: string;
  
  if (strength >= 0.85) {
    level = 'radiant';
    label = 'مُشِع';
  } else if (strength >= 0.6) {
    level = 'steady';
    label = 'مستقر';
  } else if (strength >= 0.45) {
    level = 'flickering';
    label = 'متذبذب';
  } else {
    level = 'disconnected';
    label = 'منقطع';
  }

  return {
    strength,
    level,
    label,
    daysActive: streak,
    lastActivity,
    daysSinceLastActivity,
    todayCount: todayTotal,
  };
};

