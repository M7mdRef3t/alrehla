import { Dream, Knot } from '@/types/dreams';
import { OverviewStats } from './adminApi';
import { useMapState } from '@/modules/map/dawayirIndex';

/**
 * AlignmentEngine: The Logical Heart of Alrehla
 * Implements First Principles formula: S = (V * E) / e^(sum K + sum RC)
 */
export class AlignmentEngine {
    private static THRESHOLD = 0.65;

    /**
     * Calculates the Alignment Score.
     * Final score is normalized between 0 and 1.
     */
    static calculateScore(dream: Dream, stats: Partial<OverviewStats>): number {
        const V = dream.alignmentScore; // Initial Value Match (0-1)
        const E = this.calculateObjectiveEnergy(stats); // Objective Energy (0-1)

        // 1. Internal Knot Friction (K)
        const K_sum = this.calculateKnotFriction(dream.knots);

        // 2. External Relation Friction (RC) - RCA Integration
        const RC_sum = this.calculateExternalFriction(dream.relatedNodeIds || []);

        // Formula: S = (V * E) / exp(K_sum + RC_sum)
        const totalFriction = Math.exp((K_sum + RC_sum) / 2);
        const score = (V * E) / totalFriction;

        return Math.min(Math.max(score, 0), 1);
    }

    /**
     * Calculates friction from external relationships mapped in Dawayir.
     */
    private static calculateExternalFriction(relatedNodeIds: string[]): number {
        if (!relatedNodeIds || relatedNodeIds.length === 0) return 0;

        const nodes = useMapState.getState().nodes;
        let friction = 0;

        relatedNodeIds.forEach(id => {
            const node = nodes.find(n => n.id === id);
            if (node) {
                // Red Ring: High Friction (1.0), Yellow: Med (0.4), Green: Low (0.1)
                if (node.ring === 'red') friction += 1.0;
                else if (node.ring === 'yellow') friction += 0.4;
                else if (node.ring === 'green') friction += 0.1;

                // Detachment Mode Bonus: If the user IS working on detachment, friction is halved
                if (node.detachmentMode) friction *= 0.5;
            }
        });

        return friction;
    }

    /**
     * Derives Energy (E) from objective activity logs to avoid user self-deception.
     */
    private static calculateObjectiveEnergy(stats: Partial<OverviewStats>): number {
        // 1. Capacity Band (Weight: 40%)
        let capacityScore = 0.5; // Default mid
        const band = stats.routingTelemetry?.cognitiveEffectiveness?.byCapacityBand?.[0]?.capacityBand;
        if (band === 'high_capacity') capacityScore = 1.0;
        if (band === 'mid_capacity') capacityScore = 0.7;
        if (band === 'low_capacity') capacityScore = 0.3;

        // 2. Completion Rate (Weight: 40%)
        const completionRate = stats.routingV2?.completionRate ?? 0.5;

        // 3. System Pulse/Mood (Weight: 20%)
        const moodScore = (stats.avgMood ?? 5) / 10;

        const objectiveEnergy = (capacityScore * 0.4) + (completionRate * 0.4) + (moodScore * 0.2);

        return objectiveEnergy;
    }

    /**
     * Calculates the cumulative psychological resistance from Knots.
     * Each Knot contributes linearly to the exponent, which causes exponential resistance.
     */
    private static calculateKnotFriction(knots: Knot[]): number {
        if (!knots || knots.length === 0) return 0;

        // Sum of severities normalized to a smaller range (e.g., 0-1 per knot)
        return knots.reduce((acc, k) => acc + (k.severity / 10), 0);
    }

    /**
     * Determines if a dream should be 'Locked' (The Hard NO).
     */
    static isLocked(score: number, isCrisis: boolean = false): boolean {
        // If user is in Crisis mode, the Threshold increases (Dynamic Protection)
        const dynamicThreshold = isCrisis ? 0.85 : this.THRESHOLD;
        return score < dynamicThreshold;
    }
}
