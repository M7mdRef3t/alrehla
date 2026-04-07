import type { FC } from "react";
import { useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, Ghost, ShieldAlert } from "lucide-react";
import { useMapState } from "../state/mapState";
import { useAppOverlayState } from "../state/appOverlayState";
import { soundManager } from "../services/soundManager";

interface GhostingSimulatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    personId: string | null;
}

export const GhostingSimulatorModal: FC<GhostingSimulatorModalProps> = ({ isOpen, onClose, personId }) => {
    const node = useMapState((s) => s.nodes.find((n) => n.id === personId));

    const simData = useMemo(() => {
        if (!node) return { weeklyDrain: 0, monthlyDrain: 0 };

        const now = Date.now();
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const sevenDaysAgo = now - SEVEN_DAYS_MS;

        // Calculate specific drain from this node in the last 7 days
        const weeklyDrain = (node.energyBalance?.transactions || [])
            .filter((t) => t.timestamp >= sevenDaysAgo && t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        // Project it to a month
        const monthlyDrain = weeklyDrain * 4;

        return { weeklyDrain, monthlyDrain };
    }, [node]);

    useEffect(() => {
        if (isOpen && node) {
            if (simData.weeklyDrain > 0) {
                soundManager.playSniperShot();
            } else {
                soundManager.playRadarPing();
            }
        }
    }, [isOpen, node, simData.weeklyDrain]);

    if (!isOpen || !node) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[60] flex items-center justify-center px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
                <motion.div
                    className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl"
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="simulator-title"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-800/50">
                        <div className="flex items-center gap-2">
                            <Ghost className="w-5 h-5 text-indigo-400" aria-hidden="true" />
                            <h3 id="simulator-title" className="font-bold text-slate-100">محاكاة قرارات الانسحاب (Energy ROI)</h3>
                        </div>
                        <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white transition-colors" aria-label="إغلاق واجهة محاكاة الانسحاب">
                            <X className="w-5 h-5" aria-hidden="true" />
                        </button>
                    </div>

                    <div className="p-5">
                        <div className="mb-6">
                            <h4 className="text-lg font-bold text-white mb-2">
                                ماذا لو أوقفت النزيف مع <span className="text-cyan-400">{node.label}</span>؟
                            </h4>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                تحليل الأرباح الطاقية: العائد المؤكد الذي ستستعيده لتوجيهه لمهامك الخاصة لو قطعت هذا الاتصال.
                            </p>
                        </div>

                        {simData.weeklyDrain > 0 ? (
                            <div className="space-y-4">
                                <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-xl p-4 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-cyan-500/20 transition-colors" />

                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-cyan-400/80 font-bold uppercase tracking-wider mb-1">أرباح متوقعة (أسبوعياً)</span>
                                            <span className="text-2xl font-black text-cyan-400">+{simData.weeklyDrain} طاقة</span>
                                        </div>
                                        <TrendingUp className="w-8 h-8 text-cyan-500/50" aria-hidden="true" />
                                    </div>
                                </div>

                                <div className="bg-cyan-950/20 border border-cyan-500/10 rounded-xl p-4 relative overflow-hidden">
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-cyan-400/60 font-bold uppercase tracking-wider mb-1">عائد استثماري (شهرياً)</span>
                                            <span className="text-xl font-bold text-cyan-500/80">+{simData.monthlyDrain} طاقة</span>
                                        </div>
                                        <div className="text-xs text-slate-500 max-w-[120px] text-left leading-tight">
                                            طاقة كافية لإنجاز مهامك المتراكمة لو تجنبت هذا النزيف.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-800/50 rounded-xl border border-slate-700/50">
                                <ShieldAlert className="w-8 h-8 text-slate-500 mb-3" aria-hidden="true" />
                                <p className="text-slate-300 text-sm font-medium">لا يوجد استنزاف ملحوظ مؤخراً.</p>
                                <p className="text-slate-500 text-xs mt-1">هذه العلاقة لا تمثل تهديداً لطاقتك في الوقت المباشر.</p>
                            </div>
                        )}

                        <div className="mt-6 flex flex-col gap-3">
                            {simData.weeklyDrain > 0 && (
                                <button
                                    onClick={() => {
                                        onClose();
                                        useAppOverlayState.getState().openOverlay('journeyGuideChat');
                                    }}
                                    className="w-full flex items-center justify-center py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                                >
                                    ✨ اطلب خطة انسحاب آمنة من المعالج
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className={`w-full flex items-center justify-center py-3 ${simData.weeklyDrain > 0 ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-800 hover:bg-slate-700 text-white"} rounded-xl text-sm font-bold transition-colors`}
                            >
                                إغلاق المحاكاة
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
