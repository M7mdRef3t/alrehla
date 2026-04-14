<<<<<<< HEAD
=======
/* eslint-disable no-console */
>>>>>>> feat/sovereign-final-stabilization
import { useEffect } from "react";
import { subscribeToDawayirSignals } from "@/modules/recommendation/recommendationBus";
import { useGamification } from "@/domains/gamification";
import { getDailyQuests } from "@/services/gamificationEngine";
import { useMapState } from '@/modules/map/dawayirIndex';
import { soundManager } from "@/services/soundManager";
import { triggerConfetti } from "@/utils/confetti";

/**
 * useGamificationSignals Hook — المراقب السِيادي 👁️
 * ==========================================
 * يقوم بمراقبة إشارات المنصة (Signals) وأتمتة إكمال المهام اليومية بناءً عليها.
 */
export function useGamificationSignals() {
    const { dailyCompletedKeys, completeDailyQuest } = useGamification();
    const nodes = useMapState(s => s.nodes);

    useEffect(() => {
        const unsubscribe = subscribeToDawayirSignals((signal) => {
            // 1. Get current quests to check if any match this signal
            const quests = getDailyQuests(nodes, dailyCompletedKeys);
            
            // 2. Map signals to actionKeys
            // The signal type might differ from the quest actionKey, so we bridge them here.
            const actionKey = signal.type;

            // 3. Find matching uncompleted quest
            const targetQuest = quests.find(q => q.actionKey === actionKey && !q.isCompleted);

            if (targetQuest) {
                console.log(`[GamificationEngine] Signal ${signal.type} completed quest ${targetQuest.id}`);
                
                // Complete the quest
                completeDailyQuest(targetQuest.id, targetQuest.actionKey, targetQuest.xpReward);
                
                // Feedback
                soundManager.playEffect('celebration');
                
                // Check if this was the last quest
                const remaining = quests.filter(q => !q.isCompleted && q.id !== targetQuest.id).length;
                if (remaining === 0) {
                    setTimeout(() => triggerConfetti(3), 500);
                }
            } else {
                // If no specific quest, we still award general XP for some actions if they aren't quests today
                // But map store already handles some of this manually. 
                // We could centralize it here in the future.
            }
        });

        return () => unsubscribe();
    }, [nodes, dailyCompletedKeys, completeDailyQuest]);
}
