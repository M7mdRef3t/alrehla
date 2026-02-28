import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Crown, Shield, TrendingUp, Users, Zap, Clock } from 'lucide-react';

import { PhoenixEngine, PhoenixEventSummary, PioneerReportCard } from '../../services/phoenixEngine';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { ResonancePair } from '../../services/phoenixEngine';

export const PhoenixReport: React.FC = () => {
    const [summary, setSummary] = useState<PhoenixEventSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            const data = await PhoenixEngine.analyzeImpact();
            setSummary(data);
            setLoading(false);
        };
        fetchReport();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-black">
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-amber-400 text-2xl font-black tracking-widest"
            >
                🔥 PHOENIX ENGINE INITIALIZING...
            </motion.div>
        </div>
    );

    if (!summary) return (
        <div className="p-12 text-center text-slate-500 bg-black min-h-screen font-mono">
            No event data available for analysis.
        </div>
    );

    const vectorShiftData = [
        { axis: 'SE', before: (summary.swarm_vector_shift.before.se || 0) * 100, after: (summary.swarm_vector_shift.after.se || 0) * 100 },
        { axis: 'BI', before: (summary.swarm_vector_shift.before.bi || 0) * 100, after: (summary.swarm_vector_shift.after.bi || 0) * 100 },
        { axis: 'AV', before: (summary.swarm_vector_shift.before.av || 0) * 100, after: (summary.swarm_vector_shift.after.av || 0) * 100 },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 bg-black min-h-screen text-slate-100 font-mono">
            {/* Header: Phoenix Rising */}
            <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 via-black to-rose-950/20 p-8">
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-rose-500/5"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                />
                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Flame className="w-8 h-8 text-amber-400" />
                            <h1 className="text-3xl font-black tracking-tighter">PHOENIX REPORT</h1>
                        </div>
                        <p className="text-[10px] text-amber-400/60 font-bold uppercase tracking-[0.3em]">
                            Post-Impact Analysis: {summary.event_name}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="text-4xl font-black text-amber-400">
                            {summary.mean_phoenix_score.toFixed(3)}
                        </span>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">
                            Mean Phoenix Score
                        </span>
                    </div>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                    icon={<Users className="w-5 h-5 text-cyan-400" />}
                    label="Total Pioneers"
                    value={summary.total_pioneers.toString()}
                />
                <MetricCard
                    icon={<Shield className="w-5 h-5 text-amber-400" />}
                    label="Insulated"
                    value={`${summary.insulated_count}/${summary.total_pioneers}`}
                />
                <MetricCard
                    icon={<Crown className="w-5 h-5 text-yellow-400" />}
                    label="Aegis Prime"
                    value={summary.aegis_prime?.email || 'NONE'}
                />
                <MetricCard
                    icon={<Zap className="w-5 h-5 text-emerald-400" />}
                    label="DDA Adjustments"
                    value={summary.dda_recommendations.filter(r => r.current_dda !== r.recommended_dda).length.toString()}
                />
            </div>

            {/* Swarm Dynamics: Blast Radius & Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Swarm Pressure Curve (LineChart) */}
                <div className="p-8 bg-slate-900/40 rounded-[2rem] border border-white/5 relative overflow-hidden">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-rose-400" /> Swarm Pressure Curve (The Blast Radius)
                    </h3>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={summary.impact_timeline}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis
                                    dataKey="timestamp"
                                    hide
                                />
                                <YAxis
                                    stroke="#444"
                                    fontSize={10}
                                    domain={[0, 1]}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '10px' }}
                                    labelStyle={{ display: 'none' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="avg_se"
                                    stroke="#fb7185"
                                    strokeWidth={3}
                                    dot={false}
                                    animationDuration={2000}
                                />
                                {/* The Blast Radius Reference Line */}
                                {summary.aegis_prime && (
                                    <ReferenceLine
                                        x={summary.impact_timeline[Math.floor(summary.impact_timeline.length * 0.4)]?.timestamp}
                                        stroke="#f59e0b"
                                        strokeDasharray="5 5"
                                        label={{ position: 'top', value: 'AEGIS PRIME IMPACT', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }}
                                    />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Swarm Vector Shift Radar */}
                <div className="p-8 bg-slate-900/40 rounded-[2rem] border border-white/5">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Swarm Vector Shift (Before → After)
                    </h3>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={vectorShiftData}>
                                <PolarGrid stroke="#333" />
                                <PolarAngleAxis dataKey="axis" stroke="#666" fontSize={11} />
                                <PolarRadiusAxis stroke="#333" fontSize={9} />
                                <Radar name="Before" dataKey="before" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                                <Radar name="After" dataKey="after" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={2} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Synchronicity Pairing: The Magnetic Tether */}
            <div className="p-10 bg-slate-950/40 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Zap className="w-32 h-32 text-amber-500" />
                </div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-10 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" /> Synchronicity Pairing (The Magnetic Tether)
                </h3>

                {summary.entanglement_links.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {summary.entanglement_links.slice(0, 2).map((pair, _idx) => (
                            <MagneticTether key={pair.id} pair={pair} />
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center text-slate-600 text-sm border border-dashed border-white/10 rounded-2xl font-mono italic">
                        No entanglements detected in this resonance cycle.
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Performers + Struggling */}
                <div className="space-y-4">
                    <div className="p-6 bg-emerald-950/20 rounded-2xl border border-emerald-500/10">
                        <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> Top Performers
                        </h3>
                        {summary.top_performers.map((p, i) => (
                            <PioneerRow key={p.user_id} pioneer={p} rank={i + 1} variant="success" />
                        ))}
                    </div>
                </div>

                {/* DDA Recalibration Table */}
                <div className="p-6 bg-slate-950/80 rounded-3xl border border-white/5 h-fit">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Adaptive DDA Recalibration Queue
                    </h4>
                    <div className="space-y-2">
                        {summary.dda_recommendations
                            .filter(r => r.current_dda !== r.recommended_dda)
                            .slice(0, 5)
                            .map(rec => (
                                <div key={rec.user_id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-xs font-mono text-slate-400">{rec.user_id.slice(0, 8)}...</span>
                                    <span className="text-xs font-bold">
                                        DDA {rec.current_dda} → <span className={rec.recommended_dda > rec.current_dda ? 'text-red-400' : 'text-emerald-400'}>{rec.recommended_dda}</span>
                                    </span>
                                    <span className="text-[9px] text-slate-500 max-w-[200px] truncate">{rec.reason}</span>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MagneticTether: React.FC<{ pair: ResonancePair }> = ({ pair }) => (
    <div className="relative flex flex-col items-center justify-center p-6 bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
        {/* Animated Tether Line */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
                className="w-[60%] h-[2px] bg-gradient-to-r from-cyan-500 via-amber-500 to-rose-500 opacity-30"
                animate={{
                    scaleX: [0.9, 1.1, 0.9],
                    opacity: [0.2, 0.5, 0.2]
                }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            />
        </div>

        <div className="relative z-10 flex justify-between w-full items-center gap-8">
            {/* User A */}
            <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-cyan-500/50 bg-slate-800 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    <Users className="w-6 h-6 text-cyan-400" />
                </div>
                <span className="text-[10px] text-slate-400 font-bold truncate max-w-[80px]">
                    {pair.user_a_email?.split('@')[0]}
                </span>
            </div>

            {/* Axis Label */}
            <div className="flex flex-col items-center z-20">
                <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full">
                    <span className="text-[10px] font-black text-amber-500 tracking-widest whitespace-nowrap uppercase">
                        {pair.complementary_axis} MAG-RESONANCE
                    </span>
                </div>
                <div className="mt-2 flex items-center gap-1">
                    <motion.div
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-1.5 h-1.5 rounded-full bg-amber-500"
                    />
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">Entangled</span>
                </div>
            </div>

            {/* User B */}
            <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-rose-500/50 bg-slate-800 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                    <Users className="w-6 h-6 text-rose-400" />
                </div>
                <span className="text-[10px] text-slate-400 font-bold truncate max-w-[80px]">
                    {pair.user_b_email?.split('@')[0]}
                </span>
            </div>
        </div>

        {/* Mission Context Preview */}
        <div className="mt-6 w-full p-3 bg-black/40 rounded-xl border border-white/5">
            <p className="text-[9px] text-slate-400 italic font-mono leading-relaxed">
                "Targeting {pair.complementary_axis} complementarity. Ephemeral link active for 24 hours."
            </p>
        </div>
    </div>
);

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="p-5 bg-slate-900/40 rounded-2xl border border-white/5 group hover:border-amber-500/20 transition-colors">
        <div className="p-2 bg-white/5 rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform">{icon}</div>
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">{label}</span>
        <span className="text-xl font-black text-white tracking-tight">{value}</span>
    </div>
);

const PioneerRow: React.FC<{ pioneer: PioneerReportCard; rank: number; variant: 'success' | 'danger' }> = ({ pioneer, rank, variant }) => (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
        <div className="flex items-center gap-3">
            <span className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full ${variant === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {rank}
            </span>
            <div>
                <span className="text-sm font-bold text-white">{pioneer.email || 'Anonymous'}</span>
                {pioneer.is_aegis_prime && <Crown className="w-3 h-3 text-yellow-400 inline ml-2" />}
            </div>
        </div>
        <span className={`text-sm font-black ${variant === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {pioneer.phoenix_score.toFixed(3)}
        </span>
    </div>
);
