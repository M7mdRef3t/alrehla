/**
 * حافظ Store — Hafiz: Memory Vault
 *
 * Manages bookmarked moments, collections, and memory retrieval.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MemorySource =
  | "pulse"
  | "wird"
  | "bawsala"
  | "watheeqa"
  | "nadhir"
  | "riwaya"
  | "manual";

export type MemoryTag =
  | "joy"
  | "achievement"
  | "lesson"
  | "pain"
  | "gratitude"
  | "turning_point"
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
    { name: "alrehla-hafiz" }
  )
);
