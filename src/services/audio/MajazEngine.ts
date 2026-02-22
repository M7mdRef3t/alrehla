import { useSynthesisState } from '../../state/synthesisState';
import { useFlowState } from '../../state/flowState';

export class MajazEngine {
    private static audio: HTMLAudioElement | null = null;
    private static interval: any = null;

    /**
     * Initializes and starts the Majaz Neural Loop.
     * Note: In a real app, these would be the 'Majaz' audio files.
     */
    public static startLoop() {
        if (typeof window === 'undefined') return;

        // Placeholder for the Majaz loop file
        if (!this.audio) {
            this.audio = new Audio('https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3'); // Placeholder
            this.audio.loop = true;
        }

        const { audioVolume } = useSynthesisState.getState();
        this.audio.volume = audioVolume * 0.2; // Start subtle
        this.audio.play().catch(e => console.warn('[MajazEngine] Play blocked:', e));

        // Start dynamic modulation
        this.interval = setInterval(() => this.modulate(), 2000);
    }

    /**
     * Modulates audio intensity based on interaction rate (Flow telemetry).
     */
    private static modulate() {
        if (!this.audio) return;

        const { interactionRate } = useFlowState.getState();
        const { audioVolume } = useSynthesisState.getState();

        // Intensity 0 to 1 based on interaction rate (0-50 eps)
        const intensity = Math.min(1, interactionRate / 40);
        useSynthesisState.setState({ audioIntensity: intensity });

        // Adjust speed/pitch or filters (simplified for now)
        // High intensity = slightly louder and fuller
        const targetVolume = audioVolume * (0.1 + (intensity * 0.4));
        this.audio.volume = Math.max(0.05, targetVolume);

        // Slight playback rate boost during high interaction
        this.audio.playbackRate = 1 + (intensity * 0.05);
    }

    public static stopLoop() {
        if (this.audio) {
            this.audio.pause();
        }
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
}
