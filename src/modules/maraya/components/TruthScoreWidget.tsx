"use client";

/**
 * ⚔️ TruthScoreWidget — ويدجت نقطة الصفر
 * ========================================
 * دائرة بصرية تعرض مقياس الصدق الذاتي.
 * لون يتغير حسب الأجنحة + trend indicator + tooltip.
 */

import { useState, useEffect, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react";
import {
    getTruthScore,
    getTruthLevelLabel,
    getTruthLevelColor,
    type TruthScoreState,
    type TruthScoreEvent
} from "@/services/truthScoreEngine";

interface TruthScoreWidgetProps {
    compact?: boolean;
}

export const TruthScoreWidget: FC<TruthScoreWidgetProps> = ({ compact = false }) => {
    const [state, setState] = useState<TruthScoreState | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        setState(getTruthScore());
    }, []);

    if (!state) return null;

    const color = getTruthLevelColor(state.level);
    const label = getTruthLevelLabel(state.level);

    // SVG circle calculations
    const radius = compact ? 32 : 48;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (state.score / 100) * circumference;

    const TrendIcon = state.trend === "improving" ? TrendingUp
        : state.trend === "declining" ? TrendingDown
        : Minus;

    const trendColor = state.trend === "improving" ? "text-emerald-400"
        : state.trend === "declining" ? "text-rose-400"
        : "text-zinc-500";

    const trendLabel = state.trend === "improving" ? "بيتحسن"
        : state.trend === "declining" ? "بيتراجع"
        : "ثابت";

    // Emoji + simple description per level
    const levelEmoji = {
        deluded: "🌫️",
        foggy: "🌁",
        awakening: "🌅",
        seeing: "👁️",
        truthful: "✨"
    }[state.level];

    const levelDesc = {
        deluded: "تتجنب الحقيقة حالياً",
        foggy: "الصورة ضبابية — خد وقتك",
        awakening: "بدأت تشوف الأمور أوضح",
        seeing: "واضح معاك إيه اللي بيحصل",
        truthful: "صادق مع نفسك بشكل كامل"
    }[state.level];

    const trendEmoji = state.trend === "improving" ? "📈" : state.trend === "declining" ? "📉" : "➡️";

    if (compact) {
        return (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/5" dir="rtl">
                {/* Score ring */}
                <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                        <motion.circle
                            cx="40" cy="40" r={radius}
                            fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-base font-black tabular-nums" style={{ color }}>{state.score}</span>
                    </div>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm">{levelEmoji}</span>
                        <p className="text-sm font-black truncate" style={{ color }}>{label}</p>
                    </div>
                    {/* Description */}
                    <p className="text-[11px] text-zinc-400 leading-snug mb-1">{levelDesc}</p>
                    {/* Trend badge */}
                    <div className={`inline-flex items-center gap-1 text-[10px] font-bold ${trendColor}`}>
                        <span>{trendEmoji}</span>
                        <span>{trendLabel}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative overflow-hidden rounded-3xl border border-white/5 backdrop-blur-xl p-6"
            style={{ background: "rgba(15,20,35,0.85)" }}
            dir="rtl"
        >
            {/* Background glow */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-[60px] pointer-events-none opacity-20"
                style={{ background: color }}
            />

            {/* Header */}
            <div className="relative z-10 flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10" style={{ color }}>
                    <Eye className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">نقطة الصفر</p>
                    <p className="text-xs text-zinc-500">مقياس الصدق مع الذات</p>
                </div>
            </div>

            {/* Score circle */}
            <div className="relative z-10 flex justify-center mb-5">
                <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 110 110">
                        <circle
                            cx="55" cy="55" r={radius}
                            fill="none"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="5"
                        />
                        <motion.circle
                            cx="55" cy="55" r={radius}
                            fill="none"
                            stroke={color}
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                                filter: `drop-shadow(0 0 8px ${color}40)`
                            }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                            className="text-4xl font-black tabular-nums"
                            style={{ color }}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                        >
                            {state.score}
                        </motion.span>
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">/100</span>
                    </div>
                </div>
            </div>

            {/* Level + Trend */}
            <div className="relative z-10 text-center mb-4">
                <p className="text-lg font-black mb-1" style={{ color }}>{label}</p>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 ${trendColor}`}>
                    <TrendIcon className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">{trendLabel}</span>
                </div>
            </div>

            {/* History toggle */}
            <button
                onClick={() => setShowHistory(!showHistory)}
                className="relative z-10 w-full flex items-center justify-between text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-2"
            >
                <span className="font-bold">📜 سجل الأحداث ({state.history.length})</span>
                {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <AnimatePresence>
                {showHistory && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="relative z-10 overflow-hidden"
                    >
                        <div className="space-y-2 pt-2 max-h-48 overflow-y-auto no-scrollbar">
                            {state.history.slice(0, 10).map((event, i) => (
                                <EventRow key={`${event.timestamp}-${i}`} event={event} />
                            ))}
                            {state.history.length === 0 && (
                                <p className="text-xs text-zinc-600 text-center py-4">
                                    لسه ما فيش أحداث مسجلة — ابدأ واجه الحقيقة.
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const EventRow: FC<{ event: TruthScoreEvent }> = ({ event }) => {
    const isPositive = event.points > 0;
    const timeAgo = getTimeAgo(event.timestamp);

    return (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02]">
            <div className="flex-1">
                <p className="text-xs text-zinc-400 font-tajawal">{event.description}</p>
                <p className="text-[10px] text-zinc-600">{timeAgo}</p>
            </div>
            <span className={`text-sm font-black tabular-nums ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                {isPositive ? "+" : ""}{event.points}
            </span>
        </div>
    );
};

function getTimeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "دلوقتي";
    if (minutes < 60) return `من ${minutes} دقيقة`;
    if (hours < 24) return `من ${hours} ساعة`;
    return `من ${days} يوم`;
}
