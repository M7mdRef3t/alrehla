import { supabase } from './supabaseClient';
import { SwarmMetrics, HiveEngine } from './hiveEngine';
import { AwarenessVector } from './trajectoryEngine';

export class SwarmNotifier {
    /**
     * Resonance Check: Compares user vector to Swarm Elite to trigger alerts.
     */
    static async checkResonance(userId: string, currentVector: AwarenessVector): Promise<{ resonance: number; alert: string | null }> {
        const metrics = await HiveEngine.getSwarmMetrics();
        if (!metrics) return { resonance: 1.0, alert: null };

        const elite = metrics.outlier_vector;
        const avg = metrics.mean_vector;

        // Euclidean distance and resonance calculation
        const distToElite = Math.sqrt(
            Math.pow(currentVector.rs - elite.rs, 2) +
            Math.pow(currentVector.av - elite.av, 2) +
            Math.pow(currentVector.bi - elite.bi, 2)
        );

        const resonance = 1 - Math.min(distToElite, 1);

        let alert = null;
        if (resonance > 0.9) {
            alert = "You are in perfect synchronization with the Swarm Elite. Sovereignty peak detected.";
        } else if (resonance < 0.4) {
            alert = "Resonance decoupling detected. The Swarm momentum is pulling away. Recalibrate your trajectory.";
        }

        return { resonance, alert };
    }

    /**
     * Swarm Sync Pulse: Triggers the weekly synchronization event notification.
     */
    static async triggerSyncPulse(): Promise<boolean> {
        // Logic for global broadcasting (mocked for now)
        console.log("⚡ [SwarmNotifier] Broadcasting Weekly Sync Night Pulse...");
        return true;
    }
}
