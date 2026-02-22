import type { FC } from "react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Sparkles, ArrowRight, CheckCircle2, Loader2, Zap, Repeat } from "lucide-react";
import { detectContradictions, MirrorInsight, dismissMirrorInsight } from "../../../../../services/mirrorLogic";
import { RecoveryEngine } from "../../../../../services/RecoveryEngine";
import { useRecoveryState } from "../../../../../state/recoveryState";
import { CatalystEngine } from "../../../../../services/CatalystEngine";

export const RecoveryWidget: FC = () => {
    const {
        currentPath,
        setCurrentPath,
        isRecoveryLoading,
        setLoading,
        completedTaskIds,
        completeTask,
        resetRecovery
    } = useRecoveryState();

    const [insight, setInsight] = useState<MirrorInsight | null>(null);

    useEffect(() => {
        // Run detection on mount
        const found = detectContradictions();
        setInsight(found);
    }, []);

    const handleGeneratePath = async () => {
        if (!insight) return;
        setLoading(true);
        const path = await RecoveryEngine.generateRecoveryPath(insight);
        if (path) {
            setCurrentPath(path);
        }
        setLoading(false);
    };

    const handleStartArbitrage = () => {
        // Trigger the visual Hot-Swap via Catalyst
        CatalystEngine.triggerManualArbitrage();
    };

    const handleDismiss = () => {
        if (insight) {
            dismissMirrorInsight(insight.id);
            setInsight(null);
            resetRecovery();
        }
    };

    if (!insight && !currentPath) return null;

    return (
        <div className="admin-glass-card overflow-hidden border-white/5 bg-slate-950/40 rounded-2xl backdrop-blur-md" dir="rtl">
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-500/10 to-transparent p-4 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Repeat className="w-5 h-5 text-rose-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">بروتوكول التعافي (Recovery)</h3>
                </div>
                {insight && !currentPath && (
                    <button onClick={handleDismiss} className="text-[10px] text-slate-500 hover:text-white uppercase font-bold">تجاهل</button>
                )}
            </div>

            <div className="p-5">
                {!currentPath ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-3 rounded-full bg-rose-500/20 border border-rose-500/30">
                                <AlertTriangle className="w-6 h-6 text-rose-400" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-rose-200 mb-1">{insight?.title}</h4>
                                <p className="text-sm text-slate-300 leading-relaxed">{insight?.message}</p>
                                <p className="text-xs text-rose-400/70 font-bold mt-2 font-mono italic">"{insight?.question}"</p>
                            </div>
                        </div>

                        <button
                            onClick={handleGeneratePath}
                            disabled={isRecoveryLoading}
                            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 group shadow-lg shadow-indigo-600/20"
                        >
                            {isRecoveryLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            )}
                            {isRecoveryLoading ? "جاري تحليل المسار..." : "توليد خريطة التعافي"}
                        </button>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">المسار المقترح</span>
                            <span className="text-[10px] font-mono text-emerald-400">{completedTaskIds.length}/3 مكتمل</span>
                        </div>

                        <div className="space-y-3 mb-6">
                            {currentPath.tasks.map((task, idx) => {
                                const isCompleted = completedTaskIds.includes(task.id);
                                return (
                                    <div
                                        key={task.id}
                                        className={`p-3 rounded-xl border transition-all ${isCompleted ? 'bg-emerald-500/10 border-emerald-500/30 opacity-60' : 'bg-slate-900/60 border-white/5'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[10px] font-bold uppercase ${task.type === 'pressure_release' ? 'text-cyan-400' :
                                                task.type === 'mirror_flash' ? 'text-rose-400' : 'text-amber-400'
                                                }`}>
                                                {task.type === 'pressure_release' ? 'فك ضغط' :
                                                    task.type === 'mirror_flash' ? 'مواجهة' : 'قرار'}
                                            </span>
                                            {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                                        </div>
                                        <h5 className="text-sm font-bold text-white mb-1">{task.title}</h5>
                                        <p className="text-xs text-slate-400 leading-snug">{task.description}</p>

                                        {!isCompleted && (
                                            <button
                                                onClick={() => completeTask(task.id)}
                                                className="mt-3 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 uppercase"
                                            >
                                                تم التنفيذ <ArrowRight className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {completedTaskIds.length === 0 && (
                            <button
                                onClick={handleStartArbitrage}
                                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 group shadow-lg shadow-emerald-600/20"
                            >
                                <Zap className="w-4 h-4 fill-emerald-400 text-emerald-400 animate-pulse" />
                                تفعيل الـ Arbitrage (ابدأ فوراً)
                            </button>
                        )}

                        {completedTaskIds.length === 3 && (
                            <button
                                onClick={handleDismiss}
                                className="w-full py-3 rounded-xl border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 font-bold text-sm transition-all"
                            >
                                إغلاق المسار (تم التعافي)
                            </button>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
};
