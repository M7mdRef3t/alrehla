import { logger } from "../services/logger";
import type { FC } from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, Volume2, VolumeX, Shield } from "lucide-react";

interface FastingCapsuleProps {
    isOpen: boolean;
    onClose: () => void;
}

type WebkitWindow = Window & {
    webkitAudioContext?: typeof AudioContext;
};

export const FastingCapsule: FC<FastingCapsuleProps> = ({ isOpen, onClose }) => {
    const [duration, setDuration] = useState(10); // Minutes
    const [timeLeft, setTimeLeft] = useState(duration * 60);
    const [isActive, setIsActive] = useState(false);
    const [isNoiseOn, setIsNoiseOn] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        setTimeLeft(duration * 60);
    }, [duration]);

    useEffect(() => {
        let interval: number;

        if (isActive && timeLeft > 0) {
            interval = window.setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            stopNoise();
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    // Audio Logic (White Noise)
    const toggleNoise = () => {
        if (isNoiseOn) {
            stopNoise();
            setIsNoiseOn(false);
        } else {
            startNoise();
            setIsNoiseOn(true);
        }
    };

    const startNoise = () => {
        try {
            if (!audioContextRef.current) {
                const AudioCtor = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
                if (!AudioCtor) return;
                audioContextRef.current = new AudioCtor();
            }

            const ctx = audioContextRef.current;
            if (!ctx) return;

            const bufferSize = 2 * ctx.sampleRate;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                // Pink Noise approximation (gentler than white)
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5;
            }

            noiseNodeRef.current = ctx.createBufferSource();
            noiseNodeRef.current.buffer = noiseBuffer;
            noiseNodeRef.current.loop = true;

            gainNodeRef.current = ctx.createGain();
            gainNodeRef.current.gain.value = 0.05; // Low volume start

            noiseNodeRef.current.connect(gainNodeRef.current);
            gainNodeRef.current.connect(ctx.destination);
            noiseNodeRef.current.start();
        } catch (e) {
            logger.error("Audio Error:", e);
        }
    };

    // Helper for pink noise state
    let lastOut = 0;

    const stopNoise = () => {
        if (noiseNodeRef.current) {
            noiseNodeRef.current.stop();
            noiseNodeRef.current.disconnect();
        }
        if (gainNodeRef.current) {
            gainNodeRef.current.disconnect();
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopNoise();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/95 backdrop-blur-md">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative w-full max-w-md bg-slate-800 border-2 border-slate-700/50 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col items-center"
                    >
                        {/* Ambient Background Glow */}
                        <div className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? "opacity-30" : "opacity-0"}`}>
                            <div className="absolute inset-0 bg-gradient-to-t from-teal-500/20 to-transparent animate-pulse"></div>
                        </div>

                        {/* Header */}
                        <div className="relative w-full p-6 flex justify-between items-center z-10">
                            <div className="flex items-center gap-2 text-teal-400">
                                <Shield className="w-5 h-5" />
                                <span className="font-bold text-sm tracking-wider uppercase">Fasting Capsule</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Main Timer UI */}
                        <div className="relative z-10 flex flex-col items-center justify-center py-6">
                            <div className="relative w-64 h-64 flex items-center justify-center">
                                {/* Progress Ring */}
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle cx="128" cy="128" r="120" className="stroke-slate-700 fill-none" strokeWidth="6" />
                                    <motion.circle
                                        cx="128" cy="128" r="120"
                                        className="stroke-teal-500 fill-none"
                                        strokeWidth="6"
                                        strokeLinecap="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: isActive ? 1 - (timeLeft / (duration * 60)) : 0 }}
                                        transition={{ duration: 1, ease: "linear" }}
                                        strokeDasharray="1 1"
                                    />
                                </svg>

                                {/* Digits */}
                                <div className="text-center space-y-2">
                                    <div className="text-6xl font-mono font-bold text-white tracking-widest tabular-nums">
                                        {formatTime(timeLeft)}
                                    </div>
                                    <p className="text-teal-400/80 text-xs font-semibold uppercase tracking-widest">
                                        {isActive ? "DETOX MODE ON" : "READY FOR ISOLATION"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="relative z-10 w-full px-8 pb-8 space-y-6">

                            {/* Duration Selection (Only if stopped) */}
                            {!isActive && (
                                <div className="flex justify-center gap-3">
                                    {[10, 20, 30, 45].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setDuration(m)}
                                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${duration === m
                                                    ? "bg-teal-500 text-slate-900 border-teal-500"
                                                    : "bg-slate-700/50 text-slate-400 border-slate-600 hover:border-slate-400"
                                                }`}
                                        >
                                            {m}m
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center justify-center gap-6">
                                {/* Play/Pause */}
                                <button
                                    onClick={() => {
                                        if (isActive) {
                                            setIsActive(false);
                                            stopNoise(); // Stop noise if pausing
                                            setIsNoiseOn(false);
                                        } else {
                                            setIsActive(true);
                                            if (!isNoiseOn) {
                                                startNoise(); // Auto-start noise on play
                                                setIsNoiseOn(true);
                                            }
                                        }
                                    }}
                                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${isActive
                                            ? "bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-amber-500/30"
                                            : "bg-teal-500 hover:bg-teal-400 text-slate-900 shadow-teal-500/30"
                                        }`}
                                >
                                    {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                                </button>

                                {/* Noise Toggle */}
                                <button
                                    onClick={toggleNoise}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${isNoiseOn
                                            ? "bg-slate-700 text-white border-slate-600"
                                            : "bg-transparent text-slate-500 border-slate-700 hover:border-slate-500"
                                        }`}
                                    title={isNoiseOn ? "Mute White Noise" : "Play White Noise"}
                                >
                                    {isNoiseOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Hint */}
                            <p className="text-center text-xs text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                                تفعيل الضوضاء البيضاء يساعد في حجب المشتتات وتقليل الرغبة الملحة.
                            </p>

                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
