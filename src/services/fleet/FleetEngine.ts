import { logger } from "@/services/logger";
import { useFleetState, FleetVessel } from '@/domains/admin/store/fleet.store';
import { useDigitalTwinState } from '@/domains/maraya/store/digitalTwin.store';
import { usePredictiveState } from '@/domains/consciousness/store/predictive.store';
import { fetchDreams } from '../admin/adminDreams';
import { Dream } from '@/types/dreams';

export class FleetEngine {
    /**
     * Initializes the fleet from existing dreams/projects.
     */
    public static async initializeFleet(): Promise<void> {
        const setVessels = useFleetState.getState().setVessels;

        try {
            const dreams = await fetchDreams();

            // Map dreams to vessels
            const vessels: FleetVessel[] = dreams.map((dream: Dream) => ({
                id: dream.id,
                title: dream.title,
                domain: (dream.cognitiveDomain as any) || 'CREATIVE',
                energyLevel: dream.energyRequired ? (dream.energyRequired / 10) : Math.random(),
                isSandboxed: (dream.metadata as any)?.isSandboxed || dream.title.toLowerCase().includes('google'),
                priority: 1
            }));

            setVessels(vessels);
        } catch (error) {
            logger.error("[Fleet Engine] Failed to initialize fleet:", error);
        }
    }

    /**
     * Calculates the best "Directive" based on real-time bio-telemetry.
     */
    public static calculateDeployment(): void {
        const { graph, interventionMode } = useDigitalTwinState.getState();
        const { crashProbability } = usePredictiveState.getState();
        const { setRoutingDirective, vessels } = useFleetState.getState();

        const stability = graph.globalStability ?? 1;

        let directive = "Maintain Current Trajectory";

        if (interventionMode === 'RECOVERY' || crashProbability > 0.7) {
            directive = "Emergency Stasis: Mute Analytical Vessels. Prioritize Creative/Passive flow.";
        } else if (stability > 0.8 && interventionMode === 'NORMAL') {
            directive = "High-Stability Detected: Open Analytical Circuits. Overclocking Ready.";
        } else if (stability < 0.5) {
            directive = "Entropy Rising: Injecting UI Friction. Tactical Re-routing Required.";
        }

        setRoutingDirective(directive);

        // Sort vessels based on energy matching
        const sortedVessels = [...vessels].sort((a, b) => {
            const aMatch = FleetEngine.getEnergyMatch(a, stability, interventionMode);
            const bMatch = FleetEngine.getEnergyMatch(b, stability, interventionMode);
            return bMatch - aMatch;
        });

        useFleetState.setState({ vessels: sortedVessels });
    }

    private static getEnergyMatch(vessel: FleetVessel, stability: number, mode: string): number {
        let score = 0.5;

        // Analytical tasks need high stability
        if (vessel.domain === 'ANALYTICAL') {
            score = stability > 0.7 ? 0.9 : 0.1;
        }

        // Creative tasks thrive in Flow/Normal modes
        if (vessel.domain === 'CREATIVE') {
            score = mode === 'NORMAL' ? 0.8 : 0.4;
        }

        // Social tasks are suppressed in Recovery
        if (vessel.domain === 'SOCIAL' && mode === 'RECOVERY') {
            score = 0.05;
        }

        return score;
    }

    /**
     * Enforces sandbox isolation for a specific session.
     */
    public static enterSandbox(vesselId: string): void {
        const { setActiveVessel } = useFleetState.getState();
        setActiveVessel(vesselId);
        console.log(`[Fleet Commander] Entering Sandbox Protocol for: ${vesselId}`);
    }
}
