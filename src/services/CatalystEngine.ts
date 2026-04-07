import { useCatalystState } from '@/state/catalystState';
import { useGrowthState } from '@/state/growthState';
import { useFlowState } from '@/state/flowState';
import { type Dream } from '@/types/dreams';

/**
 * ⚡ CATALYST ENGINE
 * Implements "Dopamine Arbitrage": Using momentum from easy wins to break critical knots.
 */
export class CatalystEngine {
    /**
     * Identifies a potential bridge between a completed easy task and a high-friction knot.
     */
    public static identifyBridge(dreams: Dream[]): { easyTaskId: string, knotId: string, dreamId: string } | null {
        // Find dreams with high alignment score and critical knots
        const candidates = dreams.filter(d =>
            d.status === 'IN_FLIGHT' &&
            d.knots.some(k => k.severity > 7) &&
            d.momentumTasks?.some(t => !t.isCompleted)
        );

        if (candidates.length === 0) return null;

        // Pick the dream with the highest alignment/value ratio
        const targetDream = candidates.sort((a, b) => (b.alignmentScore || 0) - (a.alignmentScore || 0))[0];

        const hardKnot = targetDream.knots.find(k => k.severity > 7);
        const easyTask = targetDream.momentumTasks?.find(t => !t.isCompleted);

        if (!hardKnot || !easyTask) return null;

        return {
            easyTaskId: easyTask.id,
            knotId: hardKnot.id,
            dreamId: targetDream.id
        };
    }

    /**
     * Logic to handle the completion of an easy task and trigger bridging.
     */
    public static onTaskCompleted(dopamineWeight: number) {
        const { addMomentum, momentumPool, activeBridge, setArbitrageStatus } = useCatalystState.getState();
        const { isOverclocking } = useGrowthState.getState();

        addMomentum(dopamineWeight * 10); // Reward momentum

        if (isOverclocking && activeBridge && momentumPool >= 70) {
            // Trigger the Arbitrage Bridge
            setArbitrageStatus('BRIDGING');

            // Auto-swap to EXECUTING after a short visual transition delay
            setTimeout(() => {
                setArbitrageStatus('EXECUTING');
            }, 1500);
        }
    }

    /**
     * Monitors the user's focus during the arbitrage shift.
     * High stress test: If focusScore decays during BRIDGING, it's a "Context Crash".
     */
    public static checkShiftIntegrity() {
        const { arbitrageStatus } = useCatalystState.getState();
        const { focusScore } = useFlowState.getState();

        if (arbitrageStatus === 'BRIDGING' && focusScore < 0.8) {
            console.warn("[CATALYST] Context Crash Detected! Neutralizing shift...");
            useCatalystState.getState().setArbitrageStatus('IDLE');
        }
    }

    /**
     * Triggers arbitrage manually for external features (e.g., Recovery Algorithm).
     */
    public static triggerManualArbitrage() {
        const { setArbitrageStatus } = useCatalystState.getState();
        setArbitrageStatus('BRIDGING');
        setTimeout(() => {
            setArbitrageStatus('EXECUTING');
        }, 1500);
    }
}
