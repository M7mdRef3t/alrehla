import type { FC } from "react";
import { BarChart3, TriangleAlert } from "lucide-react";
import { motion } from "framer-motion";

interface SuccessIndexCardProps {
    successIndex: number;
    successSampleSize: number;
    hasReliableSample: boolean;
    successDecisionLabel: string;
    successDecisionClass: string;
    startClickRate: number | null;
    pulseCompletionRate: number | null;
    authSuccessRateFromPulse: number | null;
    addPersonCompletionRatio: number | null;
    retention7d: number | null;
    successRecommendations: string[];
    weakestMetric?: { label: string };
    onCommitDecision: () => void;
    decisionSaving: boolean;
    decisionMessage: string | null;
    weeklyDecisionEntries: Array<{
        id: string;
        createdAt: number;
        score: number | null;
        decisionLabel: string;
        sampleSize: number | null;
    }>;
    weeklyDecisionLoading: boolean;
}

export const SuccessIndexCard: FC<SuccessIndexCardProps> = ({
    successIndex,
    successSampleSize,
    hasReliableSample,
    successDecisionLabel,
    successDecisionClass,
    startClickRate,
    pulseCompletionRate,
    authSuccessRateFromPulse,
    addPersonCompletionRatio,
    retention7d,
    successRecommendations,
    weakestMetric,
    onCommitDecision,
    decisionSaving,
    decisionMessage,
    weeklyDecisionEntries,
    weeklyDecisionLoading
}) => {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-br from-slate-900/60 to-slate-950/80 backdrop-blur-xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(45,212,191,0.08),transparent)]" />

            <div className="relative z-10 p-10 space-y-10">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 flex-wrap pb-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/30 shadow-lg">
                            <BarChart3 className="w-7 h-7 text-teal-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">مؤشر النجاح (Q1 الأساسي)</h3>
                            <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">تقييم صحة المشروع الآلي</p>
                        </div>
                    </div>
                    <span className={`rounded-2xl border px-5 py-2 text-xs font-black uppercase tracking-wide shadow-lg ${successDecisionClass}`}>
                        {successDecisionLabel}
                    </span>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Score Display */}
                    <div className="lg:col-span-4 flex flex-col justify-center space-y-6">
                        <div>
                            <span className="text-xs font-black uppercase tracking-wide text-slate-400 block mb-3">حيوية المشروع</span>
                            <span className={`text-7xl font-black tabular-nums transition-colors duration-1000 ${successIndex >= 75 ? "text-teal-400" : successIndex >= 50 ? "text-amber-400" : "text-rose-400"}`}>
                                {successIndex}<span className="text-2xl font-normal text-slate-500 ml-2">/100</span>
                            </span>
                        </div>

                        <div className="h-3 rounded-full bg-slate-950/80 border border-white/10 overflow-hidden shadow-inner">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(0, Math.min(100, successIndex))}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className={`h-full ${successIndex >= 75 ? "bg-gradient-to-r from-teal-500 to-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.6)]" : successIndex >= 50 ? "bg-gradient-to-r from-amber-500 to-amber-400" : "bg-gradient-to-r from-rose-500 to-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]"}`}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <p className="text-xs text-slate-500 font-bold tracking-wide">
                                العينة: {successSampleSize} جلسة
                            </p>
                            <p className={`text-xs font-black tracking-wide ${hasReliableSample ? "text-teal-400" : "text-amber-400 animate-pulse"}`}>
                                {hasReliableSample ? "بيانات معتمدة" : "موثوقية منخفضة"}
                            </p>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {[
                            { label: "تدفق النمو", value: startClickRate == null ? "—" : `${startClickRate}%`, target: 35 },
                            { label: "وضوح النبض", value: pulseCompletionRate == null ? "—" : `${pulseCompletionRate}%`, target: 60 },
                            { label: "جسر المصادقة", value: authSuccessRateFromPulse == null ? "—" : `${authSuccessRateFromPulse}%`, target: 40 },
                            { label: "كثافة الخريطة", value: addPersonCompletionRatio == null ? "—" : `${addPersonCompletionRatio}%`, target: 45 },
                            { label: "الدورة الأسبوعية", value: retention7d == null ? "—" : `${retention7d}%`, target: 15 },
                        ].map(item => (
                            <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 space-y-2 hover:border-white/20 hover:bg-slate-950/80 transition-all group/stat backdrop-blur-sm">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide group-hover/stat:text-slate-300 transition-colors">{item.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-2xl font-black text-white tabular-nums">{item.value}</p>
                                    {item.target && <span className="text-[10px] text-slate-600 font-bold">الهدف: {item.target}%</span>}
                                </div>
                            </div>
                        ))}
                        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5 flex items-center justify-center backdrop-blur-sm">
                            <div className="text-center">
                                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">الكفاءة</p>
                                <p className="text-xl font-black text-white">مثالي</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Critical Alert */}
                {weakestMetric && (
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 flex items-center justify-between group/weak backdrop-blur-sm">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30 group-hover/weak:scale-110 transition-transform">
                                <TriangleAlert className="w-6 h-6 text-rose-400" />
                            </div>
                            <div>
                                <p className="text-xs text-rose-400 font-black uppercase tracking-wide mb-1">نقطة احتكاك حرجة</p>
                                <p className="text-base font-bold text-white">{weakestMetric.label}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bottom Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/10">
                    {/* Recommendations */}
                    <div className="space-y-5">
                        <p className="text-xs font-black text-indigo-400 uppercase tracking-wide flex items-center gap-3">
                            <span className="w-6 h-px bg-indigo-500/50" />
                            التوصيات الاستراتيجية
                        </p>
                        <div className="space-y-3">
                            {successRecommendations.length > 0 ? successRecommendations.map((item, idx) => (
                                <div key={idx} className="flex gap-3">
                                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0" />
                                    <p className="text-sm text-slate-300 leading-relaxed tracking-wide">{item}</p>
                                </div>
                            )) : <p className="text-sm text-slate-500 italic">لا توصيات في الوقت الحالي.</p>}
                        </div>
                    </div>

                    {/* Decision Log */}
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-7 space-y-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-wide mb-1">تثبيت القرار</p>
                                <h4 className="text-sm font-bold text-white">تسجيل التحول الاستراتيجي الأسبوعي</h4>
                            </div>
                            <button
                                type="button"
                                onClick={onCommitDecision}
                                disabled={decisionSaving}
                                className="px-6 py-3 rounded-xl bg-teal-500 text-slate-950 text-xs font-black uppercase tracking-wide hover:bg-teal-400 transition-all active:scale-95 disabled:opacity-50 shadow-[0_0_25px_rgba(45,212,191,0.3)]"
                            >
                                {decisionSaving ? "جاري المعالجة..." : "تثبيت القرار"}
                            </button>
                        </div>

                        {decisionMessage && (
                            <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`text-xs font-bold tracking-wide p-4 rounded-xl border ${decisionMessage.includes('نجح') || decisionMessage.includes('حفظ') ? 'text-teal-400 border-teal-500/30 bg-teal-500/10' : 'text-rose-400 border-rose-500/30 bg-rose-500/10'}`}
                            >
                                {decisionMessage}
                            </motion.p>
                        )}

                        <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                            {weeklyDecisionLoading ? (
                                <div className="flex items-center gap-3 p-5 bg-slate-950/60 rounded-xl animate-pulse">
                                    <div className="w-2 h-2 rounded-full bg-teal-500" />
                                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wide">جاري المزامنة مع الأرشيف...</span>
                                </div>
                            ) : weeklyDecisionEntries.length === 0 ? (
                                <div className="p-10 text-center border border-dashed border-white/10 rounded-2xl">
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">الأرشيف العصبي فارغ</p>
                                </div>
                            ) : (
                                weeklyDecisionEntries.map((entry) => (
                                    <div key={entry.id} className="rounded-xl border border-white/10 bg-slate-950/80 p-5 flex justify-between items-center group hover:border-white/20 transition-all">
                                        <div>
                                            <p className="text-sm font-bold text-slate-200 tracking-tight mb-1">{entry.decisionLabel}</p>
                                            <p className="text-[10px] text-slate-500 font-mono tracking-tight">المؤشر: {entry.score} | الحجم: {entry.sampleSize}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-500 font-mono">{new Date(entry.createdAt).toLocaleDateString("ar-EG", { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
