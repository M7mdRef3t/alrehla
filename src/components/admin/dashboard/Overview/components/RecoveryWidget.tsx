import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Sparkles, ArrowRight, CheckCircle2, Loader2, Zap, Repeat, HeartPulse } from "lucide-react";
import { detectContradictions, MirrorInsight, dismissMirrorInsight } from "../../../../../services/mirrorLogic";
import { RecoveryEngine } from "../../../../../services/RecoveryEngine";
import { useRecoveryState } from "../../../../../state/recoveryState";
import { CatalystEngine } from "../../../../../services/CatalystEngine";
import { AdminTooltip } from "./AdminTooltip";

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
        <div className="admin-glass-card overflow-hidden border border-white/5 bg-slate-950/60 rounded-3xl backdrop-blur-xl shadow-2xl relative group" dir="rtl">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-rose-500/10 blur-[100px] rounded-full pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity" />

            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-start relative z-10">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-slate-900 rounded-xl border border-rose-500/20 shadow-lg ring-1 ring-white/5">
                        <HeartPulse className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                         <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-1">
                             بروتوكول التعافي الذكي
                             <AdminTooltip content="مستشار ذاتي بيظهر لما الذكاء الاصطناعي يكتشف (تناقض) أو أزمة من خلال تفاعلاتك، وبيقترح عليك مسار علاجي بالـ (Arbitrage)." position="bottom" />
                         </h3>
                         <span className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center gap-2">
                             EMERGENCY RECOVERY ENGINE
                         </span>
                    </div>
                </div>
                {insight && !currentPath && (
                    <button onClick={handleDismiss} className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-rose-500/20 hover:border-rose-500/30">
                        تجاهل الإنذار
                    </button>
                )}
            </div>

            <div className="p-6 relative z-10">
                {!currentPath ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-start gap-4 mb-8 bg-black/20 p-5 rounded-2xl border border-rose-500/10 shadow-inner">
                            <div className="p-3 rounded-full bg-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                                <AlertTriangle className="w-6 h-6 text-rose-400 animate-pulse" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-black text-rose-200 mb-2 tracking-wide">{insight?.title}</h4>
                                <p className="text-xs text-slate-300 leading-relaxed font-bold">{insight?.message}</p>
                                <div className="mt-4 p-3 bg-black/40 rounded-xl border border-white/5 border-r-2 border-r-rose-500">
                                     <p className="text-[11px] text-rose-400/90 font-black font-mono leading-relaxed">"{insight?.question}"</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleGeneratePath}
                            disabled={isRecoveryLoading}
                            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm transition-all flex items-center justify-center gap-3 group shadow-[0_0_20px_rgba(79,70,229,0.3)] ring-1 ring-indigo-400/50 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                        >
                            {isRecoveryLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-indigo-200" />
                            ) : (
                                <Sparkles className="w-5 h-5 text-indigo-200 group-hover:rotate-12 transition-transform" />
                            )}
                            {isRecoveryLoading ? "جاري التوليد العميق..." : "توليد خريطة التعافي"}
                        </button>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">المسار المقترح <AdminTooltip content="خطة من 3 خطوات صممها الذكاء الاصطناعي لحل المشكلة المكتشفة حالاً." position="top" /></span>
                            </div>
                            <span className="text-xs font-black font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">{completedTaskIds.length}/3 مكتمل</span>
                        </div>

                        <div className="space-y-4 mb-8">
                            {currentPath.tasks.map((task, idx) => {
                                const isCompleted = completedTaskIds.includes(task.id);
                                return (
                                    <div
                                        key={task.id}
                                        className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group/task
                                            ${isCompleted ? 'bg-emerald-500/5 border-emerald-500/20 opacity-70 grayscale' : 'bg-slate-900/60 border-white/5 shadow-inner hover:bg-slate-900/80 hover:border-white/10'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border 
                                                ${task.type === 'pressure_release' ? 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20' :
                                                task.type === 'mirror_flash' ? 'text-rose-300 bg-rose-500/10 border-rose-500/20' : 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                                                }`}>
                                                {task.type === 'pressure_release' ? 'فك ضغط نفسي' :
                                                    task.type === 'mirror_flash' ? 'مواجهة واقع' : 'قرار سيادي'}
                                            </span>
                                            {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                        </div>
                                        <h5 className={`text-sm font-black mb-2 transition-colors ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>{task.title}</h5>
                                        <p className="text-xs text-slate-400 leading-relaxed font-bold">{task.description}</p>

                                        {!isCompleted && (
                                            <button
                                                onClick={() => completeTask(task.id)}
                                                className="mt-4 w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 flex items-center justify-center gap-2 transition-all shadow-sm"
                                            >
                                                دائرة التنفيذ <ArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {completedTaskIds.length === 0 && (
                            <button
                                onClick={handleStartArbitrage}
                                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 group shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400/50"
                            >
                                <Zap className="w-5 h-5 fill-emerald-400 text-emerald-400 animate-pulse" />
                                تفعيل הـ Arbitrage (ابدأ فوراً)
                            </button>
                        )}

                        {completedTaskIds.length === 3 && (
                            <button
                                onClick={handleDismiss}
                                className="w-full py-4 rounded-2xl border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 font-black uppercase tracking-widest text-sm transition-all shadow-inner"
                            >
                                إغلاق المسار (تم التعافي السيادي)
                            </button>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
};
