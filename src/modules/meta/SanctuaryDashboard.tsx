import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Shield, 
    Zap, 
    Map as MapIcon, 
    Crosshair, 
    TrendingUp, 
    Sparkles, 
    Wind, 
    ChevronRight,
    Activity,
    Brain,
    Lock
} from "lucide-react";
import { usePulseState } from "@/domains/consciousness/store/pulse.store";
import { useMapState } from "@/domains/dawayir/store/map.store";
import { useAuthState } from "@/domains/auth/store/auth.store";
import { useAdminState } from "@/domains/admin/store/admin.store";
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

    const activeNodes = nodes.filter(n => !n.isNodeArchived);
    const energyLevel = lastPulse?.energy ?? 5;
    const emailPrefix = user?.email?.split("@")[0] || "Sovereign";
    const sanctuaryPath = getJourneyPathBySlug(journeyPaths, "sanctuary");
    const sanctuarySteps = getEnabledJourneySteps(sanctuaryPath);
    const sanctuaryBreathingEnabled = hasEnabledJourneyStepKind(sanctuaryPath, "intervention");
    const primaryActionVisible = isJourneyScreenEnabled(sanctuaryPath, sanctuaryPath?.primaryActionScreen || "map");
    const secondaryActionVisible = isJourneyScreenEnabled(sanctuaryPath, sanctuaryPath?.secondaryActionScreen || "armory");
    const tertiaryActionVisible = isJourneyScreenEnabled(sanctuaryPath, sanctuaryPath?.tertiaryActionScreen || "insights");

    // Dynamic styles based on energy
    const energyColor = energyLevel <= 3 ? "text-[var(--consciousness-critical)]" : energyLevel <= 6 ? "text-[var(--consciousness-accent)]" : "text-[var(--consciousness-primary)]";

    return (
        <div className="relative w-full min-h-screen flex flex-col items-center justify-center p-6 sm:p-10 overflow-hidden" dir="rtl">
            
            {/* ── Cinematic Background ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[var(--consciousness-background)]" />
                <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] rounded-full bg-[var(--ds-color-primary-glow)] blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[100px] animate-pulse delay-1000" />
            </div>

            <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-10">
                
                {/* ── Left Column: Sovereign Identity ── */}
                <motion.div 
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
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

                {/* ── Center Column: Soul Core ── */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-6 flex flex-col items-center justify-center relative"
                >
                    <div className="relative w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] flex items-center justify-center">
                        {/* Recursive Aura Rings */}
                        {[...Array(4)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute rounded-full border border-teal-500/10"
                                style={{
                                    width: `${100 + i * 25}%`,
                                    height: `${100 + i * 25}%`,
                                }}
                                animate={{
                                    scale: [1, 1.05, 1],
                                    opacity: [0.1, 0.25, 0.1],
                                    rotate: i % 2 === 0 ? 360 : -360
                                }}
                                transition={{
                                    duration: 8 + i * 2,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                            />
                        ))}

                        {/* Pulsating Soul Core */}
                        <motion.div 
                            className="relative z-10 w-48 h-48 sm:w-64 sm:h-64 rounded-full flex flex-col items-center justify-center text-center p-8 overflow-hidden group hover:scale-105 transition-transform duration-500"
                            style={{
                                background: "radial-gradient(circle at center, var(--ds-color-primary-glow) 0%, transparent 70%)",
                                border: "1.5px solid color-mix(in srgb, var(--consciousness-primary) 25%, transparent)",
                                boxShadow: "0 0 50px var(--ds-color-primary-glow)"
                            }}
                        >
                            <div className="absolute inset-0 bg-teal-500/5 backdrop-blur-3xl" />
                            
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="relative z-10 flex flex-col items-center"
                            >
                                <Sparkles className="w-10 h-10 text-teal-400 mb-4 animate-pulse" />
                                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">أنت في أمان</h2>
                                <p className="text-[11px] sm:text-xs text-teal-100/60 font-bold uppercase tracking-[0.2em]">هذا هو الملاذ الآمن</p>
                            </motion.div>
                        </motion.div>

                        {/* Floating Interaction Labels */}
                        <motion.button
                            whileHover={{ scale: 1.1, x: 10 }}
                            onClick={() => sanctuaryBreathingEnabled && onOpenBreathing()}
                            hidden={!sanctuaryBreathingEnabled}
                            aria-hidden={!sanctuaryBreathingEnabled}
                            className="absolute -top-10 -right-10 ds-card px-4 py-2 rounded-full border-teal-500/30 flex items-center gap-2 group transition-all hover:bg-teal-500/10"
                        >
                            <Wind className="w-4 h-4 text-[var(--consciousness-primary)]" />
                            <span className="text-[10px] font-black uppercase text-[var(--ds-theme-text-primary)]">خذ نفساً</span>
                        </motion.button>
                    </div>

                    <div className="mt-12 text-center max-w-sm">
                        <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed" dir="rtl">
                            "الهدوء مش غياب العاصفة، الهدوء هو وجودك في الملاذ وأنت اللي بتتحكم في العاصفة."
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-3">
                            <span className="h-px w-8 bg-slate-800" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sovereign Quote</span>
                            <span className="h-px w-8 bg-slate-800" />
                        </div>
                    </div>

                    {sanctuaryPath && (
                        <div className="mt-8 w-full max-w-2xl rounded-[2rem] border border-cyan-500/10 bg-slate-950/40 p-6 text-right">
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
                                {sanctuarySteps.map((step, index) => (
                                    <div
                                        key={step.id}
                                        className={`rounded-[1.25rem] border p-4 ${step.screen === "sanctuary" ? "border-cyan-500/30 bg-cyan-500/10" : "border-white/5 bg-white/[0.02]"}`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[11px] font-black text-white">
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <div className="text-sm font-black text-white">{step.title}</div>
                                                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{step.kind} / {step.screen}</div>
                                                </div>
                                            </div>
                                            {step.screen === "sanctuary" && (
                                                <span className="rounded-full bg-cyan-500/15 px-2 py-1 text-[10px] font-black text-cyan-300">أنت هنا</span>
                                            )}
                                        </div>
                                        <p className="mt-3 text-sm leading-6 text-slate-400">{step.description}</p>
                                        {step.note && <p className="mt-2 text-xs leading-6 text-slate-500">{step.note}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* ── Right Column: Tactical Hub ── */}
                <motion.div 
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-3 h-full flex flex-col gap-4"
                >
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 mr-2">Tactical Hub // العمليات</h3>
                    
                    <button 
                        onClick={() => onNavigate(sanctuaryPath?.primaryActionScreen || "map")}
                        hidden={!primaryActionVisible}
                        aria-hidden={!primaryActionVisible}
                        className="group relative w-full p-5 rounded-[2rem] glass-card border-white/5 hover:border-teal-500/30 transition-all overflow-hidden text-right"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-teal-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-teal-500/10 transition-colors">
                                <MapIcon className="w-6 h-6 text-slate-400 group-hover:text-teal-400 transition-colors" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white">{sanctuaryPath?.primaryActionLabel || "خريطة العلاقات"}</h4>
                                <p className="text-[10px] text-slate-500 font-medium">المرصد الرقمي لوعيك</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-700 mr-auto group-hover:text-teal-500 group-hover:-translate-x-1 transition-all" />
                        </div>
                    </button>

                    <button 
                        onClick={() => onNavigate(sanctuaryPath?.secondaryActionScreen || "armory")}
                        hidden={!secondaryActionVisible}
                        aria-hidden={!secondaryActionVisible}
                        className="group relative w-full p-5 rounded-[2rem] glass-card border-white/5 hover:border-rose-500/30 transition-all overflow-hidden text-right"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-rose-500/10 transition-colors">
                                <Crosshair className="w-6 h-6 text-slate-400 group-hover:text-rose-400 transition-colors" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white">{sanctuaryPath?.secondaryActionLabel || "الترسانة والصد"}</h4>
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

                    <div className="mt-4 p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col gap-3 relative overflow-hidden">
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-500/5 blur-3xl" />
                        <div className="flex items-center gap-2 mb-1">
                            <Brain className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-amber-500/70">Oracle Broadcast</span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-400 leading-relaxed italic" dir="rtl">
                            "النهارده طاقتاك مستقرة.. ده أفضل وقت لتصفية العلاقات اللي في الدائرة الصفراء."
                        </p>
                        <div className="flex items-center gap-1.5 opacity-40">
                             <Lock className="w-2.5 h-2.5" />
                             <span className="text-[8px] font-bold uppercase tracking-tighter">End-to-End Encrypted Sanctuary</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Floating Bar */}
            <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-4 p-2 rounded-2xl ds-card border-white/5 shadow-2xl"
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
