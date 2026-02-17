import type { FC } from "react";
import { Zap, CloudMoon, TrendingUp, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface PulseStabilityCardProps {
    type: "energy" | "mood";
    unstableToCompletedPct: number | null;
    stabilityRate: number | null;
    isRisk: boolean;
    recommendationRate: number | null;
    undoRate?: number | null;
    points: Array<{ date: string;[key: string]: any }>;
}

export const PulseStabilityCard: FC<PulseStabilityCardProps> = ({
    type,
    unstableToCompletedPct,
    stabilityRate,
    isRisk,
    recommendationRate,
    undoRate,
    points
}) => {
    const isEnergy = type === "energy";
    const title = isEnergy ? "استقرار مجال الطاقة" : "تدفق المزاج الجوي";
    const icon = isEnergy ? (
        <Zap className={`w-6 h-6 ${isRisk ? "text-amber-400" : "text-teal-400"}`} />
    ) : (
        <CloudMoon className={`w-6 h-6 ${isRisk ? "text-rose-400" : "text-indigo-400"}`} />
    );

    return (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-950/80 backdrop-blur-xl shadow-2xl">
            <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] opacity-10 transition-all duration-1000 ${isRisk ? "bg-rose-500" : isEnergy ? "bg-teal-500" : "bg-indigo-500"}`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(45,212,191,0.05),transparent)]" />

            <div className="relative z-10 p-8 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 pb-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-2xl ${isRisk ? "bg-rose-500/10 border-rose-500/30" : isEnergy ? "bg-teal-500/10 border-teal-500/30" : "bg-indigo-500/10 border-indigo-500/30"}`}>
                            {icon}
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">{title}</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mt-1">مؤشر الاستجابة العصبية</p>
                        </div>
                    </div>
                    {isRisk && (
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/40 backdrop-blur-sm"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">تدفق مضطرب</span>
                        </motion.div>
                    )}
                </div>

                {/* Main Metrics */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-6 group/stat hover:border-white/20 hover:bg-slate-950/80 transition-all backdrop-blur-sm">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-3">معدل الاستقرار</p>
                        <div className="flex items-baseline gap-3 mb-4">
                            <p className={`text-5xl font-black tabular-nums ${isRisk ? "text-rose-400" : "text-white"}`}>
                                {stabilityRate != null ? `${stabilityRate}%` : "—"}
                            </p>
                            {stabilityRate != null && <TrendingUp className={`w-5 h-5 ${stabilityRate > 80 ? "text-teal-500" : "text-slate-600"}`} />}
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-900/80 overflow-hidden border border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${stabilityRate ?? 0}%` }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                className={`h-full ${isRisk ? "bg-gradient-to-r from-rose-500 to-rose-400" : "bg-gradient-to-r from-teal-500 to-teal-400"}`}
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-6 group/stat hover:border-white/20 hover:bg-slate-950/80 transition-all backdrop-blur-sm">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-3">فجوة الانتروبيا</p>
                        <p className={`text-5xl font-black tabular-nums transition-colors mb-2 ${isRisk ? "text-rose-400" : "text-slate-300"}`}>
                            {unstableToCompletedPct != null ? `${unstableToCompletedPct}%` : "—"}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">التباين / إجمالي الإكمال</p>
                    </div>
                </div>

                {/* Secondary Metrics */}
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6 space-y-5 backdrop-blur-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">التزام الاختيار</span>
                        <span className="text-sm font-black text-white tabular-nums">{recommendationRate != null ? `${recommendationRate}%` : "—"}</span>
                    </div>
                    <div className="h-1.5 bg-slate-900/80 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400" style={{ width: `${recommendationRate ?? 0}%` }} />
                    </div>

                    {undoRate !== undefined && (
                        <>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">ارتدادات النبض الذرية</span>
                                <span className="text-sm font-black text-rose-400 tabular-nums">{undoRate != null ? `${undoRate}%` : "—"}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Trend Visualization */}
                <div className="space-y-4">
                    <div className="flex gap-1 items-end h-20 px-3 bg-slate-950/40 rounded-2xl border border-white/10 backdrop-blur-sm p-4">
                        {points.slice(-14).map((p, i) => {
                            const val = (p.unstable || 0) * 10;
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.min(100, val + 5)}%` }}
                                    transition={{ duration: 0.5, delay: i * 0.05 }}
                                    className={`flex-1 rounded-t-md ${isRisk ? "bg-gradient-to-t from-rose-500/60 to-rose-400/40" : "bg-gradient-to-t from-teal-500/60 to-teal-400/40"}`}
                                    title={`${p.date}: ${p.unstable} غير مستقر`}
                                />
                            );
                        })}
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed tracking-wide text-center px-4 py-3 bg-slate-950/40 rounded-xl border border-white/5 backdrop-blur-sm">
                        {isEnergy ? "* التقلب العالي يشير إلى البحث عن هوية أو تردد داخلي." : "* مؤشر التردد يحدد نقاط فشل التعبير العاطفي."}
                    </p>
                </div>
            </div>
        </div>
    );
};
