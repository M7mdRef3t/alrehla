import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandIdbStorage } from '@/utils/idbStorage';


export interface ConsciousnessPoint {
  timestamp: number;
  emotionalState: string;
  intensity: number;
  pattern: string;
}

interface ConsciousnessHistoryState {
  history: ConsciousnessPoint[];
  addPoint: (point: ConsciousnessPoint) => void;
  clearHistory: () => void;
}

export const useConsciousnessHistory = create<ConsciousnessHistoryState>()(
  persist(
    (set) => ({
      history: [],
      addPoint: (point) => set((state) => ({ 
        history: [...state.history, point].slice(-100) // الاحتفاظ بآخر 100 نقطة
      })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'consciousness-history-storage', storage: zustandIdbStorage,
    }
  )
);
