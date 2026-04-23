/**
 * سِجل Store — Sijil: Activity Chronicle
 *
 * Aggregates activity from all products into a unified timeline
 * with heatmap, usage trends, and engagement scoring.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandIdbStorage } from '@/utils/idbStorage';


export type ActivitySource =
  | "pulse" | "wird" | "bawsala" | "watheeqa" | "nadhir"
  | "hafiz" | "mirah" | "markaz" | "sada" | "riwaya"
  | "rifaq" | "baseera" | "atmosfera" | "masarat"
  | "dawayir" | "murshid" | "taqrir" | "gamification"
  | "system";

export interface ActivityEvent {
  id: string;
  source: ActivitySource;
  emoji: string;
  action: string;       // e.g. "سجّل نبضة", "أكمل طقس"
  detail?: string;
  timestamp: number;
}

interface SijilState {
  events: ActivityEvent[];
  logEvent: (e: Omit<ActivityEvent, "id" | "timestamp">) => void;
  clearAll: () => void;
  getEventsBySource: (source: ActivitySource) => ActivityEvent[];
  getEventsByDate: (dateKey: string) => ActivityEvent[];
  getHeatmapData: () => Record<string, number>;
  getSourceStats: () => { source: ActivitySource; count: number }[];
}

export const useSijilState = create<SijilState>()(
  persist(
    (set, get) => ({
      events: [],

      logEvent: (e) =>
        set((s) => ({
          events: [
            { ...e, id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now() },
            ...s.events,
          ].slice(0, 500), // Keep max 500
        })),

      clearAll: () => set({ events: [] }),

      getEventsBySource: (source) => get().events.filter((e) => e.source === source),

      getEventsByDate: (dateKey) =>
        get().events.filter((e) => {
          const d = new Date(e.timestamp);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          return key === dateKey;
        }),

      getHeatmapData: () => {
        const map: Record<string, number> = {};
        get().events.forEach((e) => {
          const d = new Date(e.timestamp);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          map[key] = (map[key] || 0) + 1;
        });
        return map;
      },

      getSourceStats: () => {
        const counts: Record<string, number> = {};
        get().events.forEach((e) => {
          counts[e.source] = (counts[e.source] || 0) + 1;
        });
        return Object.entries(counts)
          .map(([source, count]) => ({ source: source as ActivitySource, count }))
          .sort((a, b) => b.count - a.count);
      },
    }),
    { name: "alrehla-sijil", storage: zustandIdbStorage }
  )
);
