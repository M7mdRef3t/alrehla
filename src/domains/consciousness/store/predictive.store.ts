import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandIdbStorage } from '@/utils/idbStorage';


export interface PredictiveState {
    crashProbability: number; // 0-1
    isSurvivalMode: boolean;
    forecast: string; // Egyptian slang forecast
    recommendations: string[];
    lastCheckAt: number;

    setPrediction: (probability: number, forecast: string, recommendations: string[]) => void;
    toggleSurvivalMode: (active: boolean) => void;
}

export const usePredictiveState = create<PredictiveState>()(
    persist(
        (set) => ({
            crashProbability: 0,
            isSurvivalMode: false,
            forecast: "السماء صافية والمدارات مستقرة.. مفيش مؤشرات قلق حالياً.",
            recommendations: [],
            lastCheckAt: Date.now(),

            setPrediction: (probability, forecast, recommendations) => set({
                crashProbability: probability,
                forecast,
                recommendations,
                isSurvivalMode: probability > 0.8,
                lastCheckAt: Date.now()
            }),
            toggleSurvivalMode: (active) => set({ isSurvivalMode: active })
        }),
        {
            name: 'dawayir-predictive-storage', storage: zustandIdbStorage
        }
    )
);
