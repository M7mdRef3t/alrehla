import { useMapState } from "@/state/mapState";
import { useJourneyState } from "@/state/journeyState";
import { usePulseState } from "@/state/pulseState";
import { calculateEntropy } from "./predictiveEngine";

export interface DissonanceReport {
    hasDissonance: boolean;
    score: number; // 0 to 100
    message: string;
    triggeringGoalId?: string;
    triggeringCategory?: string;
}

/**
 * The Dissonance Engine / مرآة التناقض
 * Detects the gap between stated intentions (journey goals) and revealed preferences (map chaos).
 */
export const DissonanceEngine = {
    evaluate: (): DissonanceReport => {
        const nodes = useMapState.getState().nodes;
        const journey = useJourneyState.getState();
        const pulses = usePulseState.getState().logs;

        const statedCategory = journey.category; 

        if (!statedCategory) {
            return { hasDissonance: false, score: 0, message: "لا توجد أهداف نشطة للمقارنة." };
        }

        const latestPulse = pulses[pulses.length - 1];
        if (!latestPulse) {
            return { hasDissonance: false, score: 0, message: "لا توجد قياسات نبض كافية." };
        }

        const evaluation = calculateEntropy();

        const goalNodes = nodes.filter(n => n.goalId === journey.goalId);
        const nonGoalNodes = nodes.filter(n => n.goalId !== journey.goalId);

        const redNonGoalNodes = nonGoalNodes.filter(n => n.ring === "red").length;
        const totalRedNodes = nodes.filter(n => n.ring === "red").length;

        // Condition for Cognitive Dissonance:
        // Entropy is high (>55), and the majority of chaotic nodes are NOT related to the stated intention.
        if (evaluation.entropyScore > 55 && redNonGoalNodes > 0 && redNonGoalNodes >= (totalRedNodes / 2)) {
            // Cap score at 100
            const finalScore = Math.min(100, evaluation.entropyScore + 15);
            return {
                hasDissonance: true,
                score: finalScore,
                triggeringGoalId: journey.goalId || undefined,
                triggeringCategory: statedCategory,
                message: `أنت تدعي أن '${statedCategory}' هي أولويتك القصوى، لكن معظم استنزافك وفوضاك مستقرة في مناطق لا علاقة لها بهذا الهدف. هذه الازدواجية هي سر الانهيار. الملاذ يقترح عليك التصالح مع تركيزك الحالي الفعلي. هل تود إيقاف الهدف المعلن؟`
            };
        }

        return { hasDissonance: false, score: 0, message: "النية والسلوك متطابقان." };
    }
};
