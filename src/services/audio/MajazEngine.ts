import { useSynthesisState } from '../../state/synthesisState';
import { usePulseState } from '../../state/pulseState';
import { useMapState } from '../../state/mapState';
import { computeTEI } from '../../utils/traumaEntropyIndex';

/*
    MAJAZ NEURAL ENGINE 2.0 — Resonant Soundscape
    Procedural atmospheric layers that react to the user's internal state.
*/

export class MajazEngine {
    private static layers: {
        grounding: HTMLAudioElement;
        entropy: HTMLAudioElement;
        clarity: HTMLAudioElement;
    } | null = null;
    private static interval: any = null;

    private static readonly ASSETS = {
        grounding: 'https://assets.mixkit.co/sfx/preview/mixkit-deep-hum-2521.mp3', // Deep Grounding Hum
        entropy: 'https://assets.mixkit.co/sfx/preview/mixkit-wind-transition-sweep-193.mp3', // Subtle tension/static
        clarity: 'https://assets.mixkit.co/sfx/preview/mixkit-ethereal-choir-pad-2234.mp3' // High frequency resonance
    };

    public static startLoop() {
        if (typeof window === 'undefined') return;

        if (!this.layers) {
            this.layers = {
                grounding: new Audio(this.ASSETS.grounding),
                entropy: new Audio(this.ASSETS.entropy),
                clarity: new Audio(this.ASSETS.clarity)
            };
            
            Object.values(this.layers).forEach(audio => {
                audio.loop = true;
                audio.volume = 0;
                audio.play().catch(e => console.warn('[MajazEngine] Play blocked:', e));
            });
        }

        this.interval = setInterval(() => this.modulate(), 1500);
    }

    private static modulate() {
        if (!this.layers) return;

        const { audioVolume } = useSynthesisState.getState();
        const lastPulse = usePulseState.getState().lastPulse;
        const nodes = useMapState.getState().nodes;
        
        // Compute Current State
        const tei = computeTEI(nodes).score; // 0-100
        const pulseEnergy = lastPulse?.energy ?? 50; // 0-100
        
        // Normalize Metrics (0 to 1)
        const teiNorm = tei / 100;
        const pulseNorm = pulseEnergy / 100;
        
        // 1. Grounding Layer: Always present, stabilizes at medium-low volume
        const groundVol = audioVolume * 0.25;
        this.layers.grounding.volume = groundVol;

        // 2. Entropy Layer: Increases with high TEI (Trauma Dissonance)
        // Only active if TEI > 30%
        const entropyTarget = teiNorm > 0.3 ? (teiNorm - 0.3) * 0.4 : 0;
        this.layers.entropy.volume = audioVolume * entropyTarget;

        // 3. Clarity Layer: Increases with high Pulse Energy (Inner Peace)
        // Flourishes when Pulse > 60%
        const clarityTarget = pulseNorm > 0.6 ? (pulseNorm - 0.6) * 0.6 : 0;
        this.layers.clarity.volume = audioVolume * clarityTarget;

        // Update Global Intensity for visual sync
        const totalIntensity = (groundVol + entropyTarget + clarityTarget) / 3;
        useSynthesisState.setState({ audioIntensity: totalIntensity });
    }

    public static stopLoop() {
        if (this.layers) {
            Object.values(this.layers).forEach(audio => audio.pause());
        }
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
}
