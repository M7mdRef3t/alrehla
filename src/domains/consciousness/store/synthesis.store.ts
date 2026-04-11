import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CreativeSeed {
    id: string;
    dreamId: string;
    title: string;
    drafts: {
        type: 'script' | 'visual' | 'concept';
        content: string;
    }[];
    generatedAt: number;
}

interface SynthesisState {
    activeSeed: CreativeSeed | null;
    seeds: Record<string, CreativeSeed>;
    isGenerating: boolean;
    audioVolume: number;
    audioIntensity: number; // 0-1 (modulated by interactionRate)

    setActiveSeed: (seed: CreativeSeed | null) => void;
    saveSeed: (seed: CreativeSeed) => void;
    setGenerating: (generating: boolean) => void;
    setAudioVolume: (volume: number) => void;
    setAudioIntensity: (intensity: number) => void;
    resetSynthesis: () => void;
}

export const useSynthesisState = create<SynthesisState>()(
    persist(
        (set) => ({
            activeSeed: null,
            seeds: {},
            isGenerating: false,
            audioVolume: 0.5,
            audioIntensity: 0.5,

            setActiveSeed: (seed) => set({ activeSeed: seed }),
            saveSeed: (seed) => set((state) => ({
                seeds: { ...state.seeds, [seed.dreamId]: seed }
            })),
            setGenerating: (generating) => set({ isGenerating: generating }),
            setAudioVolume: (volume) => set({ audioVolume: volume }),
            setAudioIntensity: (intensity) => set({ audioIntensity: intensity }),
            resetSynthesis: () => set({
                activeSeed: null,
                isGenerating: false,
            }),
        }),
        {
            name: 'dawayir-synthesis-storage'
        }
    )
);
