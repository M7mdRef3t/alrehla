import { FC, useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Mic, MicOff, OracleIcon } from '@/modules/meta/icons/SovereignIcons'; // Assuming these exist, or I can use fallback lucide
import { supabase } from "@/services/supabaseClient";
import { useSynthesisState } from "@/state/synthesisState";

/*
    ORACLE NUCLEUS — Sovereign Voice Presence
    A tactical AI presence indicator that visualizes the "Neural Logic" of the platform.
*/

export const VoicePresence: FC<{
    trigger?: { event: 'shadow_insight' | 'milestone_unlocked' | 'high_impact_action'; context: Record<string, unknown> }
}> = ({ trigger }) => {
    const { audioIntensity } = useSynthesisState();
    const [isOptedIn, setIsOptedIn] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('dawayir_voice_presence') === 'true';
        }
        return false;
    });

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentScript, setCurrentScript] = useState<string | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const speak = useCallback(async (text: string) => {
        if (!text || !isOptedIn) return;
        
        // Stop any current speech
        window.speechSynthesis.cancel();
        
        setIsPlaying(true);
        setCurrentScript(text);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.88; 
        utterance.pitch = 0.95;

        // Voice Selection
        const voices = window.speechSynthesis.getVoices();
        const arabicVoice = voices.find(v => v.lang.includes('ar-SA') || v.lang.includes('ar-EG')) || voices.find(v => v.lang.includes('ar'));
        if (arabicVoice) utterance.voice = arabicVoice;

        utterance.onend = () => {
            setIsPlaying(false);
            setCurrentScript(null);
        };
        utterance.onerror = () => {
            setIsPlaying(false);
            setCurrentScript(null);
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [isOptedIn]);

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
                    setTimeout(() => speak(data.script), 1500);
                }
            }
        } catch (err) {
            console.error("Oracle Trigger Error:", err);
        }
    }, [isOptedIn, trigger, speak]);

    useEffect(() => {
        if (trigger) handleTrigger();
    }, [trigger, handleTrigger]);

    const toggleOptIn = () => {
        const newVal = !isOptedIn;
        setIsOptedIn(newVal);
        localStorage.setItem('dawayir_voice_presence', String(newVal));
        if (!newVal) window.speechSynthesis.cancel();
    };

    return (
        <div className="fixed bottom-10 left-10 z-[60] pointer-events-none">
            <div className="relative flex items-center gap-6 pointer-events-auto">
                
                {/* THE NUCLEUS (Orb) */}
                <button
                    onClick={toggleOptIn}
                    className="relative w-16 h-16 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center group overflow-hidden"
                >
                    {/* Background Pulse */}
                    <AnimatePresence>
                        {isOptedIn && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ 
                                    opacity: [0.1, 0.3, 0.1],
                                    scale: [1, 1.2, 1],
                                }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute inset-0 bg-indigo-500/20 blur-xl"
                            />
                        )}
                    </AnimatePresence>

                    {/* Radial Frequency Visualizer (When Speaking) */}
                    <AnimatePresence>
                        {isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                {[...Array(8)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            height: [10, 40, 10],
                                            opacity: [0.3, 0.6, 0.3],
                                        }}
                                        transition={{
                                            duration: 0.5,
                                            repeat: Infinity,
                                            delay: i * 0.05,
                                        }}
                                        style={{
                                            width: '2px',
                                            margin: '0 1px',
                                            backgroundColor: '#818cf8',
                                            transform: `rotate(${i * 45}deg) translateY(-20px)`,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Core Icon */}
                    <div className="relative z-10 transition-transform group-hover:scale-110">
                        {isOptedIn ? (
                            <Activity className={`w-6 h-6 ${isPlaying ? 'text-indigo-400' : 'text-slate-400'}`} />
                        ) : (
                            <MicOff className="w-5 h-5 text-slate-600" />
                        )}
                    </div>
                </button>

                {/* SCRIPT READOUT (Hud Label) */}
                <AnimatePresence>
                    {isOptedIn && (
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col gap-1"
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                {isPlaying ? "ORACLE ACTIVE" : "ORACLE STANDBY"}
                            </span>
                            
                            {currentScript && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="max-w-[280px] bg-black/40 backdrop-blur-md border border-white/5 rounded-lg p-3"
                                >
                                    <p className="text-xs text-slate-300 leading-relaxed font-arabic text-right">
                                        {currentScript}
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};


