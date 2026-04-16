import React, { memo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Shield, 
    Map as MapIcon, 
    Crosshair, 
    TrendingUp, 
    Sparkles, 
    Wind, 
    ChevronRight,
    Activity,
    Brain,
    Lock,
    EyeOff,
    Power,
    Mic
} from "lucide-react";
import { usePulseState } from "@/domains/consciousness/store/pulse.store";
import { useMapState } from '@/modules/map/dawayirIndex';
import { useAuthState } from "@/domains/auth/store/auth.store";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { useSanctuaryState } from "@/domains/consciousness/store/sanctuary.store";
import {
    getEnabledJourneySteps,
    getJourneyPathBySlug,
    hasEnabledJourneyStepKind,
    isJourneyScreenEnabled
} from "@/utils/journeyPaths";

interface SanctuaryDashboardProps {
    onNavigate: (screen: string) => void;
    onOpenBreathing: () => void;
}

export const SanctuaryDashboard: React.FC<SanctuaryDashboardProps> = memo(({ onNavigate, onOpenBreathing }) => {
    const lastPulse = usePulseState((s) => s.lastPulse);
    const nodes = useMapState((s) => s.nodes);
    const user = useAuthState((s) => s.user);
    const journeyPaths = useAdminState((s) => s.journeyPaths);
    
    // Virtual Sanctuary Store
    const isVoidProtocolActive = useSanctuaryState((s) => s.isVoidProtocolActive);
    const activateVoidProtocol = useSanctuaryState((s) => s.activateVoidProtocol);
    const deactivateVoidProtocol = useSanctuaryState((s) => s.deactivateVoidProtocol);
    const ephemeralThoughts = useSanctuaryState((s) => s.ephemeralThoughts);
    const addEphemeralThought = useSanctuaryState((s) => s.addEphemeralThought);
    const removeEphemeralThought = useSanctuaryState((s) => s.removeEphemeralThought);

    const [completedSteps, setCompletedSteps] = React.useState<Record<string, boolean>>({});
    const [thoughtText, setThoughtText] = useState("");
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const textRef = useRef("");

    useEffect(() => {
        // Init Web Speech API
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'ar-EG'; 

            recognitionRef.current.onresult = (event: any) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setThoughtText(currentTranscript);
                textRef.current = currentTranscript;
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
                if (textRef.current.trim()) {
                    addEphemeralThought(textRef.current.trim());
                    // Clear after submitting
                    setThoughtText("");
                    textRef.current = "";
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };
        }
        
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [addEphemeralThought]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setThoughtText("");
            textRef.current = "";
            try {
                recognitionRef.current?.start();
                setIsListening(true);
            } catch (e) {
                console.error("Error starting speech recognition", e);
            }
        }
    };

    const toggleStep = (stepId: string) => {
        setCompletedSteps(prev => ({ ...prev, [stepId]: !prev[stepId] }));
    };

    const handleThoughtSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (thoughtText.trim() && !isListening) {
            addEphemeralThought(thoughtText.trim());
            setThoughtText("");
            textRef.current = "";
        } else if (isListening) {
            toggleListening(); // End listening and let onend handle the submit
        }
    };

    // Auto-remove thoughts after 8 seconds (Ephemeral vanishing)
    useEffect(() => {
        if (ephemeralThoughts.length > 0) {
            const timeouts = ephemeralThoughts.map(thought => {
                return setTimeout(() => {
                    removeEphemeralThought(thought.id);
                }, 8000);
            });
            return () => timeouts.forEach(clearTimeout);
        }
    }, [ephemeralThoughts, removeEphemeralThought]);

    const activeNodes = nodes.filter(n => !n.isNodeArchived);
    const energyLevel = lastPulse?.energy ?? 5;
    const emailPrefix = user?.email?.split("@")[0] || "Sovereign";
    const sanctuaryPath = getJourneyPathBySlug(journeyPaths, "sanctuary");
    const sanctuarySteps = getEnabledJourneySteps(sanctuaryPath);
    const sanctuaryBreathingEnabled = hasEnabledJourneyStepKind(sanctuaryPath, "intervention");
    
    // Only used when not in void protocol
    const primaryActionVisible = isJourneyScreenEnabled(sanctuaryPath, sanctuaryPath?.primaryActionScreen || "map");
    const secondaryActionVisible = isJourneyScreenEnabled(sanctuaryPath, sanctuaryPath?.secondaryActionScreen || "armory");
    const tertiaryActionVisible = isJourneyScreenEnabled(sanctuaryPath, sanctuaryPath?.tertiaryActionScreen || "insights");

    const energyColor = energyLevel <= 3 ? "text-[var(--consciousness-critical)]" : energyLevel <= 6 ? "text-[var(--consciousness-accent)]" : "text-[var(--consciousness-primary)]";

    // --- Soul Core Sync Metrics (Driven by Pulse) ---
    const coreBeatDuration = isVoidProtocolActive 
        ? 8 // Deep calm in void
        : energyLevel <= 3 ? 6 // Slow, heavy exhausted heartbeat
        : energyLevel <= 6 ? 4 // Normal steady heartbeat
        : 2; // Fast, energetic heartbeat

    const ringBaseDuration = isVoidProtocolActive 
        ? 20 // Hyper-calm orbit
        : energyLevel <= 3 ? 15 
        : energyLevel <= 6 ? 10 
        : 6;

    const coreGlowColor = energyLevel <= 3 
        ? "var(--consciousness-critical)" // Rose
        : energyLevel <= 6 
            ? "var(--consciousness-accent)" // Amber
            : "var(--consciousness-primary)"; // Teal

    const coreGlowRgba = energyLevel <= 3 
        ? "rgba(244,63,94,0.15)"
        : energyLevel <= 6 
            ? "rgba(245,158,11,0.15)"
            : "var(--ds-color-primary-glow)";
            
    const coreShadowRgba = energyLevel <= 3 
        ? "rgba(244,63,94,0.2)"
        : energyLevel <= 6 
            ? "rgba(245,158,11,0.2)"
            : "var(--ds-color-primary-glow)";

    return (
        <div className="relative w-full min-h-screen flex flex-col items-center justify-center p-6 sm:p-10 overflow-hidden" dir="rtl">
            
            {/* ── Background Layer ── */}
            <div className="fixed inset-0 pointer-events-none z-0 transition-colors duration-1000" style={{ backgroundColor: isVoidProtocolActive ? "#010103" : "var(--consciousness-background)" }}>
                <AnimatePresence>
                    {!isVoidProtocolActive && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1 }}
                        >
                            <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] rounded-full bg-[var(--ds-color-primary-glow)] blur-[120px] animate-pulse" />
                            <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[100px] animate-pulse delay-1000" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-10">
                
                {/* ── Left Column: Metrics (Fades out when Void Protocol is active) ── */}
                <motion.div 
                    animate={{ 
                        opacity: isVoidProtocolActive ? 0 : 1,
                        x: isVoidProtocolActive ? -40 : 0,
                        pointerEvents: isVoidProtocolActive ? 'none' : 'auto'
                    }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="lg:col-span-3 space-y-6"
                >
                    <div className="glass-heavy p-6 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 blur-2xl group-hover:bg-teal-500/20 transition-all" />
                        
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-[var(--ds-color-primary-glow)] border border-teal-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(45,212,191,0.2)] transition-shadow group-hover:shadow-[0_0_25px_var(--consciousness-primary)]">
                                    <Shield className="text-[var(--consciousness-primary)] w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-500/70">Sovereign Account</h3>
                                    <p className="text-lg font-black text-[var(--ds-theme-text-primary)]">{emailPrefix}</p>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-white/5">
                                <div className="flex justify-between items-center text-[11px] font-bold">
                                    <span className="text-slate-500 uppercase tracking-widest">Energy Matrix</span>
                                    <span className={energyColor}>{energyLevel * 10}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${energyLevel * 10}%` }}
                                        className={`h-full ${energyLevel <= 3 ? 'bg-rose-500' : energyLevel <= 6 ? 'bg-amber-500' : 'bg-teal-500'} shadow-[0_0_10px_currentColor]`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-dark p-6 rounded-[2rem] border-white/5 space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Activity className="w-3 h-3" /> مؤشرات الملاذ
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-[9px] text-slate-500 uppercase block">الكيانات النشطة</span>
                                <span className="text-xl font-black text-white font-mono">{activeNodes.length}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] text-slate-500 uppercase block">الدرع النشط</span>
                                <span className="text-xl font-black text-[var(--consciousness-primary)] font-mono">100%</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── Center Column: Soul Core / Cognitive Faraday Cage ── */}
                <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="lg:col-span-6 flex flex-col items-center justify-center relative z-20"
                >
                    <div className="relative w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] flex items-center justify-center">
                        
                        {/* Void Ring Expansion */}
                        <AnimatePresence>
                            {isVoidProtocolActive && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1.5 }}
                                    exit={{ opacity: 0, scale: 0 }}
                                    transition={{ duration: 1.5, ease: "easeInOut" }}
                                    className="absolute inset-0 rounded-full bg-slate-950 blur-3xl pointer-events-none"
                                    style={{ zIndex: -1 }}
                                />
                            )}
                        </AnimatePresence>

                        {/* Recursive Aura Rings */}
                        {[...Array(4)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute rounded-full border transition-colors duration-1000"
                                style={{
                                    width: `${100 + i * 25}%`,
                                    height: `${100 + i * 25}%`,
                                    borderColor: isVoidProtocolActive 
                                        ? 'rgba(255,255,255,0.02)' 
                                        : `color-mix(in srgb, ${coreGlowColor} ${10 - i * 2}%, transparent)`
                                }}
                                animate={{
                                    scale: [1, 1.05, 1],
                                    opacity: isVoidProtocolActive ? [0.05, 0.1, 0.05] : [0.1, 0.25, 0.1],
                                    rotate: i % 2 === 0 ? 360 : -360
                                }}
                                transition={{
                                    duration: ringBaseDuration + i * 3, // Dynamic ring speed based on pulse
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                            />
                        ))}

                        {/* Pulsating Soul Core */}
                        <motion.div 
                            className="relative z-10 w-56 h-56 sm:w-72 sm:h-72 rounded-full flex flex-col items-center justify-center text-center p-8 overflow-hidden group hover:scale-105 transition-all duration-700 cursor-pointer"
                            onClick={() => isVoidProtocolActive ? deactivateVoidProtocol() : activateVoidProtocol('deep')}
                            style={{
                                background: isVoidProtocolActive 
                                    ? "radial-gradient(circle at center, rgba(15,23,42,1) 0%, transparent 80%)" 
                                    : `radial-gradient(circle at center, ${coreGlowRgba} 0%, transparent 70%)`,
                                border: isVoidProtocolActive 
                                    ? "1px solid rgba(255,255,255,0.05)" 
                                    : `1.5px solid color-mix(in srgb, ${coreGlowColor} 25%, transparent)`,
                                boxShadow: isVoidProtocolActive 
                                    ? "0 0 80px rgba(0,0,0,0.8) inset" 
                                    : `0 0 50px ${coreShadowRgba}`
                            }}
                        >
                            <AnimatePresence mode="wait">
                                {!isVoidProtocolActive ? (
                                    <motion.div
                                        key="normal"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: [1, 1.05, 1] }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: coreBeatDuration, repeat: Infinity, ease: "easeInOut" }}
                                        className="relative z-10 flex flex-col items-center"
                                    >
                                        <Sparkles className={`w-10 h-10 mb-4 animate-pulse relative z-10 ${energyLevel <= 3 ? 'text-rose-400' : energyLevel <= 6 ? 'text-amber-400' : 'text-teal-400'}`} />
                                        <h2 className={`text-2xl sm:text-3xl font-black mb-2 leading-tight ${energyLevel <= 3 ? 'text-rose-100' : energyLevel <= 6 ? 'text-amber-100' : 'text-white'}`}>
                                           {energyLevel <= 3 ? "أنت مستنزف" : energyLevel <= 6 ? "في المنتصف" : "أنت في أمان"}
                                        </h2>
                                        <p className={`text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-4 ${energyLevel <= 3 ? 'text-rose-300/80' : energyLevel <= 6 ? 'text-amber-300/80' : 'text-teal-100/60'}`}>
                                            {energyLevel <= 3 ? "تحتاج للعزلة فوراً" : energyLevel <= 6 ? "حافظ على توازنك" : "هذه هي مساحتك الخاصة"}
                                        </p>
                                        
                                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/50 border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity ${energyLevel <= 3 ? 'shadow-[0_0_15px_rgba(244,63,94,0.3)]' : ''}`}>
                                            <Power className={`w-3 h-3 ${energyLevel <= 3 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
                                            <span className={`text-[9px] font-black uppercase ${energyLevel <= 3 ? 'text-rose-400' : 'text-slate-400'}`}>Initiate Sensory Void</span>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="void"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: [0.95, 1, 0.95] }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                        className="relative z-10 flex flex-col items-center"
                                    >
                                        <EyeOff className="w-8 h-8 text-slate-700/50 mb-4" />
                                        <h2 className="text-xl sm:text-2xl font-black text-slate-600 mb-2 leading-tight tracking-widest">تجريد تام</h2>
                                        <p className="text-[10px] text-slate-700 font-bold uppercase tracking-[0.3em] mb-4">لا أحد يراقب، ولا شيء يُحسب</p>
                                        
                                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/30 border border-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Power className="w-3 h-3 text-slate-500" />
                                            <span className="text-[9px] font-black uppercase text-slate-500">Return to Matrix</span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Floating Interaction Labels */}
                        {!isVoidProtocolActive && (
                            <motion.button
                                initial={energyLevel < 4 ? { scale: 0.8, opacity: 0 } : false}
                                animate={energyLevel < 4 ? { scale: [1, 1.1, 1], opacity: 1, boxShadow: ["0 0 0px rgba(45,212,191,0)", "0 0 20px rgba(45,212,191,0.5)", "0 0 0px rgba(45,212,191,0)"] } : {}}
                                transition={energyLevel < 4 ? { duration: 2, repeat: Infinity } : {}}
                                whileHover={{ scale: 1.1, x: 10 }}
                                onClick={() => sanctuaryBreathingEnabled && onOpenBreathing()}
                                hidden={!sanctuaryBreathingEnabled}
                                aria-hidden={!sanctuaryBreathingEnabled}
                                className={`absolute z-20 ${energyLevel < 4 ? "-top-12 -right-5 ring-2 ring-teal-500/50 bg-teal-500/20" : "-top-10 -right-10 hover:bg-teal-500/10"} ds-card px-4 py-2 rounded-full border-teal-500/30 flex items-center gap-2 group transition-all cursor-pointer`}
                            >
                                <Wind className="w-4 h-4 text-[var(--consciousness-primary)]" />
                                <span className="text-[10px] font-black uppercase text-[var(--ds-theme-text-primary)]">
                                    {energyLevel < 4 ? "التقط أنفاسك الآن" : "خذ نفساً"}
                                </span>
                            </motion.button>
                        )}
                    </div>

                    <div className="mt-12 text-center max-w-sm transition-opacity duration-1000" style={{ opacity: isVoidProtocolActive ? 0.3 : 1 }}>
                        <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed" dir="rtl">
                            {isVoidProtocolActive 
                                ? "\"نحن لا نختبئ من الحياة، نحن نستعيد أنفسنا منها.\""
                                : "\"الهدوء مش غياب العاصفة، الهدوء هو وجودك في الملاذ وأنت اللي بتتحكم في العاصفة.\""}
                        </p>
                    </div>

                    {/* Original Sanctuary Checklist (hidden during void context) */}
                    <AnimatePresence>
                        {sanctuaryPath && !isVoidProtocolActive && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="mt-8 w-full max-w-2xl rounded-[2rem] border border-cyan-500/10 bg-slate-950/40 p-6 text-right"
                            >
                                <div className="mb-4 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400/70">Path Runtime</p>
                                        <h3 className="mt-2 text-xl font-black text-white">{sanctuaryPath.title}</h3>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-[10px] font-black ${sanctuaryPath.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-800 text-slate-400"}`}>
                                        {sanctuaryPath.isActive ? "فعال" : "متوقف"}
                                    </span>
                                </div>
                                <p className="text-sm leading-7 text-slate-400">{sanctuaryPath.description}</p>

                                <div className="mt-5 grid gap-3">
                                    {sanctuarySteps.map((step, index) => {
                                        const isDone = completedSteps[step.id];
                                        return (
                                            <div
                                                key={step.id}
                                                onClick={() => toggleStep(step.id)}
                                                className={`rounded-[1.25rem] border p-4 cursor-pointer transition-all duration-300 group ${isDone ? "border-emerald-500/30 bg-emerald-500/5 opacity-60 hover:opacity-100" : step.screen === "sanctuary" ? "border-cyan-500/30 bg-cyan-500/10" : "border-white/5 bg-white/[0.02] hover:bg-white/5"}`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${isDone ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white"} text-[11px] font-black`}>
                                                            {isDone ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : (index + 1)}
                                                        </div>
                                                        <div>
                                                            <div className={`text-sm font-black transition-colors ${isDone ? "text-emerald-300 line-through decoration-emerald-500/50" : "text-white group-hover:text-cyan-100"}`}>{step.title}</div>
                                                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{step.kind} / {step.screen}</div>
                                                        </div>
                                                    </div>
                                                    {step.screen === "sanctuary" && !isDone && (
                                                        <span className="rounded-full bg-cyan-500/15 px-2 py-1 text-[10px] font-black text-cyan-300">أنت هنا</span>
                                                    )}
                                                </div>
                                                <p className={`mt-3 text-sm leading-6 transition-colors ${isDone ? "text-slate-500" : "text-slate-400"}`}>{step.description}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* ── Right Column: Tactical Hub vs Whisper Pad ── */}
                <motion.div 
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ 
                        opacity: 1, 
                        x: 0,
                    }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="lg:col-span-3 h-full flex flex-col gap-4 relative"
                >
                    <AnimatePresence mode="wait">
                        {!isVoidProtocolActive ? (
                            <motion.div 
                                key="tactical"
                                initial={{ opacity: 0, position: "absolute", top: 0, right: 0, width: "100%" }}
                                animate={{ opacity: 1, position: "relative" }}
                                exit={{ opacity: 0, position: "absolute", top: 0, right: 0, width: "100%" }}
                                className="flex flex-col gap-4"
                            >
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 mr-2">Tactical Hub // العمليات</h3>
                                
                                <button 
                                    onClick={() => onNavigate(sanctuaryPath?.primaryActionScreen || "map")}
                                    hidden={!primaryActionVisible}
                                    aria-hidden={!primaryActionVisible}
                                    className="group relative w-full p-5 rounded-[2rem] glass-card border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10 hover:border-teal-400/50 hover:shadow-[0_0_30px_rgba(45,212,191,0.15)] hover:scale-[1.02] transition-all overflow-hidden text-right"
                                >
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500 group-hover:shadow-[0_0_15px_var(--consciousness-primary)] transition-all duration-300" />
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors shadow-inner">
                                            <MapIcon className="w-6 h-6 text-teal-400 transition-colors" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-white group-hover:text-teal-50 transition-colors">{sanctuaryPath?.primaryActionLabel || "خريطة العلاقات"}</h4>
                                            <p className="text-[10px] text-teal-100/60 font-medium">المرصد الرقمي لوعيك</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-teal-500/50 mr-auto group-hover:text-teal-400 group-hover:-translate-x-2 group-hover:scale-125 transition-all" />
                                    </div>
                                </button>

                                <button 
                                    onClick={() => onNavigate(sanctuaryPath?.secondaryActionScreen || "armory")}
                                    hidden={!secondaryActionVisible}
                                    aria-hidden={!secondaryActionVisible}
                                    className="group relative w-full p-5 rounded-[2rem] bg-white/[0.01] border-white/5 hover:bg-rose-500/5 hover:border-rose-500/30 transition-all overflow-hidden text-right opacity-80 hover:opacity-100"
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-rose-500/10 transition-colors">
                                            <Crosshair className="w-6 h-6 text-slate-500 group-hover:text-rose-400 transition-colors" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-300 group-hover:text-white">{sanctuaryPath?.secondaryActionLabel || "الترسانة والصد"}</h4>
                                            <p className="text-[10px] text-slate-500 font-medium">بروتوكولات الحماية الفورية</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-700 mr-auto group-hover:text-rose-500 group-hover:-translate-x-1 transition-all" />
                                    </div>
                                </button>

                                <button 
                                    onClick={() => onNavigate(sanctuaryPath?.tertiaryActionScreen || "insights")}
                                    hidden={!tertiaryActionVisible}
                                    aria-hidden={!tertiaryActionVisible}
                                    className="group relative w-full p-5 rounded-[2rem] glass-card border-white/5 hover:border-indigo-500/30 transition-all overflow-hidden text-right"
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
                                            <TrendingUp className="w-6 h-6 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-white">{sanctuaryPath?.tertiaryActionLabel || "رادار التقدم"}</h4>
                                            <p className="text-[10px] text-slate-500 font-medium">تحليل المسار والاحتمالات</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-700 mr-auto group-hover:text-indigo-500 group-hover:-translate-x-1 transition-all" />
                                    </div>
                                </button>

                                <div className="mt-4 p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col gap-3 relative overflow-hidden group">
                                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-500/10 blur-3xl group-hover:bg-amber-500/20 transition-colors" />
                                    <div className="flex items-center gap-2 mb-1">
                                        <Brain className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-500/90">Oracle Broadcast</span>
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-300 leading-relaxed italic" dir="rtl">
                                        {energyLevel <= 3 
                                            ? "استنزاف ملحوظ! طاقتك الحرجة تتطلب التوقف الفوري.. خدلك نفس عميق واشحن درعك في الترسانة بدل أي احتكاك دلوقتي."
                                            : energyLevel <= 6 
                                                ? "طاقتك في حالة حذر.. استخدم الوقت ده لترتيب الأفكار المكركبة على خريطة العلاقات بدون صدام مباشر." 
                                                : "الطاقة في أوجها 🔥.. ده السلاح الأقوى دلوقتي لإنهاء التردد واتخاذ قرارات تقطع حدود صحية مع الدائرة الصفرا."
                                        }
                                    </p>
                                    <div className="flex items-center gap-1.5 opacity-60">
                                        <Lock className="w-2.5 h-2.5 text-amber-500/50" />
                                        <span className="text-[8px] font-bold uppercase tracking-tighter text-slate-400">Generative Encrypted Insight</span>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="whisper-pad"
                                initial={{ opacity: 0, position: "absolute", top: 0, right: 0, width: "100%", y: 20 }}
                                animate={{ opacity: 1, position: "relative", y: 0 }}
                                exit={{ opacity: 0, position: "absolute", top: 0, right: 0, width: "100%" }}
                                className="flex flex-col gap-6"
                            >
                                <div className="flex flex-col gap-2 mb-2">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 flex items-center gap-2">
                                        <Mic className="w-3.5 h-3.5" />
                                        The Whisper Pad
                                    </h3>
                                    <p className="text-[10px] text-slate-700 leading-relaxed">
                                        مساحة لتفريغ الأفكار العشوائية التلقائية. الكلمات المكتوبة هنا محصنة بالتشفير العابر، تتبخر ولا يتم الاحتفاظ بها في أي قاعدة بيانات ولا حتى في جهازك بعد انتهاء الجلسة.
                                    </p>
                                </div>

                                {/* Floating Thoughts Area */}
                                <div className="flex-1 w-full min-h-[150px] relative pointer-events-none flex flex-col-reverse gap-4 pb-4">
                                    <AnimatePresence>
                                        {ephemeralThoughts.map((thought, idx) => (
                                            <motion.div
                                                key={thought.id}
                                                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                                                animate={{ opacity: 0.6 - (idx * 0.1), y: 0, filter: "blur(0px)" }}
                                                exit={{ opacity: 0, filter: "blur(10px)", scale: 0.95 }}
                                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                                className="text-sm font-medium text-slate-500 italic text-right px-4"
                                            >
                                                "{thought.text}"
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>

                                <form onSubmit={handleThoughtSubmit} className="relative z-10 flex items-center gap-3">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={thoughtText}
                                            onChange={(e) => {
                                                setThoughtText(e.target.value);
                                                textRef.current = e.target.value;
                                            }}
                                            disabled={isListening}
                                            placeholder={isListening ? "مسجل الأفكار يعمل... تحدث ليتبخر كلامك" : "اكتب أو سجل ما يقلقك ليتلاشى..."}
                                            className={`w-full bg-slate-900/50 border ${isListening ? 'border-teal-500/30 shadow-[0_0_10px_rgba(45,212,191,0.05)]' : 'border-slate-800'} rounded-[1.5rem] px-5 py-4 pl-12 text-sm text-slate-400 placeholder:text-slate-600 outline-none focus:border-slate-600 transition-all`}
                                        />
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                                            <button 
                                                type="submit" 
                                                disabled={!thoughtText.trim() && !isListening}
                                                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-800/80 text-slate-500 disabled:opacity-30 hover:bg-slate-700 hover:text-slate-300 transition-all pointer-events-auto"
                                            >
                                                <Wind className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <button
                                        type="button"
                                        onClick={toggleListening}
                                        className={`w-12 h-12 rounded-full flex flex-shrink-0 items-center justify-center transition-all duration-300 group ${isListening ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)] hover:bg-rose-500/20' : 'bg-slate-800/30 text-slate-400 border border-slate-700/30 hover:bg-slate-800/80 hover:text-slate-300 hover:border-slate-600'}`}
                                    >
                                        <Mic className={`w-5 h-5 ${isListening ? 'animate-bounce text-rose-400' : 'group-hover:scale-110 transition-transform'}`} />
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Bottom Floating Bar */}
            <motion.div 
                animate={{ 
                    opacity: isVoidProtocolActive ? 0 : 1,
                    y: isVoidProtocolActive ? 50 : 0,
                    pointerEvents: isVoidProtocolActive ? 'none' : 'auto'
                }}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-4 p-2 rounded-2xl ds-card border-white/5 shadow-2xl transition-opacity duration-1000"
            >
                <div className="px-4 py-2 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[var(--consciousness-primary)] animate-pulse" />
                    <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Sovereign Online</span>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <button className="px-4 py-2 text-[10px] font-black text-[var(--consciousness-primary)] uppercase tracking-widest hover:text-white transition-colors">
                    سجل المهام
                </button>
            </motion.div>

        </div>
    );
});
