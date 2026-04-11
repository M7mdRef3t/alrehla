import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GrowthState {
    isOverclocking: boolean;
    overclockMultiplier: number;
    activePayloadIds: string[]; // IDs of dreams in the current overclock payload
    heatLevel: number; // 0-1, visual representation of system strain
    isTripped: boolean; // True if an emergency shutdown just happened

    setOverclock: (active: boolean, multiplier?: number) => void;
    setPayload: (dreamIds: string[]) => void;
    updateHeat: (level: number) => void;
    resetGrowth: () => void;
}

export const useGrowthState = create<GrowthState>()(
    persist(
        (set) => ({
            isOverclocking: false,
            overclockMultiplier: 1.0,
            activePayloadIds: [],
            heatLevel: 0,
            isTripped: false,

            setOverclock: (active, multiplier = 1.2) => set({
                isOverclocking: active,
                overclockMultiplier: active ? multiplier : 1.0,
                heatLevel: active ? 0.3 : 0,
                isTripped: false
            }),
            setPayload: (dreamIds) => set({ activePayloadIds: dreamIds }),
            updateHeat: (level) => set({ heatLevel: level }),
            resetGrowth: () => set({
                isOverclocking: false,
                isTripped: false,
                heatLevel: 0,
                activePayloadIds: []
            })
        }),
        {
            name: 'dawayir-growth-storage'
        }
    )
);
