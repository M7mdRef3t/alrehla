import { FC, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { supabase } from "../services/supabaseClient";

export const VoicePresence: FC<{
    trigger?: { event: 'shadow_insight' | 'milestone_unlocked' | 'high_impact_action'; context: Record<string, unknown> }
}> = ({ trigger }) => {
    const [isOptedIn, setIsOptedIn] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('dawayir_voice_presence') === 'true';
        }
        return false;
    });

    const [isPlaying, setIsPlaying] = useState(false);

    const speak = async (text: string) => {
        if (!text) return;
        setIsPlaying(true);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA'; // Default to Arabic, though Egyptian is ideal
        utterance.rate = 0.85; // Meditative, slow
        utterance.pitch = 0.9; // Lower pitch for calmness

        // Find best Arabic voice
        const voices = window.speechSynthesis.getVoices();
        const bestVoice = voices.find(v => v.lang.includes('ar')) || voices[0];
        if (bestVoice) utterance.voice = bestVoice;

        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        window.speechSynthesis.speak(utterance);
    };

    const handleTrigger = useCallback(async () => {
        if (!isOptedIn || !trigger) return;

        try {
            const { data: { session } } = await supabase!.auth.getSession();
            const res = await fetch('/api/voice-presence', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(trigger)
            });

            if (res.ok) {
                const data = await res.json();
                if (data.script && !data.skip) {
                    // Delay slightly to feel natural
                    setTimeout(() => speak(data.script), 2000);
                }
            }
        } catch (err) {
            console.error("Voice Trigger Error:", err);
        }
    }, [isOptedIn, trigger]);

    useEffect(() => {
        if (trigger) handleTrigger();
    }, [trigger, handleTrigger]);

    const toggleOptIn = () => {
        const newVal = !isOptedIn;
        setIsOptedIn(newVal);
        localStorage.setItem('dawayir_voice_presence', String(newVal));
    };

    return (
        <div className="fixed bottom-6 left-6 z-[60]">
            <button
                onClick={toggleOptIn}
                className={`p-3 rounded-full border transition-all flex items-center gap-2 group
                    ${isOptedIn ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-900/50 border-white/5 text-slate-500'}
                `}
                title={isOptedIn ? "احضر اصت فع" : "تفع احضر اصت (اصت اح)"}
            >
                {isOptedIn ? (
                    <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
                ) : (
                    <VolumeX className="w-4 h-4" />
                )}

                <AnimatePresence>
                    {isPlaying && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="text-[10px] font-black uppercase tracking-tighter hidden md:inline"
                        >
                            حضر اع...
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>
        </div>
    );
};
