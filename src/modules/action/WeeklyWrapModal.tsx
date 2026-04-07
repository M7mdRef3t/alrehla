import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, TrendingDown, TrendingUp, Zap, Sparkles, Battery } from "lucide-react";
import { usePulseState } from "@/state/pulseState";

interface WeeklyWrapModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const WeeklyWrapModal: React.FC<WeeklyWrapModalProps> = ({ isOpen, onClose }) => {
    const logs = usePulseState((s) => s.logs);

    const wrapData = useMemo(() => {
        if (!logs || logs.length === 0) return null;

        const now = Date.now();
        const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
        const thisWeekLogs = logs.filter((l) => l.timestamp >= oneWeekAgo);

        if (thisWeekLogs.length === 0) return null;

        let totalEnergy = 0;
        const reasonImpacts: Record<string, { count: number; totalEnergy: number }> = {};

        thisWeekLogs.forEach((log) => {
            totalEnergy += log.energy; // 1-10
            if (log.energyReasons && log.energyReasons.length > 0) {
                log.energyReasons.forEach((reason) => {
                    if (!reasonImpacts[reason]) reasonImpacts[reason] = { count: 0, totalEnergy: 0 };
                    reasonImpacts[reason].count++;
                    reasonImpacts[reason].totalEnergy += log.energy;
                });
            }
        });

        const averageEnergy = totalEnergy / thisWeekLogs.length;

        // Calculate P&L (if avg > 5, it's positive net energy)
        // Map 1-10 to -500 to +500
        const netEarnings = Math.round((averageEnergy - 5.5) * 100);

        let biggestDrain = { name: "لا يوجد", avg: Infinity };
        let biggestBoost = { name: "لا يوجد", avg: -Infinity };

        Object.entries(reasonImpacts).forEach(([reason, stats]) => {
            if (stats.count < 1) return; // need at least 1 mention
            const avg = stats.totalEnergy / stats.count;
            if (avg < biggestDrain.avg) biggestDrain = { name: reason, avg };
            if (avg > biggestBoost.avg) biggestBoost = { name: reason, avg };
        });

        if (biggestDrain.avg > 5) biggestDrain.name = "لا يوجد"; // Not really a drain
        if (biggestBoost.avg < 6) biggestBoost.name = "لا يوجد"; // Not really a boost

        return {
            totalPulses: thisWeekLogs.length,
            averageEnergy: averageEnergy.toFixed(1),
            netEarnings,
            biggestDrain: biggestDrain.name,
            biggestBoost: biggestBoost.name,
        };
    }, [logs]);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "حصيلة طاقتي الأسبوعية",
                    text: `هذا الأسبوع حققت ${wrapData?.netEarnings ?? 0 > 0 ? "أرباح طاقية" : "خسائر طاقية"} بمقدار ${wrapData?.netEarnings ?? 0} نقطة في دوائر! صمم خريطتك الخاصة.`,
                    url: window.location.origin
                });
            } catch (err) {
                console.error("Error sharing", err);
            }
        } else {
            // Fallback fallback copy to clipboard or just alert
            alert("النسخ والمشاركة غير مدعومة في متصفحك الحالي.");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" dir="rtl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl"
                        style={{
                            background: "linear-gradient(145deg, #0f172a, #1e293b)",
                            border: "1px solid rgba(45, 212, 191, 0.2)",
                        }}
                    >
                        {/* Background Glow */}
                        <div className="absolute -top-32 -right-32 w-64 h-64 bg-teal-500/20 rounded-full blur-[80px]" />
                        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]" />

                        {/* Header */}
                        <div className="px-6 pt-8 pb-4 flex justify-between items-center relative z-10">
                            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                                <Sparkles size={24} className="text-teal-400" />
                                حصاد الأسبوع
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-6 pb-8 relative z-10 space-y-6">
                            {!wrapData ? (
                                <div className="text-center py-12">
                                    <Battery size={48} className="mx-auto text-slate-600 mb-4" />
                                    <p className="text-slate-400 font-medium">لا توجد بيانات كافية هذا الأسبوع.</p>
                                    <p className="text-xs text-slate-500 mt-2">سجل نبضاتك يومياً لتحصل على تقريرك.</p>
                                </div>
                            ) : (
                                <>
                                    {/* P&L Card */}
                                    <div className="bg-slate-800/50 rounded-2xl p-6 border-l-4 border-l-teal-500 shadow-inner">
                                        <p className="text-slate-400 text-sm font-medium mb-1">صافي الطاقة (P&L)</p>
                                        <div className="flex items-end gap-3">
                                            <h3 className={`text-4xl font-black ${wrapData.netEarnings >= 0 ? "text-teal-400" : "text-rose-400"}`}>
                                                {wrapData.netEarnings > 0 ? "+" : ""}{wrapData.netEarnings}
                                            </h3>
                                            <span className="text-slate-500 text-sm mb-1 font-medium">نقطة طاقة</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-3">
                                            بناءً على متوسط طاقتك ({wrapData.averageEnergy}/10) من {wrapData.totalPulses} تحديثات.
                                        </p>
                                    </div>

                                    {/* Drain vs Boost */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-rose-500/10 rounded-2xl p-4 border border-rose-500/20">
                                            <div className="flex items-center gap-2 text-rose-400 mb-2">
                                                <TrendingDown size={18} />
                                                <span className="text-xs font-bold">أكبر استنزاف</span>
                                            </div>
                                            <p className="text-white font-bold truncate text-lg">{wrapData.biggestDrain}</p>
                                        </div>

                                        <div className="bg-teal-500/10 rounded-2xl p-4 border border-teal-500/20">
                                            <div className="flex items-center gap-2 text-teal-400 mb-2">
                                                <TrendingUp size={18} />
                                                <span className="text-xs font-bold">أكبر شحن</span>
                                            </div>
                                            <p className="text-white font-bold truncate text-lg">{wrapData.biggestBoost}</p>
                                        </div>
                                    </div>

                                    {/* AI Insight */}
                                    <div className="bg-indigo-500/10 rounded-2xl p-4 border border-indigo-500/20 flex gap-3 items-start">
                                        <Zap size={20} className="text-indigo-400 shrink-0 mt-0.5" />
                                        <p className="text-sm text-indigo-200 leading-relaxed font-medium">
                                            {wrapData.netEarnings > 0
                                                ? "أسبوع ممتاز! إنت قدرت تحافظ على حدودك بشكل ملحوظ."
                                                : "طاقتك اتسحبت بشكل ملحوظ الأسبوع ده. راجع المدارات القريبة وعيد بناء أسوارك."}
                                        </p>
                                    </div>

                                    {/* Share Button */}
                                    <button
                                        onClick={handleShare}
                                        className="w-full relative group overflow-hidden rounded-2xl p-4 font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                        <Share2 size={20} />
                                        <span>انشر حصادك</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
