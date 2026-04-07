/**
 * Victory Report — تقرير الانتصار 🏆
 * ==========================================
 * عرض إنجازات المستخدم وتحليل المسار الاستراتيجي.
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Shield, ChevronLeft } from "lucide-react";
import { calculateVictoryMetrics, scanForAchievements } from "@/services/victoryEngine";

interface VictoryReportProps {
    onClose: () => void;
    onTakeTodayAction?: () => void;
}

export const VictoryReport: React.FC<VictoryReportProps> = ({ onClose, onTakeTodayAction }) => {
    const metrics = useMemo(() => calculateVictoryMetrics(), []);
    const achievements = useMemo(() => scanForAchievements(), []);

    return (
        <motion.div
            className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-2xl overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
        >
            <div className="max-w-2xl mx-auto px-6 py-12 min-h-screen flex flex-col items-center">

                {/* Header */}
                <header className="w-full flex justify-between items-center mb-12">
                    <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                        <ChevronLeft className="w-6 h-6 text-slate-400" />
                    </button>
                    <div className="flex flex-col items-end">
                        <h1 className="text-2xl font-black text-white tracking-tight">تقرير الانتصار المتقدم</h1>
                        <p className="text-xs text-teal-400 font-bold tracking-widest">وحدة ذكاء الانتصار</p>
                    </div>
                </header>

                {/* Harmony Score (The Big Gauge) */}
                <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                        <circle
                            cx="96" cy="96" r="80"
                            fill="none"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="12"
                        />
                        <motion.circle
                            cx="96" cy="96" r="80"
                            fill="none"
                            stroke="url(#victory-gradient)"
                            strokeWidth="12"
                            strokeDasharray="502"
                            initial={{ strokeDashoffset: 502 }}
                            animate={{ strokeDashoffset: 502 - (502 * metrics.harmonyScore) / 100 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            strokeLinecap="round"
                        />
                        <defs>
                            <linearGradient id="victory-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#2dd4bf" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="text-4xl font-black text-white">{Math.round(metrics.harmonyScore)}%</span>
                        <span className="text-[10px] font-bold text-slate-500 tracking-widest">مؤشر الانسجام</span>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 w-full mb-12">
                    <MetricCard
                        icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
                        label="سرعة النمو"
                        value={Math.round(metrics.growthVelocity) + "%"}
                        desc="مدى الاقتراب من بناء الثقة"
                    />
                    <MetricCard
                        icon={<Shield className="w-5 h-5 text-rose-400" />}
                        label="قوة الحسم"
                        value={Math.round(metrics.detachmentStrength) + "%"}
                        desc="القدرة على قطع الاستنزاف"
                    />
                </div>

                {/* Achievements Section */}
                <div className="w-full space-y-6">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        أوسمة الشرف
                    </h2>

                    <div className="space-y-4">
                        {achievements.length > 0 ? achievements.map(ach => (
                            <motion.div
                                key={ach.id}
                                className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4"
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                            >
                                <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-2xl shadow-inner">
                                    {ach.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-white">{ach.title}</h3>
                                    <p className="text-[11px] text-slate-400">{ach.description}</p>
                                </div>
                                <span className="text-[10px] text-slate-600 font-mono">
                                    {new Date(ach.date).toLocaleDateString("ar-EG")}
                                </span>
                            </motion.div>
                        )) : (
                            <div className="py-6 px-4 text-slate-300 border border-dashed border-white/10 rounded-2xl">
                                <p className="text-sm font-bold text-white mb-3 text-center">خطات اأ سب أ سا</p>
                                <ul className="space-y-2 text-xs leading-relaxed">
                                    <li>1. حر عاة ستزِفة  اأحر إ اأصفر أ اأخضر.</li>
                                    <li>2. فذ ة احدة اة سج إجازا.</li>
                                    <li>3. راجع اخرطة بعد اتفذ ثبت خطة تابعة  اتا.</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                <div className="mt-auto w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm active:scale-[0.98] transition-all"
                    >
                        إغلاق التقرير
                    </button>
                    <button
                        onClick={() => onTakeTodayAction?.()}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-[var(--soft-teal)] text-white font-bold text-sm shadow-xl active:scale-[0.98] transition-all"
                    >
                        نفّذ خطوة اليوم
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: string; desc: string }> = ({ icon, label, value, desc }) => (
    <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
            {icon}
            <span className="text-lg font-black text-white">{value}</span>
        </div>
        <div>
            <h3 className="text-xs font-bold text-slate-200">{label}</h3>
            <p className="text-[10px] text-slate-500 leading-tight">{desc}</p>
        </div>
    </div>
);


