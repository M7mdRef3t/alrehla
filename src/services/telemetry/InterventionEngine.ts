import { useDigitalTwinState } from '@/domains/maraya/store/digitalTwin.store';
import { useSwarmMutationStore } from '@/state/useSwarmMutationStore';

export class InterventionEngine {
    private static lastUpdate: number = 0;

    public static evaluateStability(stability: number) {
        const state = useDigitalTwinState.getState();
        if (!state.isMirroring) return;

        let mode: 'NORMAL' | 'STABILIZE' | 'RECOVERY' = 'NORMAL';
        if (stability < 0.6) {
            mode = 'RECOVERY';
        } else if (stability < 0.8) {
            mode = 'STABILIZE';
        }

        if (state.interventionMode !== mode) {
            state.setInterventionMode(mode);
            this.applyFriction(mode);
            console.log(`[InterventionEngine] Mode Shift: ${mode}`);

            if (mode === 'RECOVERY') {
                // Auto-trigger the immersive Consciousness Artist!
                useSwarmMutationStore.getState().setIsArtistOpen(true);

                // Report High Rhythm/Chaos to Sovereign Engine Auto-Capture
                fetch('/api/telemetry/report-anomaly', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'high_rhythm',
                        message: 'System entered RECOVERY mode due to critical bio-telemetry/high interaction rhythm.',
                        details: { stabilityScore: stability },
                        sourcePath: typeof window !== 'undefined' ? window.location.pathname : 'Unknown'
                    })
                }).catch(() => {});
            }
        }
    }

    private static applyFriction(mode: 'NORMAL' | 'STABILIZE' | 'RECOVERY') {
        const root = document.documentElement;

        // CSS Variable Injection for Global Friction
        // We modulate transition-duration and animation-duration
        switch (mode) {
            case 'RECOVERY':
                root.style.setProperty('--ui-friction-multiplier', '2.5');
                root.style.setProperty('--ui-transition-timing', 'cubic-bezier(0.4, 0, 0.2, 1)');
                break;
            case 'STABILIZE':
                root.style.setProperty('--ui-friction-multiplier', '1.5');
                root.style.setProperty('--ui-transition-timing', 'ease-in-out');
                break;
            default:
                root.style.setProperty('--ui-friction-multiplier', '1.0');
                root.style.setProperty('--ui-transition-timing', 'ease');
                break;
        }
    }

    public static getPulseTiming() {
        // Returns timing for 4-7-8 rhythm in ms
        // Inhale: 4s, Hold: 7s, Exhale: 8s
        const now = Date.now();
        const cycle = 19000; // total 19s
        const progress = now % cycle;

        if (progress < 4000) return { phase: 'INHALE', alpha: progress / 4000 };
        if (progress < 11000) return { phase: 'HOLD', alpha: 1 };
        return { phase: 'EXHALE', alpha: 1 - ((progress - 11000) / 8000) };
    }
}
