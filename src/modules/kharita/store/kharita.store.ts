import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getVerticalResonanceState, useHafizState } from "../../hafiz/store/hafiz.store";

export interface KharitaState {
  currentProgressLevel: number;
  unlockedTools: string[];
  lastActiveNodeId: string | null;
  actions: {
    setProgressLevel: (level: number) => void;
    unlockTool: (toolId: string) => void;
    setLastActiveNode: (nodeId: string) => void;
    syncWithVerticalAxis: () => void;
  };
}

export const useKharitaStore = create<KharitaState>()(
  persist(
    (set, get) => ({
      currentProgressLevel: 0,
      unlockedTools: ["bawsala"], // default start
      lastActiveNodeId: null,
      actions: {
        setProgressLevel: (level) => set({ currentProgressLevel: level }),
        unlockTool: (toolId) =>
          set((state) => ({
            unlockedTools: state.unlockedTools.includes(toolId)
              ? state.unlockedTools
              : [...state.unlockedTools, toolId],
          })),
        setLastActiveNode: (nodeId) => set({ lastActiveNodeId: nodeId }),
        syncWithVerticalAxis: () => {
          // Implementing the Vertical Axis Doctrine
          try {
            const memories = useHafizState.getState().memories;
            const resonance = getVerticalResonanceState(memories);
            // Optional: boost progress or adapt map visuals based on resonance
            if (resonance.strength > 0.8 && get().currentProgressLevel < 100) {
              // Minimal alignment boost
            }
          } catch (e) {
            // Ignore if hafiz store is not available
          }
        },
      },
    }),
    {
      name: "alrehla-kharita-storage",
      partialize: (state) => ({
        currentProgressLevel: state.currentProgressLevel,
        unlockedTools: state.unlockedTools,
        lastActiveNodeId: state.lastActiveNodeId,
      }),
    }
  )
);
