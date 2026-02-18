import { FC, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, CheckCircle, XCircle, Zap } from "lucide-react";
import type { MirrorInsight } from "../services/mirrorLogic";

interface HonestyChallengeProps {
    insight: MirrorInsight;
    onAccept: () => void;   // User accepts the truth
    onDismiss: () => void;  // User dismisses
}

export const HonestyChallenge: FC<HonestyChallengeProps> = ({ insight, onAccept, onDismiss }) => {
    const [phase, setPhase] = useState<"reveal" | "choice" | "resolved">("reveal");

    const handleAccept = () => {
        setPhase("resolved");
        setTimeout(onAccept, 800);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
            <div className="w-full max-w-sm bg-gradient-to-br from-slate-900 to-slate-800 border border-rose-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                {/* Glow */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                        <Eye className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-rose-400 uppercase tracking-widest">تحدي المصارحة</div>
                        <div className="text-[10px] text-slate-500 font-mono">Honesty Challenge</div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {phase === "reveal" && (
                        <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {/* Contradiction */}
                            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-4">
                                <p className="text-sm text-slate-300 leading-relaxed mb-3">
                                    {insight.message}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-rose-400/80">
                                    <Zap className="w-3 h-3" />
                                    <span>المرآة رصدت تناقضاً في سلوكك</span>
                                </div>
                            </div>

                            <p className="text-center text-sm text-slate-400 mb-4">
                                من نصدق؟ <span className="text-white font-bold">كلامك أم أفعالك؟</span>
                            </p>

                            <button
                                onClick={() => setPhase("choice")}
                                className="w-full py-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-sm hover:bg-rose-500/30 transition-colors"
                            >
                                أنا مستعد للمواجهة →
                            </button>
                        </motion.div>
                    )}

                    {phase === "choice" && (
                        <motion.div key="choice" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                            <p className="text-center text-white font-bold mb-6 text-base leading-relaxed">
                                هل تعترف بهذا التناقض وتتعهد بتغييره؟
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleAccept}
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-sm hover:bg-emerald-500/30 transition-colors"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    نعم، أعترف وسأتغير
                                </button>
                                <button
                                    onClick={onDismiss}
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-700/40 border border-slate-600/40 text-slate-400 text-sm hover:bg-slate-700/60 transition-colors"
                                >
                                    <XCircle className="w-4 h-4" />
                                    لست مستعداً الآن
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {phase === "resolved" && (
                        <motion.div
                            key="resolved"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-4"
                        >
                            <div className="text-4xl mb-3">🛡️</div>
                            <p className="text-emerald-400 font-bold text-lg">شجاعة حقيقية.</p>
                            <p className="text-slate-400 text-sm mt-1">+50 XP — وسام الصدق</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
