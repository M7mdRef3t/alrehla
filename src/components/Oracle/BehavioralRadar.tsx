import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Zap,
    Target,
    Activity,
    Clock,
    AlertCircle,
    AlertTriangle,
    TrendingUp
} from 'lucide-react';
import {
    fetchFunnelAnalytics,
    fetchLiveBehavioralEvents,
    fetchTimeToActionHistogram,
    FunnelStats,
    BehavioralEvent,
    HistogramPoint
} from '../../services/adminApi';

export const BehavioralRadar: React.FC = () => {
    const [funnel, setFunnel] = useState<FunnelStats | null>(null);
    const [events, setEvents] = useState<BehavioralEvent[]>([]);
    const [histogram, setHistogram] = useState<HistogramPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [segment, setSegment] = useState<'all' | 'mobile' | 'desktop'>('all');

    useEffect(() => {
        const load = async () => {
            const [f, e, h] = await Promise.all([
                fetchFunnelAnalytics(),
                fetchLiveBehavioralEvents(),
                fetchTimeToActionHistogram()
            ]);
            if (f) setFunnel(f);
            if (e) setEvents(e);
            if (h) setHistogram(h);
            setLoading(false);
        };
        load();
        const interval = setInterval(load, 15000); // 15s refresh
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="p-12 text-center text-orange-400">Syncing Radar Data...</div>;

    const currentFunnel = segment === 'all' ? funnel : (funnel?.segments?.[segment as 'mobile' | 'desktop'] as FunnelStats);

    const funnelSteps = [
        { label: 'Acquisition', sub: 'Landing View', value: currentFunnel?.landing ?? 0, color: '#38bdf8', threshold: 0 },
        { label: 'Interest', sub: 'CTA Clicked', value: currentFunnel?.entry ?? 0, color: '#2dd4bf', threshold: 20 },
        { label: 'Activation', sub: 'First Pulse', value: currentFunnel?.activation ?? 0, color: '#10b981', threshold: 70 },
        { label: 'Engagement (D2)', sub: 'Return Users', value: currentFunnel?.engagement_d2 ?? 0, color: '#f59e0b', threshold: 35 },
        { label: 'Retention (D7)', sub: 'Sticky Users', value: currentFunnel?.engagement_d7 ?? 0, color: '#f43f5e', threshold: 15 },
        { label: 'Conversion', sub: 'Authenticated', value: currentFunnel?.conversion ?? 0, color: '#8b5cf6', threshold: 50 },
    ];

    const maxFunnel = Math.max(...funnelSteps.map(s => s.value), 1);

    // Alert logic
    const alerts = funnelSteps.slice(1).map((step, idx) => {
        const prevValue = funnelSteps[idx].value;
        const yieldRate = prevValue > 0 ? (step.value / prevValue) * 100 : 0;
        if (yieldRate < step.threshold) {
            return {
                label: step.label,
                message: yieldRate < step.threshold * 0.5 ? `Critical ${step.label} Failure` : `${step.label} Friction Detected`,
                severity: yieldRate < step.threshold * 0.5 ? 'high' : 'medium'
            };
        }
        return null;
    }).filter(Boolean);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header: Score & Segments */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 backdrop-blur-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-white flex items-center gap-4">
                            <Activity className="text-orange-400 w-8 h-8" />
                            Behavioral Intelligence
                        </h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">Optimization Discipline v1.2</p>
                    </div>

                    <div className="flex bg-slate-950/60 p-1.5 rounded-2xl border border-white/5">
                        {['all', 'mobile', 'desktop'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setSegment(s as 'all' | 'mobile' | 'desktop')}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${segment === s ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-4 bg-gradient-to-br from-orange-600/20 to-amber-600/10 p-8 rounded-[3rem] border border-orange-500/20 backdrop-blur-3xl flex flex-col justify-center items-center text-center">
                    <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.3em] mb-4">Activation Health</span>
                    <div className="relative flex items-center justify-center">
                        <svg className="w-24 h-24 transform -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                            <motion.circle
                                cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                                className="text-orange-500"
                                strokeDasharray={251.2}
                                initial={{ strokeDashoffset: 251.2 }}
                                animate={{ strokeDashoffset: 251.2 - (251.2 * (funnel?.healthScore?.overall ?? 0)) / 100 }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                            />
                        </svg>
                        <span className="absolute text-2xl font-black text-white">{funnel?.healthScore?.overall}%</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 1. Funnel Overview with Alerts */}
                <div className="lg:col-span-7 bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 backdrop-blur-3xl relative overflow-hidden">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                <Target className="text-orange-400 w-6 h-6" />
                                Actionable Funnel
                            </h3>
                        </div>
                        {alerts.length > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-2xl animate-pulse">
                                <AlertCircle className="w-4 h-4 text-rose-500" />
                                <span className="text-[10px] font-black text-rose-500 uppercase">{alerts.length} Optimization Signals</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-8">
                        {funnelSteps.map((step, idx) => {
                            const prevValue = idx > 0 ? funnelSteps[idx - 1].value : maxFunnel;
                            const yieldRate = prevValue > 0 ? Math.round((step.value / prevValue) * 100) : 0;
                            const isAlert = idx > 0 && yieldRate < step.threshold;

                            return (
                                <div key={step.label} className="relative group">
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1 h-8 rounded-full ${isAlert ? 'bg-rose-500' : 'bg-white/10'}`} />
                                            <div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{step.label}</span>
                                                <h4 className={`text-sm font-bold ${isAlert ? 'text-rose-400' : 'text-slate-200'}`}>
                                                    {step.sub}
                                                    {isAlert && <span className="ml-2 text-[8px] italic opacity-60">(Low Yield)</span>}
                                                </h4>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-black text-white">{step.value}</span>
                                            {idx > 0 && (
                                                <div className={`text-[10px] font-black ${isAlert ? 'text-rose-500' : 'text-emerald-400'}`}>
                                                    {yieldRate}% Yield {isAlert ? '️' : ''}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(step.value / (maxFunnel || 1)) * 100}%` }}
                                            transition={{ duration: 1, delay: idx * 0.1, ease: "circOut" }}
                                            className="h-full rounded-full relative"
                                            style={{ backgroundColor: step.color }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                        </motion.div>
                                    </div>

                                    {/* Smart Recommendation Tooltip */}
                                    <div className="absolute top-1/2 -left-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all -translate-x-full pr-4 pointer-events-none hidden xl:block">
                                        <div className={`p-4 rounded-2xl border ${isAlert ? 'bg-rose-950/80 border-rose-500/30' : 'bg-slate-900/90 border-white/10'} backdrop-blur-xl w-64 shadow-2xl`}>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Recommendation</p>
                                            <p className="text-xs text-white leading-relaxed font-medium">
                                                {idx === 2 ? "Activation Friction Detected: Consider simplifying the Sanctuary First-Frame." :
                                                    idx === 5 ? "Conversion Gap: AI-prompt for guests might be too early." :
                                                        "Step performing within expectations."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Insight & Alerts Column */}
                <div className="lg:col-span-5 space-y-8">
                    {/* Activity Ticker */}
                    <div className="bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 backdrop-blur-3xl h-[400px] flex flex-col">
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-lg font-black text-white flex items-center gap-3">
                                <Activity className="text-emerald-400 w-5 h-5 animate-pulse" />
                                Signals Feed
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                            {events.map((ev) => (
                                <div key={ev.id} className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl flex justify-between items-center group hover:bg-white/[0.02] transition-colors">
                                    <div className="flex gap-4 items-center">
                                        <div className={`p-2 rounded-xl ${ev.event_name.includes('hesitation') ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                            {ev.event_name.includes('hesitation') ? <Clock className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-white uppercase tracking-tighter">{ev.event_name.replace(/_/g, ' ')}</p>
                                            <p className="text-[9px] text-slate-500 uppercase">{String(ev.params?.device_type ?? 'web')}  {ev.user_id ? 'Auth' : 'Guest'}</p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-mono text-slate-600 group-hover:text-slate-400 transition-colors">
                                        {new Date(ev.created_at ?? Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Optimization Alerts */}
                    <div className="bg-rose-500/5 p-8 rounded-[3rem] border border-rose-500/10 backdrop-blur-3xl">
                        <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3" /> System Rejections
                        </h4>
                        <div className="space-y-4">
                            {alerts.map((alert, i) => alert && (
                                <div key={`${alert.label}-${i}`} className="flex items-start gap-4 p-3 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                                    <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${alert.severity === 'high' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                    <p className="text-xs text-slate-300 font-bold leading-relaxed">{alert.message}</p>
                                </div>
                            ))}
                            {alerts.length === 0 && <p className="text-xs text-slate-500 italic">No critical friction detected in current segment.</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Distribution & Retention Curve */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 backdrop-blur-3xl">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-black text-white flex items-center gap-3">
                            <Clock className="text-sky-400 w-5 h-5" />
                            Behavioral Speed Curve
                        </h3>
                    </div>
                    <div className="h-48 flex items-end justify-between gap-4 px-4">
                        {histogram.map((point) => {
                            const maxVal = Math.max(...histogram.map(p => p.count), 1);
                            const height = (point.count / maxVal) * 100;
                            return (
                                <div key={point.bucket} className="flex-1 flex flex-col items-center gap-3">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${height}%` }}
                                        className="w-full bg-gradient-to-t from-sky-600/40 to-sky-400/80 rounded-t-xl border border-sky-400/20"
                                    />
                                    <span className="text-[10px] font-black text-slate-500 uppercase rotate-45 sm:rotate-0 mt-2">{point.bucket}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 backdrop-blur-3xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-black text-white flex items-center gap-3">
                            <TrendingUp className="text-purple-400 w-5 h-5" />
                            Efficiency Forecasts
                        </h3>
                        <p className="text-xs text-slate-500 font-bold mt-4 leading-relaxed">
                            Current trajectory suggests a <span className="text-white">74%</span> activation ceiling. Improvement in 'First Pulse' speed required to break 80%.
                        </p>
                    </div>
                    <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                        <div className="text-center">
                            <span className="block text-[8px] text-slate-500 uppercase font-black">Predicted Yield</span>
                            <span className="text-lg font-black text-emerald-400">+12.4%</span>
                        </div>
                        <button className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-slate-300 hover:bg-white/10 transition-all font-mono">
                            Full Cohort Analysis &rarr;
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
