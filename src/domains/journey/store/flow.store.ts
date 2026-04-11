import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FlowState {
    focusScore: number; // 0-1, 1 is peak flow
    interactionRate: number; // events per min
    isCleanRoomActive: boolean;
    lastInteractionAt: number;
    activeMicroDeadline: {
        id: string;
        target: string;
        expiresAt: number;
    } | null;

    setFocusScore: (score: number) => void;
    setInteractionRate: (rate: number) => void;
    toggleCleanRoom: (active: boolean) => void;
    setMicroDeadline: (deadline: { id: string, target: string, durationMs: number } | null) => void;
    recordInteraction: () => void;
}

export const useFlowState = create<FlowState>()(
    persist(
        (set) => ({
            focusScore: 1.0,
            interactionRate: 0,
            isCleanRoomActive: false,
            lastInteractionAt: Date.now(),
            activeMicroDeadline: null,

            setFocusScore: (score) => set({ focusScore: Math.max(0, Math.min(1, score)) }),
            setInteractionRate: (rate) => set({ interactionRate: rate }),
            toggleCleanRoom: (active) => set({ isCleanRoomActive: active }),
            setMicroDeadline: (deadline) => set({
                activeMicroDeadline: deadline ? {
                    ...deadline,
                    expiresAt: Date.now() + deadline.durationMs
                } : null
            }),
            recordInteraction: () => set({ lastInteractionAt: Date.now() }),
        }),
        {
            name: 'dawayir-flow-storage'
        }
    )
);
