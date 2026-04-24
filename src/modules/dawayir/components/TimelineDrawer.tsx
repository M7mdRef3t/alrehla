'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, TrendingDown, TrendingUp, Minus, Activity } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';

interface MapSnapshot {
    id: string;
    map_id: string;
    nodes_snapshot: any[];
    edges_snapshot: any[];
    insight_snapshot: string | null;
    stress_level_at_time: number | null;
    node_count: number;
    snapshot_at: string;
}

interface TimelineDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string | null;
}

function formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('ar-EG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getStressTrend(current: number | null, previous: number | null): 'up' | 'down' | 'stable' {
    if (current === null || previous === null) return 'stable';
    if (current > previous + 5) return 'up';
    if (current < previous - 5) return 'down';
    return 'stable';
}

const trendConfig = {
    up: { icon: TrendingUp, color: 'text-rose-400', label: 'ارتفع' },
    down: { icon: TrendingDown, color: 'text-teal-400', label: 'انخفض' },
    stable: { icon: Minus, color: 'text-slate-400', label: 'مستقر' },
};

export function TimelineDrawer({ isOpen, onClose, userId }: TimelineDrawerProps) {
    const [snapshots, setSnapshots] = useState<MapSnapshot[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSnapshot, setSelectedSnapshot] = useState<MapSnapshot | null>(null);

    const loadSnapshots = useCallback(async () => {
        if (!userId || !supabase) return;
        setIsLoading(true);

        const { data, error } = await supabase
            .from('dawayir_map_snapshots')
            .select('*')
            .eq('user_id', userId)
            .order('snapshot_at', { ascending: false })
            .limit(20);

        if (!error && data) {
            setSnapshots(data as MapSnapshot[]);
        }
        setIsLoading(false);
    }, [userId]);

    useEffect(() => {
        if (isOpen) {
            loadSnapshots();
        }
    }, [isOpen, loadSnapshots]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed top-0 left-0 h-full w-full max-w-md z-50 overflow-y-auto"
                        style={{
                            background: 'rgba(6,10,22,0.95)',
                            borderRight: '1px solid rgba(255,255,255,0.08)',
                            backdropFilter: 'blur(32px)',
                        }}
                        dir="rtl"
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 px-6 pt-6 pb-4" style={{ background: 'rgba(6,10,22,0.95)', backdropFilter: 'blur(20px)' }}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-white tracking-tight">خط الزمن</h2>
                                        <p className="text-[10px] text-slate-500 font-bold">تتبع تطور خريطتك عبر الوقت</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-6 pb-6">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
                                </div>
                            ) : snapshots.length === 0 ? (
                                <div className="text-center py-16">
                                    <Clock className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                    <h3 className="text-sm font-bold text-slate-400 mb-1">لا توجد لقطات بعد</h3>
                                    <p className="text-[11px] text-slate-600">احفظ خريطتك وستظهر هنا لقطة زمنية تلقائياً.</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    {/* Vertical timeline line */}
                                    <div className="absolute right-[19px] top-0 bottom-0 w-px bg-white/[0.06]" />

                                    {snapshots.map((snap, idx) => {
                                        const prevSnap = snapshots[idx + 1]; // older
                                        const trend = getStressTrend(snap.stress_level_at_time, prevSnap?.stress_level_at_time ?? null);
                                        const TrendIcon = trendConfig[trend].icon;
                                        const isSelected = selectedSnapshot?.id === snap.id;

                                        return (
                                            <motion.div
                                                key={snap.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.06 }}
                                                className="relative pr-10 pb-6 last:pb-0"
                                            >
                                                {/* Timeline dot */}
                                                <div className="absolute right-[14px] top-1 z-10">
                                                    <div className={`w-3 h-3 rounded-full border-2 ${
                                                        idx === 0
                                                            ? 'bg-teal-500 border-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.4)]'
                                                            : 'bg-slate-800 border-slate-600'
                                                    }`} />
                                                </div>

                                                {/* Card */}
                                                <button
                                                    onClick={() => setSelectedSnapshot(isSelected ? null : snap)}
                                                    className={`w-full text-right p-4 rounded-2xl border transition-all duration-200 ${
                                                        isSelected
                                                            ? 'bg-indigo-500/10 border-indigo-500/30'
                                                            : 'bg-white/[0.02] border-white/[0.05] hover:border-white/10'
                                                    }`}
                                                >
                                                    {/* Date */}
                                                    <span className="text-[10px] font-bold text-slate-500">{formatDate(snap.snapshot_at)}</span>

                                                    {/* Stats Row */}
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <div className="flex items-center gap-1.5">
                                                            <Activity className="w-3 h-3 text-slate-500" />
                                                            <span className="text-xs font-black text-white font-mono">{snap.node_count} نقاط</span>
                                                        </div>
                                                        {snap.stress_level_at_time !== null && (
                                                            <div className="flex items-center gap-1.5">
                                                                <TrendIcon className={`w-3 h-3 ${trendConfig[trend].color}`} />
                                                                <span className={`text-xs font-black font-mono ${trendConfig[trend].color}`}>
                                                                    توتر {snap.stress_level_at_time}%
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Insight Preview */}
                                                    {snap.insight_snapshot && (
                                                        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed line-clamp-2">
                                                            {snap.insight_snapshot}
                                                        </p>
                                                    )}
                                                </button>

                                                {/* Expanded detail */}
                                                <AnimatePresence>
                                                    {isSelected && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden mt-2"
                                                        >
                                                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-3">
                                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">تفاصيل اللقطة</h4>

                                                                <div className="grid grid-cols-3 gap-2">
                                                                    <div className="bg-white/5 p-2 rounded-lg text-center">
                                                                        <span className="text-[8px] text-slate-500 block">النقاط</span>
                                                                        <span className="text-sm font-black text-white font-mono">{snap.node_count}</span>
                                                                    </div>
                                                                    <div className="bg-white/5 p-2 rounded-lg text-center">
                                                                        <span className="text-[8px] text-slate-500 block">الروابط</span>
                                                                        <span className="text-sm font-black text-white font-mono">{snap.edges_snapshot?.length ?? 0}</span>
                                                                    </div>
                                                                    <div className="bg-white/5 p-2 rounded-lg text-center">
                                                                        <span className="text-[8px] text-slate-500 block">التوتر</span>
                                                                        <span className="text-sm font-black text-white font-mono">{snap.stress_level_at_time ?? '—'}</span>
                                                                    </div>
                                                                </div>

                                                                {snap.insight_snapshot && (
                                                                    <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/10">
                                                                        <span className="text-[9px] font-black text-teal-500/60 block mb-1">البصيرة</span>
                                                                        <p className="text-[11px] text-slate-300 leading-relaxed">{snap.insight_snapshot}</p>
                                                                    </div>
                                                                )}

                                                                {prevSnap && snap.stress_level_at_time !== null && prevSnap.stress_level_at_time !== null && (
                                                                    <div className={`flex items-center gap-2 p-2 rounded-lg ${
                                                                        trend === 'down' ? 'bg-teal-500/5' : trend === 'up' ? 'bg-rose-500/5' : 'bg-white/5'
                                                                    }`}>
                                                                        <TrendIcon className={`w-4 h-4 ${trendConfig[trend].color}`} />
                                                                        <span className={`text-[10px] font-bold ${trendConfig[trend].color}`}>
                                                                            التوتر {trendConfig[trend].label} من {prevSnap.stress_level_at_time}% إلى {snap.stress_level_at_time}%
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
