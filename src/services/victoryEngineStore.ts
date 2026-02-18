import { useEventHistoryStore } from "../state/eventHistoryStore";
import { calculateVictoryMetrics, scanForAchievements, type VictoryMetrics, type Achievement } from "./victoryEngine";

export interface VictoryState extends VictoryMetrics {
    totalXp: number;
    currentRank: string;
    achievements: Achievement[];
    stats: {
        victories: number;
    }
}

export function useVictoryEngine(): VictoryState {
    const events = useEventHistoryStore((s) => s.events);

    // Recalculate derived state when events change
    const metrics = calculateVictoryMetrics();
    const achievements = scanForAchievements();

    // Mock XP/Rank for now or derive if logic exists
    // In a real app we might fetch this from a gamification store
    const totalXp = events.length * 150;
    const currentRank = totalXp > 5000 ? "Sovereign Commander" : "Tactical Operator";

    return {
        ...metrics,
        totalXp,
        currentRank,
        achievements,
        stats: {
            victories: metrics.keystoneImpact + Math.floor(metrics.detachmentStrength / 10)
        }
    };
}
