// SoundManager.ts
// Synthesized Sound Effects for the Tactical Interface
// Uses Web Audio API to generate sci-fi/retro UI sounds without external assets.

class SoundManager {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private ambientSource: { stop: () => void } | null = null;
    private ambientGain: GainNode | null = null;
    private enabled: boolean = true;
    private sensoryEnabled: boolean = true;
    private userInteracted: boolean = false;

    constructor() {
        this.init();
        this.setupResumeListeners();
    }

    private setupResumeListeners() {
        if (typeof window === "undefined") return;
        
        const resume = () => {
            this.userInteracted = true;
            this.resumeContext();
            // Remove listeners after first interaction
            window.removeEventListener('click', resume);
            window.removeEventListener('keydown', resume);
            window.removeEventListener('touchstart', resume);
        };

        window.addEventListener('click', resume);
        window.addEventListener('keydown', resume);
        window.addEventListener('touchstart', resume);
    }

    public async resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (e) {
                console.warn("Failed to resume AudioContext:", e);
            }
        }
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
        if (!enabled) this.stopAmbientCommunity();
    }

    public toggleSensory(enabled: boolean) {
        this.sensoryEnabled = enabled;
        if (!enabled) this.stopAmbientCommunity();
    }

    private createOscillator(type: OscillatorType, frequency: number, duration: number, startTime: number = 0) {
        if (!this.audioContext || !this.masterGain || !this.enabled) return;

        // If context is suspended, try to resume only if user has interacted
        if (this.audioContext.state === 'suspended') {
            if (this.userInteracted) this.resumeContext();
            return;
        }

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
        this.createOscillator("sine", 800, 0.05);
    }

    public playClick() {
        this.createOscillator("square", 400, 0.05);
        this.createOscillator("triangle", 200, 0.05);
    }

    public playSuccess() {
        const now = this.audioContext?.currentTime || 0;
        this.createOscillator("sine", 440, 0.2, 0); 
        this.createOscillator("sine", 554, 0.2, 0.1); 
        this.createOscillator("sine", 659, 0.4, 0.2); 
    }

    public playError() {
        this.createOscillator("sawtooth", 150, 0.3);
        this.createOscillator("sawtooth", 140, 0.3);
    }

    private playGavel(now: number) {
        if (!this.audioContext || !this.masterGain || !this.enabled) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
        gain.connect(this.masterGain);
        osc.connect(gain);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
        this.createOscillator("square", 200, 0.02);
    }

    private playCelebration(now: number) {
        if (!this.audioContext || !this.masterGain || !this.enabled) return;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            this.createOscillator('square', freq, 1.5, now + i * 0.1);
        });
    }

    private playWarp(now: number) {
        if (!this.audioContext || !this.masterGain || !this.enabled) return;
        const osc = this.audioContext.createOscillator();
        const g = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(40, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 1.2);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.exponentialRampToValueAtTime(10000, now + 0.8);

        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.3, now + 0.1);
        g.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

        osc.connect(filter);
        filter.connect(g);
        g.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 1.5);
    }

    private playHeartbeat(now: number) {
        if (!this.audioContext || !this.masterGain || !this.enabled) return;
        const playThump = (time: number) => {
            const osc = this.audioContext!.createOscillator();
            const gain = this.audioContext!.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(60, time);
            osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);
            gain.connect(this.masterGain!);
            osc.connect(gain);
            gain.gain.setValueAtTime(0.3, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
            osc.start(time);
            osc.stop(time + 0.3);
        };
        playThump(now);
        playThump(now + 0.2);
    }

    private playTension(now: number) {
        if (!this.audioContext || !this.masterGain || !this.enabled || !this.sensoryEnabled) return;
        [80, 85].forEach(freq => {
            const osc = this.audioContext!.createOscillator();
            const g = this.audioContext!.createGain();
            osc.connect(g);
            g.connect(this.masterGain!);
            osc.frequency.setValueAtTime(freq, now);
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.1, now + 0.05);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            osc.start(now);
            osc.stop(now + 0.8);
        });
    }

    private playHarmony(now: number) {
        if (!this.audioContext || !this.masterGain || !this.enabled || !this.sensoryEnabled) return;
        [440, 554.37].forEach(freq => {
            const osc = this.audioContext!.createOscillator();
            const g = this.audioContext!.createGain();
            osc.type = 'sine';
            osc.connect(g);
            g.connect(this.masterGain!);
            osc.frequency.setValueAtTime(freq, now);
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.05, now + 0.1);
            g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
            osc.start(now);
            osc.stop(now + 1.2);
        });
    }

    public playEffect(type: 'gavel' | 'heartbeat' | 'cosmic_pulse' | 'tension' | 'harmony' | 'celebration' | 'warp' | 'radar_ping' | 'scanning') {
        if (!this.audioContext) this.init();
        if (!this.audioContext || !this.masterGain || !this.enabled) return;

        // Centralized check for suspended context
        if (this.audioContext.state === 'suspended') {
            if (this.userInteracted) this.resumeContext();
            return;
        }

        const now = this.audioContext.currentTime;
        if (type === 'gavel') this.playGavel(now);
        else if (type === 'heartbeat') this.playHeartbeat(now);
        else if (type === 'tension') this.playTension(now);
        else if (type === 'harmony') this.playHarmony(now);
        else if (type === 'celebration') this.playCelebration(now);
        else if (type === 'warp') this.playWarp(now);
        else if (type === 'radar_ping') this.playRadarPing();
        else if (type === 'scanning') this.playScanning();
        else if (type === 'cosmic_pulse') {
            const osc = this.audioContext.createOscillator();
            const g = this.audioContext.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(60, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 1.2);
            g.connect(this.masterGain);
            osc.connect(g);
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.4, now + 0.1);
            g.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
            osc.start(now);
            osc.stop(now + 2.0);
        }
    }

    public startAmbientCommunity() {
        if (!this.audioContext) this.init();
        if (!this.audioContext || !this.masterGain || !this.enabled || !this.sensoryEnabled) return;
        
        if (this.audioContext.state === 'suspended') {
            if (this.userInteracted) this.resumeContext();
            return;
        }

        if (this.ambientSource) return;

        const now = this.audioContext.currentTime;
        const g = this.audioContext.createGain();
        this.ambientGain = g;
        g.connect(this.masterGain);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.05, now + 2);

        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(60, now);
        osc2.frequency.setValueAtTime(61, now); 
        
        osc1.connect(g);
        osc2.connect(g);
        
        osc1.start();
        osc2.start();
        
        this.ambientSource = { 
            stop: () => { 
                try { osc1.stop(); osc2.stop(); } catch { return; }
            } 
        };
    }

    public stopAmbientCommunity() {
        if (this.ambientSource && this.ambientGain && this.audioContext) {
            const now = this.audioContext.currentTime;
            this.ambientGain.gain.cancelScheduledValues(now);
            this.ambientGain.gain.linearRampToValueAtTime(0, now + 1);
            setTimeout(() => {
                if (this.ambientSource) {
                    this.ambientSource.stop();
                    this.ambientSource = null;
                }
            }, 1000);
        }
    }

    // New Tactical Methods
    public playSniperShot() {
        if (!this.audioContext || !this.masterGain || !this.enabled) return;
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const g = this.audioContext.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        g.connect(this.masterGain);
        osc.connect(g);
        g.gain.setValueAtTime(0.3, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    public playRadarPing() {
        if (!this.audioContext || !this.masterGain || !this.enabled) return;
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const g = this.audioContext.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.5);
        g.connect(this.masterGain);
        osc.connect(g);
        g.gain.setValueAtTime(0.1, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        osc.start(now);
        osc.stop(now + 1.0);
    }

    public playShieldActivate() {
        if (!this.audioContext || !this.masterGain || !this.enabled) return;
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const g = this.audioContext.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.3);
        g.connect(this.masterGain);
        osc.connect(g);
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    }

    public playScanning() {
        if (!this.audioContext || !this.masterGain || !this.enabled) return;
        const now = this.audioContext.currentTime;
        const duration = 1.8;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = "bandpass";
        filter.Q.value = 10;
        filter.connect(this.masterGain);

        const playBeep = (time: number, freq: number) => {
            const osc = this.audioContext!.createOscillator();
            const g = this.audioContext!.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, time);
            osc.connect(g);
            g.connect(filter);
            g.gain.setValueAtTime(0, time);
            g.gain.linearRampToValueAtTime(0.05, time + 0.05);
            g.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
            osc.start(time);
            osc.stop(time + 0.2);
        };

        for(let i = 0; i < 8; i++) {
            playBeep(now + i * 0.2, 1000 + i * 100);
            filter.frequency.setValueAtTime(1000 + i * 200, now + i * 0.2);
        }
    }

    public playDrone() {
        if (!this.audioContext || !this.masterGain || !this.enabled) return;
        const now = this.audioContext.currentTime;
        const duration = 2.0;

        const osc = this.audioContext.createOscillator();
        const g = this.audioContext.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(50, now);
        osc.frequency.linearRampToValueAtTime(55, now + duration);
        
        g.connect(this.masterGain);
        osc.connect(g);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.1, now + 0.5);
        g.gain.linearRampToValueAtTime(0, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
    }
}

export const soundManager = new SoundManager();
