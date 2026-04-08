import { logger } from "@/services/logger";
import type { FC } from "react";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchOverviewStats, fetchDreams, saveDream, type OverviewStats } from "@/services/adminApi";
import { OracleService } from "@/services/oracleService";
import { useAuthState } from "@/state/authState";
import { type Dream } from "@/types/dreams";
import { useMapState } from "@/state/mapState";
import { type MapNode } from "@/modules/map/mapTypes";
import { Loader2, Sparkles, Brain, Target, ShieldAlert, Activity, Zap, Radio, AlertCircle } from "lucide-react";
import { DreamsMatrix } from "@/modules/map/DreamsMatrix";
import { usePredictiveState } from "@/state/predictiveState";
import { PredictiveEngine } from "@/services/predictiveEngine";
import { useGrowthState } from "@/state/growthState";
import { useFlowState } from "@/state/flowState";
import { useCatalystState } from "@/state/catalystState";
import { FlowEngine } from "@/services/FlowEngine";
import { GrowthEngine } from "@/services/growthEngine";
import { CatalystEngine } from "@/services/CatalystEngine";
import { useFirewallState } from "@/state/firewallState";
import { useSynthesisState } from "@/state/synthesisState";
import { CreativeSeedEngine } from "@/services/CreativeSeedEngine";
import { MajazEngine } from "@/services/audio/MajazEngine";
import { Shield, ShieldCheck, FileText, ImageIcon, Lightbulb, Music } from "lucide-react";
import {
    Flame,
    PowerOff,
    Terminal,
    Wind,
    Eye,
    EyeOff,
    Clock,
    TrendingUp
} from "lucide-react";

/**
 * 🌌 DREAMS MATRIX PANEL
 * Controls the visualization of the Life OS "Pre-frontal Cortex".
 * Includes the AI "Oracle" for autonomous dream analysis.
 */
export const DreamsMatrixPanel: FC = () => {
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [dreams, setDreams] = useState<Dream[]>([]);
    const [loading, setLoading] = useState(false);
    const [proposing, setProposing] = useState(false);
    const [newDream, setNewDream] = useState("");
    const { user } = useAuthState();
    const { crashProbability, forecast, recommendations, isSurvivalMode, lastCheckAt } = usePredictiveState();
    const { isOverclocking, setOverclock, heatLevel, isTripped, resetGrowth } = useGrowthState();
    const { focusScore, isCleanRoomActive, toggleCleanRoom, interactionRate, activeMicroDeadline } = useFlowState();
    const { momentumPool, arbitrageStatus, activeBridge, setArbitrageStatus, setActiveBridge } = useCatalystState();
    const { isShieldActive, setShieldActive } = useFirewallState();
    const { activeSeed, isGenerating, setGenerating, setActiveSeed, saveSeed, audioVolume, setAudioVolume } = useSynthesisState();
    const [predicting, setPredicting] = useState(false);

    // ⚡ CATALYST LIFECYCLE: Monitor shift integrity
    useEffect(() => {
        if (arbitrageStatus === 'BRIDGING') {
            CatalystEngine.checkShiftIntegrity();
        }
    }, [focusScore, arbitrageStatus]);

    // Initialize Bridge when data loads
    useEffect(() => {
        if (dreams.length > 0 && !activeBridge) {
            const bridge = CatalystEngine.identifyBridge(dreams);
            if (bridge) setActiveBridge(bridge);
        }
    }, [dreams, activeBridge]);

    // 🌊 FLOW LIFECYCLE: Start/Stop monitoring based on Overclocking
    useEffect(() => {
        if (isOverclocking) {
            FlowEngine.startMonitoring();
            // Start Neural Loop if Clean Room is active
            if (isCleanRoomActive) {
                MajazEngine.startLoop();
            }
        } else {
            FlowEngine.stopMonitoring();
            MajazEngine.stopLoop();
        }
        return () => {
            FlowEngine.stopMonitoring();
            MajazEngine.stopLoop();
        };
    }, [isOverclocking, isCleanRoomActive]);
    const [overclockingRequested, setOverclockingRequested] = useState(false);

    const handleRunPrediction = async () => {
        setPredicting(true);
        try {
            await PredictiveEngine.analyzeTrajectory();
        } finally {
            setPredicting(false);
        }
    };

    const handleToggleOverclock = async () => {
        if (!isOverclocking) {
            setOverclockingRequested(true);
            const payload = await GrowthEngine.generatePayload(dreams);
            if (payload.length > 0) {
                setOverclock(true, 1.5);

                // ⚡ SYNTHESIS ENGINE: Generate Seed for the first payload item
                const mainTarget = dreams.find(d => d.id === payload[0]) || dreams[0];
                if (mainTarget) {
                    setGenerating(true);
                    const seed = await CreativeSeedEngine.generateSeed(mainTarget.id, mainTarget.title);
                    if (seed) {
                        saveSeed(seed);
                        setActiveSeed(seed);
                    }
                    setGenerating(false);
                }
            }
            setOverclockingRequested(false);
        } else {
            setOverclock(false);
            setActiveSeed(null);
        }
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsData, dreamsData] = await Promise.all([
                fetchOverviewStats(),
                fetchDreams()
            ]);
            setStats(statsData);
            setDreams(dreamsData);
        } catch (error) {
            logger.error("Failed to load matrix stats", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleProposeDream = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDream.trim() || !user) return;

        setProposing(true);
        try {
            // 1. AI Analysis via The Oracle
            const aiInsight = await OracleService.analyzeDream(newDream);

            // 2. Persist to Supabase
            const dreamData = {
                user_id: user.id,
                title: newDream,
                alignmentScore: aiInsight.alignmentScore || 0.5,
                knots: aiInsight.knots || [],
                status: aiInsight.status || 'DREAMING',
                metadata: aiInsight.metadata,
                energy_required: 5
            };

            await saveDream(dreamData);

            // 3. Reset UI & Refresh Matrix
            setNewDream("");
            await loadData();
        } catch (err) {
            logger.error("Oracle proposal failed", err);
        } finally {
            setProposing(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, [loadData]);

    return (
        <div className="space-y-6 text-slate-200" dir="rtl">
            {/* Header / Proposal Section */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                    <div className="admin-glass-card p-4 flex items-center gap-4 border-teal-500/20">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                            <Target className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">الأهداف النشطة</p>
                            <p className="text-xl font-black">{dreams.length}</p>
                        </div>
                    </div>
                    <div className="admin-glass-card p-4 flex items-center gap-4 border-amber-500/20">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                            <Brain className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">متوسط التوافق</p>
                            <p className="text-xl font-black text-amber-400">
                                {dreams.length ? (dreams.reduce((acc, d) => acc + (d.alignmentScore || 0), 0) / dreams.length * 100).toFixed(0) : 0}%
                            </p>
                        </div>
                    </div>
                    <div className="admin-glass-card p-4 flex items-center gap-4 border-rose-500/20">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">العُقد الحرجة</p>
                            <p className="text-xl font-black text-rose-400">
                                {dreams.reduce((acc, d) => acc + (d.knots?.filter((k: any) => (k.severity || k.weight) > 7).length || 0), 0)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Proposal Input */}
                <div className="md:w-96">
                    <form onSubmit={handleProposeDream} className="admin-glass-card p-4 border-slate-700/40 relative overflow-hidden h-full flex flex-col justify-center">
                        <p className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-teal-400" />
                            مقترح حلم جديد (The Oracle)
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newDream}
                                onChange={(e) => setNewDream(e.target.value)}
                                placeholder="إيه هدفك الجاي؟ (مثلاً: إطلاق منصة الرحلة)"
                                className="flex-1 bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500/50"
                                disabled={proposing}
                            />
                            <button
                                type="submit"
                                disabled={proposing || !newDream.trim()}
                                className="bg-teal-500 hover:bg-teal-400 disabled:bg-slate-700 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2"
                            >
                                {proposing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'تحليل'}
                            </button>
                        </div>
                        {proposing && (
                            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center">
                                <span className="text-[10px] font-bold text-teal-400 animate-pulse uppercase tracking-widest">Consulting Oracle...</span>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* Survival Mode Warning Banner */}
            {isSurvivalMode && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mb-6 overflow-hidden px-2"
                >
                    <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center animate-pulse">
                                <AlertCircle className="w-6 h-6 text-rose-500" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-rose-500 uppercase tracking-widest">تحذير: Survival Mode مفعل</h4>
                                <p className="text-xs text-rose-300">السيستم في حالة طوارئ لحماية طاقتك. تم تقليل الأهداف المعقدة وتفعيل تحويل الموارد.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => usePredictiveState.getState().toggleSurvivalMode(false)}
                            className="px-4 py-2 bg-rose-500 text-slate-900 text-[10px] font-black rounded-lg hover:bg-rose-400 transition-all uppercase"
                        >
                            إغلاق يدوي
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Consciousness Radar Card */}
            <div className="mx-2 admin-glass-card p-6 border-indigo-500/30 bg-indigo-500/5 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-black text-indigo-400 flex items-center gap-2">
                            <Radio className={`w-5 h-5 ${predicting ? 'animate-ping' : ''}`} />
                            رادار الوعي (Consciousness Radar)
                        </h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-tighter mt-1">
                            آخر مسح استباقي: {new Date(lastCheckAt).toLocaleTimeString()}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleToggleOverclock}
                            disabled={overclockingRequested}
                            className={`p-2 px-4 rounded-xl border flex items-center gap-2 transition-all ${isOverclocking
                                ? 'bg-orange-500/20 border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)] animate-pulse'
                                : 'bg-slate-800/20 border-slate-700/30 text-slate-400 hover:bg-orange-500/10 hover:border-orange-500/30'
                                }`}
                        >
                            {overclockingRequested ? <Loader2 className="w-3 h-3 animate-spin" /> : <Flame className={`w-3.5 h-3.5 ${isOverclocking ? 'fill-orange-400 text-orange-400' : ''}`} />}
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                {isOverclocking ? 'Overclocking Active' : 'Start Overclock'}
                            </span>
                        </button>

                        {isOverclocking && (
                            <button
                                onClick={() => toggleCleanRoom(!isCleanRoomActive)}
                                className={`p-2 px-4 rounded-xl border flex items-center gap-2 transition-all ${isCleanRoomActive
                                    ? 'bg-teal-500/20 border-teal-500/50 text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.2)]'
                                    : 'bg-slate-800/20 border-slate-700/30 text-slate-400 hover:bg-teal-500/10'
                                    }`}
                                title="The Clean Room: عزل تام للمشتتات"
                            >
                                {isCleanRoomActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                    {isCleanRoomActive ? 'Clean Room On' : 'Clean Room Off'}
                                </span>
                            </button>
                        )}

                        <button
                            onClick={() => setShieldActive(!isShieldActive)}
                            className={`p-2 px-4 rounded-xl border flex items-center gap-2 transition-all ${isShieldActive
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(20,184,166,0.2)]'
                                : 'bg-slate-800/20 border-slate-700/30 text-slate-400 hover:bg-emerald-500/10'
                                }`}
                            title="Social Shield: حماية من مشتتات الطاقة"
                        >
                            {isShieldActive ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                {isShieldActive ? 'Shield On' : 'Shield Off'}
                            </span>
                        </button>

                        <button
                            onClick={handleRunPrediction}
                            disabled={predicting}
                            className="p-2 px-4 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-[10px] font-bold text-indigo-400 hover:bg-indigo-500/40 transition-all flex items-center gap-2"
                        >
                            {predicting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Radio className="w-3 h-3" />}
                            مسح الترددات
                        </button>
                    </div>
                </div>

                {/* Synthesis Control / Audio Hub (New) */}
                <AnimatePresence>
                    {isOverclocking && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-6 overflow-hidden"
                        >
                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                        <Music className={`w-5 h-5 text-indigo-400 ${isCleanRoomActive ? 'animate-pulse' : ''}`} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">حلقة مجاز العصبية (Neural Loop)</p>
                                        <p className="text-xs text-slate-400">تعديل الترددات بناءً على سرعة تفاعلك: {(interactionRate * 2).toFixed(0)}%</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={audioVolume}
                                        onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                                        className="w-24 accent-indigo-500"
                                    />
                                    <span className="text-[10px] font-mono text-indigo-300 w-8">{Math.round(audioVolume * 100)}%</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Probabilty Gauge */}
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-900/40 rounded-3xl border border-slate-800/50">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90">
                                <circle cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
                                <circle cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={364.4} strokeDashoffset={364.4 * (1 - crashProbability)} className={`${crashProbability > 0.7 ? 'text-rose-500' : 'text-indigo-500'} transition-all duration-1000`} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-2xl font-black ${crashProbability > 0.7 ? 'text-rose-400' : 'text-white'}`}>{(crashProbability * 100).toFixed(0)}%</span>
                                <span className="text-[8px] text-slate-500 uppercase font-bold">Radiation</span>
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase">احتمالية الانهيار (48h)</p>
                    </div>

                    {/* Flow Controller Stats */}
                    <div className="flex flex-col gap-4">
                        <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/50 flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${focusScore > 0.8 ? 'bg-teal-500/10 text-teal-400' : 'bg-orange-500/10 text-orange-400'}`}>
                                <Wind className={`w-5 h-5 ${focusScore > 0.8 ? 'animate-bounce' : ''}`} />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold text-right">Flow Score</p>
                                <p className={`text-lg font-black text-right ${(focusScore < 0.7 && isOverclocking) ? 'text-orange-400' : 'text-white'}`}>
                                    {(focusScore * 100).toFixed(0)}%
                                </p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/50 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-800/50 text-slate-400 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold text-right">Interaction Rate</p>
                                <p className="text-lg font-black text-white text-right">{interactionRate} <span className="text-[8px] text-slate-500 font-normal text-right">e/m</span></p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/50 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">Momentum Pool</p>
                                <Zap className={`w-3 h-3 ${momentumPool > 70 ? 'text-teal-400 animate-pulse' : 'text-slate-600'}`} />
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${momentumPool}%` }}
                                    className={`h-full transition-all duration-500 ${momentumPool > 70 ? 'bg-teal-400' : 'bg-indigo-500'}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Active Micro-deadline or Focus Tip */}
                    <div className="flex flex-col justify-center">
                        <AnimatePresence mode="wait">
                            {activeMicroDeadline ? (
                                <motion.div
                                    key="deadline"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl flex items-center gap-4"
                                >
                                    <div className="w-10 h-10 rounded-full bg-orange-500 text-slate-950 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                                        <Clock className="w-5 h-5 animate-pulse" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest leading-none mb-1">مهمة انقاذ التدفق</p>
                                        <p className="text-sm font-bold text-white leading-tight">{activeMicroDeadline.target}</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="tip"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-right px-4 border-r border-slate-800"
                                >
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Flow Status</p>
                                    <p className="text-xs text-slate-400 italic">
                                        {focusScore > 0.9 ? '"أنت حالياً في حالة تركيز مثالية.. استمر."' : '"يوجد تشتيت بسيط.. حاول العودة للمسار."'}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Forecast Summary */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="p-4 bg-slate-900/60 rounded-2xl border-r-4 border-indigo-500">
                            <h4 className="text-[10px] text-indigo-400 font-bold uppercase mb-2">النشرة الجوية للوعي:</h4>
                            <p className="text-sm text-slate-200 leading-relaxed italic">"{forecast}"</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {recommendations.slice(0, 3).map((rec, i) => (
                                <div key={i} className="p-3 bg-slate-900/30 rounded-xl border border-slate-800 flex flex-col justify-between">
                                    <p className="text-xs text-slate-300 mb-2 leading-tight">{rec}</p>
                                    <div className="flex justify-end">
                                        <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                            <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* The Matrix Canvas */}
            <div className="admin-glass-card p-0 min-h-[500px] relative overflow-hidden group">
                {(loading && !proposing) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                    </div>
                )}

                {/* Forced Recovery Overlay (Safety Trigger) */}
                {(isOverclocking || isTripped) && crashProbability > 0.85 && (
                    <div className="absolute inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center border-4 border-rose-500/50 rounded-2xl">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="w-24 h-24 rounded-full bg-rose-500/20 flex items-center justify-center mb-6"
                        >
                            <PowerOff className="w-12 h-12 text-rose-500" />
                        </motion.div>
                        <h2 className="text-3xl font-black text-rose-500 uppercase tracking-tighter mb-4">CRITICAL SYSTEM FAILURE IMMINENT</h2>
                        <p className="text-lg text-slate-200 mb-8 max-w-md">الرادار رصد تجاوز مستويات الطاقة المسموح بها. تم فصل الـ Payload وتفعيل خطة الطوارئ فوراً.</p>
                        <div className="flex flex-col gap-4 items-center">
                            <div className="flex gap-4">
                                <div className="px-6 py-2 bg-rose-500 rounded-lg text-slate-900 font-bold uppercase text-xs font-black">Shutdown Active</div>
                                <div className="px-6 py-2 border border-rose-500/30 rounded-lg text-rose-400 font-bold uppercase text-xs font-black">Radiation: {(crashProbability * 100).toFixed(0)}%</div>
                            </div>

                            {isTripped && (
                                <button
                                    onClick={resetGrowth}
                                    className="px-8 py-3 bg-white text-slate-900 rounded-xl font-black uppercase text-sm hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                >
                                    إعادة ضبط النظام (Reset System)
                                </button>
                            )}
                        </div>
                        <div className="mt-12 flex items-center gap-2 text-slate-500 font-mono text-[10px]">
                            <Terminal className="w-3 h-3" />
                            <span>[SYSTEM] Forced recovery protocol initiated...</span>
                        </div>
                    </div>
                )}

                {/* Sensory Hijack (Global Blur based on focusScore) */}
                {isOverclocking && focusScore < 0.9 && (
                    <div
                        className="absolute inset-0 z-[60] pointer-events-none transition-all duration-700"
                        style={{ backdropFilter: `blur(${(1 - focusScore) * 20}px)` }}
                    />
                )}

                {/* Catalyst Hot-Swap Bridge Overlay */}
                <AnimatePresence>
                    {arbitrageStatus === 'BRIDGING' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[110] bg-teal-500/10 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
                        >
                            <motion.div
                                animate={{
                                    scale: [1, 2, 1],
                                    rotate: [0, 180, 360]
                                }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                className="w-20 h-20 rounded-full bg-teal-500 text-slate-900 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(20,184,166,0.6)]"
                            >
                                <Zap className="w-10 h-10 fill-current" />
                            </motion.div>
                            <h2 className="text-4xl font-black text-teal-400 uppercase tracking-tighter mb-2 italic">MOMENTUM BRIDGE ACTIVE</h2>
                            <p className="text-teal-200/70 font-bold uppercase text-[10px] tracking-widest animate-pulse">
                                [CATALYST] TRAPPING DOPAMINE... PREPARING HOT-SWAP
                            </p>

                            <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                                <motion.div
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1.5 }}
                                    className="h-full bg-teal-400"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {stats && <DreamsMatrix dreams={dreams} stats={stats} />}

                {/* Creative Seed Overlay (Synthesis Engine) */}
                <AnimatePresence>
                    {(isGenerating || activeSeed) && (
                        <motion.div
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 100 }}
                            className="absolute top-4 right-4 z-[90] w-80 space-y-4"
                        >
                            <div className="admin-glass-card p-5 border-teal-500/30 bg-slate-950/80 backdrop-blur-xl shadow-2xl rounded-3xl">
                                <div className="flex justify-between items-center mb-4">
                                    <h5 className="text-sm font-black text-teal-400 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        بذرة التخليق (Creative Seed)
                                    </h5>
                                    {activeSeed && (
                                        <button onClick={() => setActiveSeed(null)} className="text-slate-500 hover:text-white">
                                            <PowerOff className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>

                                {isGenerating ? (
                                    <div className="py-8 flex flex-col items-center gap-4">
                                        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase animate-pulse">Consulting the Oracle for drafts...</p>
                                    </div>
                                ) : activeSeed && (
                                    <div className="space-y-4">
                                        <div className="p-3 bg-teal-500/5 border border-teal-500/10 rounded-xl">
                                            <p className="text-[10px] font-bold text-teal-500/60 uppercase mb-2 flex items-center gap-1">
                                                <FileText className="w-3 h-3" /> الـ Script
                                            </p>
                                            <p className="text-xs text-slate-200 leading-relaxed max-h-32 overflow-y-auto thin-scrollbar">
                                                {activeSeed.drafts.find(d => d.type === 'script')?.content}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                                            <p className="text-[10px] font-bold text-indigo-500/60 uppercase mb-2 flex items-center gap-1">
                                                <ImageIcon className="w-3 h-3" /> الـ Visual Hook
                                            </p>
                                            <p className="text-xs text-slate-300 italic">
                                                {activeSeed.drafts.find(d => d.type === 'visual')?.content}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                                            <p className="text-[10px] font-bold text-amber-500/60 uppercase mb-2 flex items-center gap-1">
                                                <Lightbulb className="w-3 h-3" /> الـ Concept
                                            </p>
                                            <p className="text-[11px] text-slate-400">
                                                {activeSeed.drafts.find(d => d.type === 'concept')?.content}
                                            </p>
                                        </div>
                                        <button
                                            className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 text-[10px] font-black rounded-lg transition-all uppercase"
                                            onClick={() => setActiveSeed(null)}
                                        >
                                            تأكيد ومتابعة (Refine)
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Momentum Hub and RCA Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Momentum Hub */}
                <div className="admin-glass-card p-5 border-teal-500/30 bg-teal-500/5">
                    <h3 className="text-sm font-bold text-teal-400 mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        مُولد الزخم (Momentum Hub)
                    </h3>
                    <div className="space-y-3">
                        {dreams.filter(d => d.momentumTasks && d.momentumTasks.length > 0).length > 0 ? (
                            dreams.filter(d => d.momentumTasks && d.momentumTasks.length > 0).flatMap(d => (d.momentumTasks || []).map(task => ({ ...task, dreamTitle: d.title, dreamId: d.id }))).map(task => (
                                <div key={task.id} className="p-3 bg-slate-900/60 rounded-xl border border-teal-500/10 flex justify-between items-center group hover:border-teal-500/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => {
                                                // ⚡ Trigger Catalyst Logic
                                                if (!task.isCompleted) {
                                                    CatalystEngine.onTaskCompleted(task.dopamineWeight);
                                                }

                                                const updatedDreams = dreams.map(d => {
                                                    if (d.id === task.dreamId) {
                                                        return {
                                                            ...d,
                                                            momentumTasks: d.momentumTasks?.map(t => t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t)
                                                        };
                                                    }
                                                    return d;
                                                });
                                                setDreams(updatedDreams);
                                            }}
                                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${task.isCompleted ? 'bg-teal-500 border-teal-500' : 'border-slate-700 hover:border-teal-500'}`}
                                        >
                                            {task.isCompleted && <Zap className="w-3 h-3 text-slate-900" />}
                                        </button>
                                        <div>
                                            <p className={`text-xs font-bold transition-all ${task.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                                {task.label}
                                            </p>
                                            <p className="text-[9px] text-slate-500">{task.dreamTitle}</p>
                                        </div>
                                    </div>
                                    <div className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-[8px] text-teal-400 font-black">
                                        +{task.dopamineWeight} DP
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-slate-500 italic">لا توجد مهام زخم نشطة. ابدأ باقتراح حلم في وقت الأزمة.</p>
                        )}
                    </div>
                </div>

                {/* RCA Diagnostic Section */}
                <div className="admin-glass-card p-5 border-amber-500/20">
                    <h3 className="text-sm font-bold text-amber-400 mb-4 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" />
                        تشخيص ثقوب الطاقة (Root Cause Analysis)
                    </h3>
                    <div className="space-y-3">
                        {dreams.filter(d => d.relatedNodeIds && d.relatedNodeIds.length > 0).length > 0 ? (
                            dreams.filter(d => d.relatedNodeIds && d.relatedNodeIds.length > 0).map(dream => (
                                <div key={dream.id} className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/50 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-bold text-slate-200">{dream.title}</p>
                                        <div className="flex gap-1 mt-1">
                                            {dream.relatedNodeIds?.map((nodeId: string) => {
                                                const node = useMapState.getState().nodes.find((n: MapNode) => n.id === nodeId);
                                                return (
                                                    <span key={nodeId} className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 flex items-center gap-1">
                                                        <Activity className="w-2.5 h-2.5" />
                                                        {node?.label || 'مجهول'}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-slate-500 block">تأثير الفركشن</span>
                                        <span className="text-xs font-black text-rose-500">
                                            -{((1 - dream.alignmentScore) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-slate-500 italic">لا توجد ثقوب طاقة علائقية مكتشفة حالياً. المدارات مستقرة.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Oracle Insights Card */}
            <div className="admin-glass-card p-5 border-indigo-500/20 mb-6">
                <h3 className="text-sm font-bold text-indigo-400 mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    توصيات الأوراكل (Oracle Insights)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dreams.slice(0, 6).map(dream => (
                        <div key={dream.id} className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/50 hover:bg-indigo-500/5 transition-all group">
                            <p className="text-[10px] text-slate-500 gap-2 uppercase tracking-tighter mb-2 font-bold flex items-center">
                                <Target className="w-3 h-3 text-indigo-500" />
                                {dream.title}
                            </p>
                            <p className="text-xs text-slate-300 leading-relaxed italic border-r-2 border-indigo-500/30 pr-3">
                                "{dream.metadata?.oracleInsight || 'الأوراكل لم يصدر رأيه بعد..'}"
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-between items-center px-2">
                <p className="text-xs text-slate-500">
                    * يتم تحليل التوافق آلياً بواسطة Oracle بناءً على هندسة الوعي.
                </p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span className="text-xs text-slate-400">الواحة (Action)</span>
                    <span className="w-2 h-2 rounded-full bg-amber-500 ml-2" />
                    <span className="text-xs text-slate-400">الأفق (Plan)</span>
                    <span className="w-2 h-2 rounded-full bg-slate-500 ml-2" />
                    <span className="text-xs text-slate-400">السديم (Dream)</span>
                </div>
            </div>
        </div>
    );
};
