import { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MirrorInsight } from "../services/mirrorLogic";

interface MirrorOverlayProps {
    insight: MirrorInsight | null;
    onConfront: (insight: MirrorInsight) => void;
    onDeny: (insight: MirrorInsight) => void;
}

export const MirrorOverlay: FC<MirrorOverlayProps> = ({ insight, onConfront, onDeny }) => {
    if (!insight) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className="w-full max-w-md text-center">
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {/* Spotlight Icon */}
                        <div className="mx-auto w-20 h-20 mb-6 rounded-full flex items-center justify-center bg-rose-500/10 border border-rose-500/30 shadow-[0_0_40px_rgba(244,63,94,0.2)]">
                            <span className="text-4xl">🪞</span>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2 font-serif">
                            {insight.title}
                        </h2>

                        <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                            {insight.message}
                        </p>

                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 mb-8 backdrop-blur-sm">
                            <p className="text-rose-400 font-medium text-xl font-serif">
                                "{insight.question}"
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => onConfront(insight)}
                                className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-rose-600/20 active:scale-[0.98]"
                            >
                                مواجهة الحقيقة
                            </button>

                            <button
                                onClick={() => onDeny(insight)}
                                className="w-full py-4 bg-transparent hover:bg-white/5 text-slate-400 hover:text-white rounded-xl font-medium transition-colors"
                            >
                                إنكار (حاول مرة أخرى لاحقاً)
                            </button>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
