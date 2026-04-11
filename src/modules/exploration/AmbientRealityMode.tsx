import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { useSwarmState } from "@/domains/admin/store/swarm.store";
import { usePulseState } from "@/domains/consciousness/store/pulse.store";

interface AmbientRealityModeProps {
    onClose: () => void;
}

export function AmbientRealityMode({ onClose }: AmbientRealityModeProps) {
    const { activePersona } = useSwarmState();
    const { lastPulse } = usePulseState();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const controlsTimeoutRef = useRef<number | null>(null);
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    // Determine Mood & Colors based on Persona or Pulse
    const getMoodConfig = () => {
        if (activePersona === "COMFORTER") {
            return {
                bg: "linear-gradient(to bottom, #f59e0b, #78350f)",
                accent: "#fbbf24",
                text: "الاحتواء الدافئ",
                animationDuration: 6, // Slow breathing
            };
        }
        if (activePersona === "TACTICIAN") {
            return {
                bg: "linear-gradient(to bottom, #ef4444, #7f1d1d)",
                accent: "#f87171",
                text: "وضع الاشتباك",
                animationDuration: 3, // Fast, alert
            };
        }
        if (activePersona === "STOIC") {
            return {
                bg: "linear-gradient(to bottom, #0f172a, #1e293b)",
                accent: "#38bdf8",
                text: "السكون العميق",
                animationDuration: 8, // Very slow, deep
            };
        }
        // Fallback based on pulse
        if (lastPulse?.mood === "angry") {
            return {
                bg: "linear-gradient(to bottom, #991b1b, #450a0a)",
                accent: "#fca5a5",
                text: "تفريغ الغضب",
                animationDuration: 4,
            };
        }
        return {
            bg: "linear-gradient(to bottom, #0f172a, #000000)",
            accent: "#2dd4bf",
            text: "الوضع الكوني",
            animationDuration: 10,
        };
    };

    const config = getMoodConfig();

    // Wake Lock Implementation
    useEffect(() => {
        const requestWakeLock = async () => {
            if ("wakeLock" in navigator) {
                try {
                    const sentinel = await navigator.wakeLock.request("screen");
                    wakeLockRef.current = sentinel;
                } catch (err) {
                    console.warn("Wake Lock request failed:", err);
                }
            }
        };
        requestWakeLock();
        return () => {
            wakeLockRef.current?.release();
        };
    }, []);

    // Auto-hide controls
    useEffect(() => {
        const resetControls = () => {
            setShowControls(true);
            if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = window.setTimeout(() => setShowControls(false), 3000);
        };

        window.addEventListener("mousemove", resetControls);
        window.addEventListener("touchstart", resetControls);
        resetControls();

        return () => {
            window.removeEventListener("mousemove", resetControls);
            window.removeEventListener("touchstart", resetControls);
            if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.warn(`Error attempting to enable full-screen mode: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] overflow-hidden flex items-center justify-center isolate"
            style={{ background: config.bg }}
        >
            {/* Ambient Breathing Light */}
            <motion.div
                animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                    duration: config.animationDuration,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute w-[80vw] h-[80vw] rounded-full blur-[100px]"
                style={{ background: config.accent }}
            />

            {/* Secondary Pulse */}
            <motion.div
                animate={{
                    scale: [1.2, 0.8, 1.2],
                    opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                    duration: config.animationDuration * 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                }}
                className="absolute w-[60vw] h-[60vw] rounded-full blur-[80px] mix-blend-overlay"
                style={{ background: "#ffffff" }}
            />

            {/* Center Focus */}
            <div className="relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 2 }}
                >
                    <h2
                        className="text-4xl md:text-6xl font-black tracking-tighter mb-4 drop-shadow-2xl"
                        style={{ color: "rgba(255,255,255,0.9)" }}
                    >
                        {config.text}
                    </h2>
                    <p className="text-white/60 text-lg font-light tracking-widest uppercase">
                        Ambient Mode Active
                    </p>
                </motion.div>
            </div>

            {/* Controls Overlay */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 pointer-events-none"
                    >
                        {/* Top Bar */}
                        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center pointer-events-auto bg-gradient-to-b from-black/40 to-transparent">
                            <button
                                onClick={onClose}
                                className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all text-white border border-white/10"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setAudioEnabled(!audioEnabled)}
                                    className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all text-white border border-white/10"
                                >
                                    {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={toggleFullscreen}
                                    className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all text-white border border-white/10"
                                >
                                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Bottom Hint */}
                        <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
                            <p className="text-white/40 text-sm">
                                Screen will stay awake. Place device in room center.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dummy Audio Element (Placeholder for Phase 30 sound engine) */}
            {audioEnabled && (
                <div className="hidden">
                    {/* Future: Implement binaural beats or white noise here */}
                </div>
            )}
        </motion.div>
    );
}
