import { logger } from "../services/logger";
import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, AlertCircle, RefreshCw, BrainCircuit, History, Pin, CheckCircle2, Columns } from "lucide-react";
import { useMapState } from "@/state/mapState";
import { supabase } from "@/services/supabaseClient";

interface MapInsight {
    id?: string;
    summary: string;
    insights: string[];
    recommendations: string[];
    warning: string;
    created_at?: string;
    pinned?: boolean;
    source?: string;
    cache_hit?: boolean;
}

interface InsightHistoryItem {
    id: string;
    created_at?: string;
    pinned?: boolean;
    source?: string;
    cache_hit?: boolean;
    result: Omit<MapInsight, "id" | "created_at" | "pinned" | "source" | "cache_hit">;
}

export const MapInsightPanel: FC = () => {
    const nodes = useMapState((s) => s.nodes);
    const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
    const [insight, setInsight] = useState<MapInsight | null>(null);
    const [history, setHistory] = useState<MapInsight[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isComparing, setIsComparing] = useState(false);

    const activeNodes = nodes.filter(n => !n.isNodeArchived);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchHistory = async () => {
        try {
            if (!supabase) return;
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) return;

            const res = await fetch('/api/insight', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHistory(data.map((item: InsightHistoryItem) => ({
                    id: item.id,
                    ...item.result,
                    created_at: item.created_at,
                    pinned: item.pinned,
                    source: item.source,
                    cache_hit: item.cache_hit
                })));
            }
        } catch (err) {
            logger.error("History fetch error", err);
        }
    };

    const togglePin = async (id: string, currentStatus: boolean) => {
        try {
            if (!supabase) return;
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) return;

            const res = await fetch(`/api/insight/${id}/pin`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ pinned: !currentStatus })
            });
            if (res.ok) {
                setHistory(prev => prev.map(item => item.id === id ? { ...item, pinned: !currentStatus } : item));
                if (insight?.id === id) setInsight(prev => prev ? { ...prev, pinned: !currentStatus } : null);
            }
        } catch (err) {
            logger.error("Pinning error", err);
        }
    };

    const generateInsight = async () => {
        if (activeNodes.length === 0) return;
        setLoading(true);
        setError(null);
        setActiveTab('current');

        try {
            const snapshot = activeNodes.map(n => ({
                label: n.label,
                ring: n.ring,
                goalId: n.goalId,
                detachmentMode: n.detachmentMode,
                missionCompleted: n.missionProgress?.isCompleted
            }));

            const session = supabase ? (await supabase.auth.getSession()).data.session : null;
            const token = session?.access_token;

            const res = await fetch('/api/insight', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ mapSnapshot: snapshot, mode: 'summary' })
            });

            if (!res.ok) {
                if (res.status === 429) {
                    throw new Error('استنفذت حصتك اليومية لبصيرة الوعي (30/30). جرّب تاني بكرة.');
                }
                throw new Error('فشل الاتصال ببصيرة الوعي');
            }

            const data = await res.json();
            // Map flat result or history item format
            const mapped = {
                id: data._id,
                ...data,
                cache_hit: data._source === 'cached'
            };
            setInsight(mapped);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
        } finally {
            setLoading(false);
        }
    };

    if (activeNodes.length === 0) return null;

    return (
        <div className="w-full max-w-[38rem] mx-auto mt-6 mb-8 px-4">
            <div
                className="relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-xl"
                style={{ background: "rgba(15,23,42,0.4)" }}
            >
                {/* Header & Tabs */}
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                            <BrainCircuit className="w-5 h-5" />
                        </div>
                        <div className="flex bg-white/5 rounded-full p-1 border border-white/5">
                            <button
                                onClick={() => setActiveTab('current')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${activeTab === 'current' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                            >
                                بصيرة الحاضر
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                            >
                                سجل الرؤى
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={generateInsight}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-indigo-500/20"
                    >
                        {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        تحديث
                    </button>
                </div>

                <div className="p-5">
                    <AnimatePresence mode="wait">
                        {activeTab === 'current' ? (
                            <motion.div key="tab-current" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                                {loading ? (
                                    <div className="py-12 flex flex-col items-center gap-3">
                                        <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                        <p className="text-xs text-slate-400 animate-pulse font-medium">بصيرة الوعي بتحلل الدوائر...</p>
                                    </div>
                                ) : error ? (
                                    <div className="py-4 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        {error}
                                    </div>
                                ) : insight ? (
                                    <InsightView insight={insight} onTogglePin={togglePin} />
                                ) : (
                                    <div className="py-8 text-center text-slate-500">
                                        <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-20" />
                        <p className="text-xs">اضغط "تحديث" عشان تكشف أنماط العلاقات في خريطتك.</p>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div key="tab-history" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                                <div className="space-y-3">
                                    {history.length > 0 ? (
                                        <>
                                            <div className="flex justify-between items-center mb-2 px-1">
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">سجل جلسات التحليل</p>
                                                <button
                                                    onClick={() => setIsComparing(!isComparing)}
                                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold border transition-all ${isComparing ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/10 text-slate-400'}`}
                                                >
                                                    <Columns className="w-3 h-3" />
                                                    مقارنة الرؤى
                                                </button>
                                            </div>
                                            {isComparing && history.length >= 2 ? (
                                                <div className="grid grid-cols-2 gap-3 mb-6">
                                                    <MiniInsightCard insight={history[0]} title="الأحدث" />
                                                    <MiniInsightCard insight={history[1]} title="السابق" />
                                                </div>
                                            ) : null}
                                            <div className="space-y-2">
                                                {history.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => { setInsight(item); setActiveTab('current'); }}
                                                        className="group flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                                                <History className="w-4 h-4" />
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs text-white font-medium truncate max-w-[150px]">{item.summary}</p>
                                                                <p className="text-[9px] text-slate-500">
                                                                    {item.created_at ? new Date(item.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {item.cache_hit && <span title="تم الاسترجاع من الذاكرة"><CheckCircle2 className="w-3 h-3 text-emerald-500 opacity-60" /></span>}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); if (item.id) togglePin(item.id, !!item.pinned); }}
                                                                className={`p-1.5 rounded-full transition-colors ${item.pinned ? 'bg-indigo-500 text-white' : 'hover:bg-white/10 text-slate-500'}`}
                                                            >
                                                                <Pin className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="py-8 text-center text-slate-500">
                                            <History className="w-6 h-6 mx-auto mb-2 opacity-20" />
                                            <p className="text-xs">السجل فارغ.. استكشف أول بصيرة الآن.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const InsightView: FC<{ insight: MapInsight, onTogglePin: (id: string, s: boolean) => void }> = ({ insight, onTogglePin }) => (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                {insight.cache_hit && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        من الذاكرة (أسرع)
                    </div>
                )}
            </div>
            {insight.id && (
                <button
                    onClick={() => onTogglePin(insight.id!, !!insight.pinned)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${insight.pinned ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:border-indigo-500/40'}`}
                >
                    <Pin className="w-3 h-3" />
                    {insight.pinned ? 'ثبّت في السجل' : 'تثبيت الرؤية'}
                </button>
            )}
        </div>

        <div className="text-right">
            <p className="text-[11px] font-bold text-indigo-400 mb-1">الخلاصة البارزة</p>
            <p className="text-sm text-slate-100 leading-relaxed font-medium">
                {insight.summary}
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-right p-4 rounded-xl bg-white/5 border border-white/5 group hover:border-blue-500/20 transition-all">
                <p className="text-[10px] font-bold text-blue-400 mb-3 flex items-center gap-2 justify-end">
                    أنماط علاقات مكتشفة
                    <div className="w-1 h-1 rounded-full bg-blue-400" />
                </p>
                <ul className="space-y-3">
                    {insight.insights.map((txt, i) => (
                        <li key={i} className="text-[11px] text-slate-300 leading-snug flex items-start gap-2 justify-end">
                            <span className="flex-1">{txt}</span>
                            <div className="w-1 h-1 rounded-full bg-blue-500/40 mt-1.5 shrink-0" />
                        </li>
                    ))}
                </ul>
            </div>
            <div className="text-right p-4 rounded-xl bg-white/5 border border-white/5 group hover:border-emerald-500/20 transition-all">
                <p className="text-[10px] font-bold text-emerald-400 mb-3 flex items-center gap-2 justify-end">
                    توصيات مقترحة
                    <ArrowRight className="w-3 h-3" />
                </p>
                <ul className="space-y-3">
                    {insight.recommendations.map((txt, i) => (
                        <li key={i} className="text-[11px] text-slate-300 leading-snug flex items-start gap-2 justify-end">
                            <span className="flex-1">{txt}</span>
                            <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                <ArrowRight className="w-2.5 h-2.5 text-emerald-500" />
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        {insight.warning && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-right flex items-start gap-3 justify-end group">
                <p className="text-[11px] text-amber-200 leading-relaxed">
                    <span className="font-bold text-amber-400">تحذير مهم:</span> {insight.warning}
                </p>
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 group-hover:animate-pulse" />
            </div>
        )}
    </div>
);

const MiniInsightCard: FC<{ insight: MapInsight, title: string }> = ({ insight, title }) => (
    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-right">
        <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] text-slate-500">{insight.created_at ? new Date(insight.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }) : ''}</span>
            <span className="text-[9px] font-bold text-indigo-400">{title}</span>
        </div>
        <p className="text-[10px] text-slate-200 line-clamp-3 mb-2 leading-relaxed">{insight.summary}</p>
        <div className="flex flex-wrap gap-1 justify-end">
            <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[8px] text-emerald-400">{insight.recommendations.length} توصية</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[8px] text-blue-400">{insight.insights.length} رؤية</span>
        </div>
    </div>
);
