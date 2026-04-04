export class TherapeuticVoiceEngine {
    private static instance: TherapeuticVoiceEngine;
    private synth: SpeechSynthesis;
    
    private constructor() {
        this.synth = window.speechSynthesis;
    }

    public static getInstance(): TherapeuticVoiceEngine {
        if (!TherapeuticVoiceEngine.instance) {
            TherapeuticVoiceEngine.instance = new TherapeuticVoiceEngine();
        }
        return TherapeuticVoiceEngine.instance;
    }

    public playTherapeuticVoice(text: string) {
        if (!this.synth) return;

        // Cancel any ongoing speeches to prevent stacking
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Settings tailored for a "Healing, Calm, and Mentoring" tone.
        utterance.lang = "ar-EG"; 
        utterance.pitch = 0.8; // Deep resonant voice
        utterance.rate = 0.85; // Slow, deliberate rhythm

        // Try to find the highest quality voice (ideally a native Arabic male/female deeply modeled voice)
        const voices = this.synth.getVoices();
        const arabicVoices = voices.filter(v => v.lang.startsWith("ar"));
        
        // If an Arabic voice is found, prefer standard or high-quality (Google/Siri native voices mapped in browsers)
        if (arabicVoices.length > 0) {
            utterance.voice = arabicVoices[0];
        }

        this.synth.speak(utterance);
    }
    
    public stop() {
        if (this.synth) {
            this.synth.cancel();
        }
    }
}

export const therapeuticVoice = TherapeuticVoiceEngine.getInstance();
