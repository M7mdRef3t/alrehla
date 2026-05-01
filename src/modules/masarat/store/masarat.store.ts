import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PathId, Ring, ContactLevel } from "@alrehla/masarat";

export interface MasaratState {
  activePathId: PathId | null;
  history: Array<{ pathId: PathId; timestamp: number; ring: Ring; contact: ContactLevel }>;
  actions: {
    setActivePath: (pathId: PathId, ring?: Ring, contact?: ContactLevel) => void;
    clearActivePath: () => void;
  };
}

export const useMasaratStore = create<MasaratState>()(
  persist(
    (set) => ({
      activePathId: null,
      history: [],
      actions: {
        setActivePath: (pathId, ring, contact) =>
          set((state) => {
            const newHistory = [...state.history];
            if (ring && contact) {
              newHistory.unshift({ pathId, timestamp: Date.now(), ring, contact });
            }
            return {
              activePathId: pathId,
              history: newHistory.slice(0, 10), // Keep last 10
            };
          }),
        clearActivePath: () => set({ activePathId: null }),
      },
    }),
    {
      name: "alrehla-masarat-storage",
      partialize: (state) => ({
        activePathId: state.activePathId,
        history: state.history,
      }),
    }
  )
);
