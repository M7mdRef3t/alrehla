import { useMapState } from '@/state/mapState';
import { usePulseState, PulseEntry } from '@/state/pulseState';
import { useFirewallState } from '@/state/firewallState';

export class EnergyROIEngine {
    /**
     * Scans all nodes and triggers ROI recalibration.
     */
    public static recalibrateAll() {
        const nodes = useMapState.getState().nodes;
        const pulseLogs = usePulseState.getState().logs;
        const { updateROIData } = useFirewallState.getState();

        nodes.forEach(node => {
            const logs = node.recoveryProgress?.situationLogs || [];
            if (logs.length === 0) return;

            // Take the most recent interaction
            const lastInteraction = logs[logs.length - 1];

            // Find pulse *before* interaction
            const pulseBefore = pulseLogs.find(p => p.timestamp < lastInteraction.date);
            // Find pulse *after* interaction (within 12 hours)
            const pulseAfter = pulseLogs.find(p =>
                p.timestamp > lastInteraction.date &&
                p.timestamp < lastInteraction.date + (12 * 60 * 60 * 1000)
            );

            if (pulseBefore && pulseAfter) {
                const delta = pulseAfter.energy - pulseBefore.energy;
                updateROIData(node.id, delta);
            }
        });
    }

    /**
     * Returns a color grade for a node based on its ROI.
     */
    public static getROIColor(nodeId: string): string {
        const roi = useFirewallState.getState().getROI(nodeId);
        if (roi > 1) return '#2dd4bf'; // Healthy (Teal)
        if (roi < -1.5) return '#f43f5e'; // Toxic (Rose)
        if (roi < 0) return '#f59e0b'; // Draining (Amber)
        return '#94a3b8'; // Neutral (Slate)
    }

    /**
     * Checks if a node is classified as a "Vampire".
     */
    public static isEnergyVampire(nodeId: string): boolean {
        const roi = useFirewallState.getState().getROI(nodeId);
        return roi < -2.0;
    }
}
