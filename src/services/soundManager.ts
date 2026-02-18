// SoundManager.ts
// Synthesized Sound Effects for the Tactical Interface
// Uses Web Audio API to generate sci-fi/retro UI sounds without external assets.

class SoundManager {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private enabled: boolean = true;

    constructor() {
        this.init();
    }

    private init() {
        if (typeof window !== "undefined") {
            try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                this.audioContext = new AudioContextClass();
                this.masterGain = this.audioContext.createGain();
                this.masterGain.connect(this.audioContext.destination);
                this.masterGain.gain.value = 0.3; // Default volume
            } catch (e) {
                console.warn("Web Audio API not supported", e);
            }
        }
    }

    public setVolume(volume: number) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    public toggle(enabled: boolean) {
        this.enabled = enabled;
    }

    private createOscillator(type: OscillatorType, frequency: number, duration: number, startTime: number = 0) {
        if (!this.audioContext || !this.masterGain || !this.enabled) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime + startTime);

        gain.connect(this.masterGain);
        osc.connect(gain);

        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + startTime + duration);

        osc.start(this.audioContext.currentTime + startTime);
        osc.stop(this.audioContext.currentTime + startTime + duration);
    }

    // Tactical UI Sounds

    public playHover() {
        // High pitched short blip
        this.createOscillator("sine", 800, 0.05);
    }

    public playClick() {
        // Sharp click
        this.createOscillator("square", 400, 0.05);
        this.createOscillator("triangle", 200, 0.05);
    }

    public playSuccess() {
        // Rising triad
        const now = this.audioContext?.currentTime || 0;
        this.createOscillator("sine", 440, 0.2, 0); // A4
        this.createOscillator("sine", 554, 0.2, 0.1); // C#5
        this.createOscillator("sine", 659, 0.4, 0.2); // E5
    }

    public playError() {
        // Low buzzing
        this.createOscillator("sawtooth", 150, 0.3);
        this.createOscillator("sawtooth", 140, 0.3);
    }

    public playRadarPing() {
        // Sonar ping
        if (!this.audioContext || !this.masterGain || !this.enabled) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(1200, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.1); // Pitch drop

        gain.connect(this.masterGain);
        osc.connect(gain);

        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.5); // Long tail

        osc.start();
        osc.stop(this.audioContext.currentTime + 1.5);
    }

    public playSniperShot() {
        // Noise burst + decay
        if (!this.audioContext || !this.masterGain || !this.enabled) return;

        const bufferSize = this.audioContext.sampleRate * 0.5; // 0.5s
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);

        noise.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
    }

    public playShieldActivate() {
        // Sci-fi shield up (sweeping up)
        if (!this.audioContext || !this.masterGain || !this.enabled) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.4);

        gain.connect(this.masterGain);
        osc.connect(gain);

        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.4);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.4);
    }
}

export const soundManager = new SoundManager();
