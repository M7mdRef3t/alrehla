import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Battery, CheckCircle2, CircleDashed, Clock, Zap, Award, Sparkles, ChevronRight, Share2, ShieldAlert } from 'lucide-react';
import { useTrajectoryRealtime } from '../../hooks/useTrajectoryRealtime';
import { AwarenessHeatmap } from './AwarenessHeatmap';
import { CollectiveRadar } from './CollectiveRadar';
import { HiveEngine, SwarmMetrics } from '../../services/hiveEngine';
import { AwarenessVector } from '../../services/trajectoryEngine';

interface TrajectoryDashboardProps {
    userId?: string;
}

type SovereigntyRank = 'Aspirant' | 'Initiate' | 'Sovereign' | 'Oracle';

const getRank = (score: number): SovereigntyRank => {
    if (score >= 801) return 'Oracle';
    if (score >= 501) return 'Sovereign';
    if (score >= 201) return 'Initiate';
    return 'Aspirant';
};

const SwarmStatusBadge: any = () => null;

export const TrajectoryDashboard: React.FC<TrajectoryDashboardProps> = ({ userId }) => {
    const { activeTrajectory, completedTrajectory, loading } = useTrajectoryRealtime(userId);
    const [swarmMetrics, setSwarmMetrics] = React.useState<SwarmMetrics | null>(null);

    const externalTension = (swarmMetrics as any)?.metadata?.external_tension ?? 0.2;

    React.useEffect(() => {
        const fetchHive = async () => {
            const metrics = await HiveEngine.getSwarmMetrics();
            if (metrics) setSwarmMetrics(metrics);
            else {
                // Mock metrics for prototype visualization
                setSwarmMetrics({
                    active_sovereigns: 124,
                    swarm_momentum: 1.45,
                    mean_vector: { rs: 0.4, av: 0.5, bi: 0.6, se: 0.3, cb: 0.7, timestamp: Date.now() },
                    outlier_vector: { rs: 0.8, av: 0.9, bi: 0.95, se: 0.1, cb: 0.9, timestamp: Date.now() },
                    // @ts-ignore
                    metadata: {
                        external_tension: 0.62,
                        last_signal_label: 'Rising Global Volatility'
                    }
                });
            }
        };
        fetchHive();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 space-x-3 text-cyan-400">
                <CircleDashed className="animate-spin" />
                <span className="text-lg font-medium tracking-wider">Syncing Reality...</span>
            </div>
        );
    }

    if (!activeTrajectory && !completedTrajectory) {
        return (
            <div className="p-8 text-center bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-xl">
                <Activity className="mx-auto mb-4 w-12 h-12 text-slate-600" />
                <h3 className="text-xl font-bold text-slate-300">No Active Trajectory</h3>
                <p className="mt-2 text-slate-500">Engage with Dawayir or Chat to generate your awareness path.</p>
            </div>
        );
    }

    // --- Celebration View for Completed Trajectory ---
    if (completedTrajectory && !activeTrajectory) {
        const report = completedTrajectory.sovereignty_report;
        return (
            <div className="p-8 max-w-4xl mx-auto space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative p-12 overflow-hidden bg-gradient-to-br from-[var(--color-primary)] to-slate-950 rounded-[3rem] border border-[var(--color-primary)] text-center shadow-3xl backdrop-blur-3xl"
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

                    <Award className="w-20 h-20 mx-auto mb-6 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />

                    <h2 className="text-4xl font-black text-white mb-2 leading-tight">
                        {report?.report_title || "تقرير السيادة"}
                    </h2>
                    <p className="text-cyan-400 font-bold tracking-widest uppercase mb-8 text-xs">
                        {completedTrajectory.title} | Completed
                    </p>

                    <div className="p-8 bg-slate-900/50 rounded-3xl border border-white/5 mb-8">
                        <p className="text-2xl font-serif italic text-slate-200 leading-relaxed">
                            "{report?.narrative || "أنت الآن تملك زمام وعيك بشكل أعمق."}"
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        <AwarenessHeatmap
                            initial={completedTrajectory.initial_vector}
                            current={completedTrajectory.final_vector || { rs: 0.5, av: 0.7, bi: 0.9, se: 0.2 }}
                            title="Transformation Analysis"
                        />
                        <div className="p-6 bg-slate-950/40 rounded-3xl border border-white/5 flex flex-col justify-center">
                            <div className="flex justify-between items-start mb-4">
                                <h5 className="flex items-center text-amber-400 text-xs font-black uppercase tracking-widest">
                                    <Award className="w-4 h-4 mr-2" />
                                    Sovereignty Score
                                </h5>
                                <div className="flex flex-col items-end">
                                    <span className="text-2xl font-black text-white">{completedTrajectory.sovereignty_score || 0}</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${getRank(completedTrajectory.sovereignty_score || 0) === 'Oracle' ? 'bg-amber-400/10 border-amber-400 text-amber-400' :
                                        getRank(completedTrajectory.sovereignty_score || 0) === 'Sovereign' ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]' :
                                            getRank(completedTrajectory.sovereignty_score || 0) === 'Initiate' ? 'bg-cyan-400/10 border-cyan-400 text-cyan-400' :
                                                'bg-slate-400/10 border-slate-400 text-slate-400'
                                        }`}>
                                        {getRank(completedTrajectory.sovereignty_score || 0)}
                                    </span>
                                </div>
                            </div>

                            <div className="mb-6">
                                <p className="text-lg font-bold text-white mb-2">
                                    Focus: {report?.next_journey_seed?.focus?.toUpperCase() || "Evolution"}
                                </p>
                                <p className="text-sm text-slate-400 leading-relaxed italic">
                                    {report?.next_journey_seed?.reasoning || "The system is calculating your next bottleneck..."}
                                </p>
                            </div>

                            {/* UNLOCKABLE MODULE: Sovereignty Lab */}
                            {getRank(completedTrajectory.sovereignty_score || 0) !== 'Aspirant' ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 mb-4"
                                >
                                    <h6 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">
                                        Unlocked: Sovereignty Lab
                                    </h6>
                                    <p className="text-xs text-slate-300">You can now customize your next Reality Hack.</p>
                                </motion.div>
                            ) : (
                                <div className="p-4 bg-slate-800/20 rounded-2xl border border-white/5 mb-4 grayscale opacity-50">
                                    <h6 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center">
                                        <Clock className="w-3 h-3 mr-1" /> Locked: Sovereignty Lab
                                    </h6>
                                    <p className="text-xs text-slate-600">Reach 'Initiate' rank to unlock.</p>
                                </div>
                            )}

                            <button className="mt-2 flex items-center justify-center space-x-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-black text-xs uppercase transition-all">
                                <span>Initialize Next Path</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    const { data: mission, cognitive_bandwidth: cb } = activeTrajectory!;

    return (
        <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-12">
            {/* --- Left Column: Context & Stats --- */}
            <div className="space-y-6 lg:col-span-4">
                {/* Swarm Status Badge (Top of Left Column) */}
                {swarmMetrics && (
                    <SwarmStatusBadge
                        tension={externalTension}
                        momentum={swarmMetrics.swarm_momentum}
                        label={(swarmMetrics as any).metadata?.last_signal_label}
                        isInsulated={activeTrajectory?.data?.is_insulated}
                    />
                )}

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`relative p-6 rounded-3xl border shadow-2xl backdrop-blur-2xl transition-all duration-700 ${activeTrajectory?.data?.is_insulated
                        ? 'bg-gradient-to-br from-amber-900/40 via-[var(--color-primary)] to-slate-900 border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.2)]'
                        : 'bg-gradient-to-br from-[var(--color-primary)] to-slate-900 border-[var(--color-primary)]'
                        }`}
                >
                    {/* Aegis Aura Glow */}
                    {activeTrajectory?.data?.is_insulated && (
                        <motion.div
                            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute inset-0 rounded-3xl bg-amber-500/10 pointer-events-none"
                        />
                    )}

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className={`text-2xl font-black text-transparent bg-clip-text ${activeTrajectory?.data?.is_insulated
                                ? 'bg-gradient-to-r from-amber-400 to-amber-200'
                                : 'bg-gradient-to-r from-cyan-400 to-[var(--color-primary)]'
                                }`}>
                                {activeTrajectory?.data?.is_insulated ? 'Insulated Path' : 'Current Path'}
                            </h2>
                            <div className="flex items-center gap-2">
                                {activeTrajectory?.data?.is_insulated && (
                                    <div className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 rounded-full border border-amber-500/30">
                                        <ShieldAlert className="w-3 h-3 text-amber-500" />
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Aegis Active</span>
                                    </div>
                                )}
                                <span className="px-3 py-1 text-xs font-bold tracking-widest text-cyan-400 uppercase bg-cyan-400/10 rounded-full border border-cyan-400/20">
                                    {activeTrajectory!.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <h3 className="mb-6 text-2xl font-bold text-white leading-tight">
                        {mission.trajectory_title}
                    </h3>

                    {/* Awareness Heatmap Visual */}
                    <AwarenessHeatmap initial={activeTrajectory!.initial_vector} current={{ rs: 0.1, av: 0.1, bi: 0.1, se: 0.1 }} />

                    {/* Cognitive Bandwidth Meter */}
                    <div className="mt-6 p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center space-x-2 text-slate-400">
                                <Battery className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-tighter">Cognitive Bandwidth</span>
                            </div>
                            <span className="text-lg font-black text-cyan-400">{Math.round(cb * 100)}%</span>
                        </div>
                        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${cb * 100}%` }}
                                className="h-full bg-gradient-to-r from-[var(--color-primary)] via-cyan-400 to-emerald-400"
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                        </div>
                        <p className="mt-3 text-[10px] text-slate-500 leading-relaxed uppercase tracking-widest text-center">
                            DDA Level Applied Persistence Active
                        </p>
                    </div>
                </motion.div>

                {/* Integration Status */}
                <div className="p-6 bg-slate-900/60 rounded-3xl border border-white/5 backdrop-blur-md">
                    <h4 className="flex items-center mb-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <Zap className="mr-2 w-3 h-3 text-amber-400" />
                        Verification Logic
                    </h4>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-white/5 rounded-2xl border border-white/10 text-cyan-400 font-extrabold text-xs">
                            STEALTH
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-300">
                                Dual-Sensing Active
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium">
                                Monitoring behavioral integrity shifts
                            </p>
                        </div>
                    </div>
                </div>

                {/* COLLECTIVE RADAR: Swarm Resonance */}
                {swarmMetrics && activeTrajectory && (
                    <CollectiveRadar
                        userVector={activeTrajectory.initial_vector}
                        swarmMetrics={swarmMetrics}

                    />
                )}
            </div>

            {/* --- Right Column: Mission Cards --- */}
            <div className="space-y-4 lg:col-span-8">
                <AnimatePresence mode="popLayout">
                    {mission.daily_missions.map((m: any, idx: number) => {
                        const isCurrentDay = m.day === (activeTrajectory?.data?.current_day || 1);
                        const isCompleted = m.day < (activeTrajectory?.data?.current_day || 1);

                        return (
                            <motion.div
                                key={m.day}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                whileHover={{ scale: 1.01, x: 5 }}
                                className={`group relative overflow-hidden p-6 bg-slate-900/40 rounded-3xl border ${isCurrentDay ? 'border-[var(--color-primary)] ring-1 ring-indigo-500/20 shadow-[var(--color-primary-glow)]' : 'border-white/5'
                                    } backdrop-blur-xl transition-all duration-300 shadow-2xl ${isCompleted ? 'opacity-50' : ''}`}
                            >
                                {/* Decorative Background Glow for Active Mission */}
                                {isCurrentDay && (
                                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--color-primary)]/20 blur-[80px] rounded-full" />
                                )}

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center space-x-6">
                                        <div className={`flex items-center justify-center w-14 h-14 bg-slate-950 rounded-2xl border border-white/5 text-2xl font-black transition-colors ${isCompleted ? 'text-emerald-400 border-emerald-500/30' : 'text-slate-400'}`}>
                                            {isCompleted ? <CheckCircle2 className="w-8 h-8" /> : m.day}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest">Day Task</span>
                                                {isCurrentDay && <span className="text-[10px] font-bold text-emerald-400 animate-pulse uppercase tracking-widest">● Active Now</span>}
                                                {isCompleted && <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Verified</span>}
                                            </div>
                                            <p className="text-lg font-bold text-slate-100 leading-tight">
                                                {m.actionable_task}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end md:space-x-8 px-4 py-3 md:p-0 bg-white/5 md:bg-transparent rounded-2xl">
                                        <div className="flex items-center text-slate-500 font-bold">
                                            <Clock className="mr-2 w-4 h-4 text-cyan-400/60" />
                                            <span className="text-xs">{m.estimated_minutes}M</span>
                                        </div>
                                        {isCurrentDay ? (
                                            <button className="flex items-center space-x-2 px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary)] text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-[var(--color-primary-glow)] active:scale-95">
                                                <span>Execute</span>
                                                <Zap className="w-3 h-3 fill-current" />
                                            </button>
                                        ) : isCompleted ? (
                                            <div className="text-emerald-400">
                                                <CheckCircle2 className="w-6 h-6" />
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-slate-600">
                                                <CircleDashed className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Behavioral Integrity Footer */}
                <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center space-x-4 text-slate-500">
                        <Activity className="w-5 h-5 text-[var(--color-primary)]" />
                        <span className="text-xs font-bold leading-none tracking-tight">Mission status depends on organic behavioral detection.</span>
                    </div>
                    <div className="px-4 py-2 bg-[var(--color-primary)]/10 rounded-xl border border-[var(--color-primary)] text-[10px] font-black text-[var(--color-primary)] uppercase tracking-[0.2em]">
                        Behavioral Integrity (BI) Mode: Enabled
                    </div>
                </div>
            </div>
        </div>
    );
};



