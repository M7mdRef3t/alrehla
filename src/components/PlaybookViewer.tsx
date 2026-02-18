/**
 * Playbook Viewer — مستعرض كتيبات المناورة 📖
 * ==========================================
 * يسمح للمستخدم بتصفح وتنفيذ الخطط الاستراتيجية.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TACTICAL_PLAYBOOKS, type Playbook } from "../data/tacticalPlaybooks";
import { BookOpen, ShieldCheck, Zap, AlertTriangle, ChevronRight, X, CheckCircle2 } from "lucide-react";
import { useGamificationState, XP_ACTIONS } from "../services/gamificationEngine";
import { trackEvent } from "../services/analytics";

export const PlaybookViewer: React.FC = () => {
    const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const addXP = useGamificationState(s => s.addXP);

    return (
        <div className="w-full max-w-lg mx-auto p-4 space-y-6">
            <header className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                    <BookOpen className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-white">كتيبات المناورة</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tactical Playbooks Beta</p>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4">
                {TACTICAL_PLAYBOOKS.map(pb => (
                    <motion.button
                        key={pb.id}
                        onClick={() => setSelectedPlaybook(pb)}
                        className="text-right p-5 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-teal-500/30 transition-all group flex flex-col gap-3"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="flex items-center justify-between w-full">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter ${pb.intensity === "high" ? "bg-rose-500/20 text-rose-400" : "bg-teal-500/20 text-teal-400"
                                }`}>
                                Intensity: {pb.intensity}
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-teal-400/20 transition-colors">
                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1">{pb.title}</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">{pb.description}</p>
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Playbook Detail Modal */}
            <AnimatePresence>
                {selectedPlaybook && (
                    <motion.div
                        className="fixed inset-0 z-[110] bg-slate-950 px-6 py-12 overflow-y-auto"
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                    >
                        <div className="max-w-md mx-auto h-full flex flex-col">
                            <button
                                onClick={() => setSelectedPlaybook(null)}
                                className="self-end p-2 mb-8 rounded-xl bg-white/5"
                            >
                                <X className="w-6 h-6 text-slate-400" />
                            </button>

                            <div className="mb-8">
                                <h1 className="text-3xl font-black text-white mb-2">{selectedPlaybook.title}</h1>
                                <p className="text-slate-400 text-sm leading-relaxed">{selectedPlaybook.description}</p>
                            </div>

                            <div className="space-y-6 mb-12">
                                {selectedPlaybook.steps.map((step, idx) => (
                                    <div key={step.id} className="relative flex gap-4">
                                        <div className="flex flex-col items-center gap-1 shrink-0">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step.isCritical ? "bg-rose-500 text-white" : "bg-slate-800 text-slate-400"
                                                }`}>
                                                {idx + 1}
                                            </div>
                                            {idx < selectedPlaybook.steps.length - 1 && (
                                                <div className="w-px flex-1 bg-slate-800" />
                                            )}
                                        </div>
                                        <div className="pb-8">
                                            <h3 className={`font-bold mb-1 ${step.isCritical ? "text-rose-400" : "text-white"}`}>
                                                {step.title}
                                                {step.isCritical && <AlertTriangle className="inline-block w-3 h-3 ml-2" />}
                                            </h3>
                                            <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => {
                                    if (isExecuting || showSuccess) return;
                                    setIsExecuting(true);
                                    trackEvent("playbook_executed", { playbookId: selectedPlaybook.id });

                                    // Simulation of activation
                                    setTimeout(() => {
                                        setIsExecuting(false);
                                        setShowSuccess(true);
                                        addXP(XP_ACTIONS.MIRROR_CONFRONT, `Executed Playbook: ${selectedPlaybook.title}`);

                                        setTimeout(() => {
                                            setShowSuccess(false);
                                            setSelectedPlaybook(null);
                                        }, 2000);
                                    }, 1500);
                                }}
                                className={`mt-auto w-full py-4 rounded-2xl font-black text-sm uppercase transition-all flex items-center justify-center gap-2 ${showSuccess ? "bg-emerald-500 text-white" : "bg-teal-500 text-slate-950"
                                    }`}
                            >
                                {isExecuting ? (
                                    <div className="w-5 h-5 border-2 border-slate-950 border-t-white rounded-full animate-spin" />
                                ) : showSuccess ? (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        Protocol Active +50 XP
                                    </>
                                ) : (
                                    "تفعيل البروتوكول"
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
