import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BlindCapsule {
  id: string;
  message: string;
  createdAt: number;
  unlockedAt: number | null;
  entropyThreshold: number;
  triggerContext: string;
}

interface BlindCapsuleState {
  capsules: BlindCapsule[];
  createCapsule: (message: string, entropyThreshold?: number) => void;
  getSealedCapsules: () => BlindCapsule[];
  unlockCapsule: (id: string) => void;
  clearCapsules: () => void;
}

export const useBlindCapsuleState = create<BlindCapsuleState>()(
  persist(
    (set, get) => ({
      capsules: [],
      
      createCapsule: (message, entropyThreshold = 85) => 
        set((state) => ({
          capsules: [
            ...state.capsules,
            {
              id: `capsule_${Date.now()}`,
              message,
              createdAt: Date.now(),
              unlockedAt: null,
              entropyThreshold,
              triggerContext: "Locked in a moment of clarity."
            }
          ]
        })),
        
      getSealedCapsules: () => {
        return get().capsules.filter((c) => c.unlockedAt === null);
      },
      
      unlockCapsule: (id) => 
        set((state) => ({
          capsules: state.capsules.map(c => 
             c.id === id ? { ...c, unlockedAt: Date.now() } : c
          )
        })),
        
      clearCapsules: () => set({ capsules: [] }),
    }),
    {
      name: "dawayir-blind-capsules",
      version: 1,
    }
  )
);
