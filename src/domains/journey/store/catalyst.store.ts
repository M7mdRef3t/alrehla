import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandIdbStorage } from '@/utils/idbStorage';


export interface CatalystState {
    momentumPool: number; // 0-100
    arbitrageStatus: 'COLLECTING' | 'BRIDGING' | 'EXECUTING' | 'IDLE';
    activeBridge: {
        easyTaskId: string;
        knotId: string;
        dreamId: string;
    } | null;

    addMomentum: (amount: number) => void;
    setArbitrageStatus: (status: CatalystState['arbitrageStatus']) => void;
    setActiveBridge: (bridge: CatalystState['activeBridge']) => void;
    resetCatalyst: () => void;
}

export const useCatalystState = create<CatalystState>()(
    persist(
        (set) => ({
            momentumPool: 0,
            arbitrageStatus: 'IDLE',
            activeBridge: null,

            addMomentum: (amount) => set((state) => ({
                momentumPool: Math.min(100, state.momentumPool + amount)
            })),
            setArbitrageStatus: (status) => set({ arbitrageStatus: status }),
            setActiveBridge: (bridge) => set({ activeBridge: bridge }),
            resetCatalyst: () => set({
                momentumPool: 0,
                arbitrageStatus: 'IDLE',
                activeBridge: null
            }),
        }),
        {
            name: 'dawayir-catalyst-storage', storage: zustandIdbStorage
        }
    )
);
