import { useDigitalTwinState } from '../../state/digitalTwinState';
import { TelemetrySnapshot } from '../../types/digitalTwin';
import { InterventionEngine } from './InterventionEngine';

export class MicroTelemetryEngine {
    private static lastEventTime: number = 0;
    private static eventIntervals: number[] = [];
    private static lastScrollTop: number = 0;
    private static lastScrollTime: number = 0;
    private static isInitialized: boolean = false;

    public static init() {
        if (this.isInitialized) return;

        window.addEventListener('mousemove', (e) => this.trackInteraction('mouse'));
        window.addEventListener('keydown', (e) => this.trackInteraction('keyboard'));
        window.addEventListener('scroll', (e) => this.trackScroll(), { passive: true });

        setInterval(() => this.processHeartbeat(), 2000);
        this.isInitialized = true;
        console.log('[MicroTelemetryEngine] Operational.');
    }

    private static trackInteraction(type: string) {
        const { isMirroring } = useDigitalTwinState.getState();
        if (!isMirroring) return;

        const now = performance.now();
        if (this.lastEventTime > 0) {
            const gap = now - this.lastEventTime;
            this.eventIntervals.push(gap);
            if (this.eventIntervals.length > 20) this.eventIntervals.shift();
        }
        this.lastEventTime = now;
    }

    private static trackScroll() {
        const { isMirroring } = useDigitalTwinState.getState();
        if (!isMirroring) return;

        const now = performance.now();
        const top = window.scrollY;
        const dt = now - this.lastScrollTime;

        if (dt > 10) {
            const dy = Math.abs(top - this.lastScrollTop);
            const velocity = (dy / dt) * 1000; // pixels/sec

            // We use a simplified snapshot for scroll
            this.captureSnapshot(0, 0, velocity);
        }

        this.lastScrollTop = top;
        this.lastScrollTime = now;
    }

    private static processHeartbeat() {
        if (this.eventIntervals.length < 2) return;

        const avgLatency = this.eventIntervals.reduce((a, b) => a + b, 0) / this.eventIntervals.length;

        // Jitter: Standard Deviation of intervals
        const variance = this.eventIntervals.reduce((a, b) => a + Math.pow(b - avgLatency, 2), 0) / this.eventIntervals.length;
        const jitter = Math.sqrt(variance);

        this.captureSnapshot(avgLatency, jitter, 0);
    }

    private static captureSnapshot(latency: number, jitter: number, velocity: number) {
        const snapshot: TelemetrySnapshot = {
            timestamp: Date.now(),
            latency,
            jitter,
            velocity,
            pressureEstimate: 0.5 // Default for now
        };

        useDigitalTwinState.getState().addSnapshot(snapshot);
        this.calculateStability(snapshot);
    }

    private static calculateStability(snapshot: TelemetrySnapshot) {
        // High latency jitter or high extreme velocities lead to lower stability
        // This is a base heuristic for the "mirror"
        let stabilityPenalty = 0;

        if (snapshot.jitter > 300) stabilityPenalty += 0.2; // Erratic rhythm
        if (snapshot.latency > 2000) stabilityPenalty += 0.1; // Slow response
        if (snapshot.velocity > 5000) stabilityPenalty += 0.3; // Panic scrolling

        const currentStability = useDigitalTwinState.getState().graph.globalStability;
        const nextStability = Math.max(0.1, Math.min(1, currentStability - (stabilityPenalty * 0.1) + 0.05)); // Decays and recovers

        useDigitalTwinState.getState().setGlobalStability(nextStability);
        InterventionEngine.evaluateStability(nextStability);
    }
}
