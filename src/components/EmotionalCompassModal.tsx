import type { FC } from "react";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import {
    COMPASS_OPTIONS,
    saveCompassReading,
    type EmotionalState,
} from "../services/emotionalCompass";

/* ══════════════════════════════════════════
   EMOTIONAL COMPASS MODAL — البوصلة الانفعالية
   سؤال واحد يضبط كل تجربة المستخدم
   ══════════════════════════════════════════ */

interface EmotionalCompassModalProps {
    onComplete: (state: EmotionalState) => void;
    onSkip: () => void;
}

export const EmotionalCompassModal: FC<EmotionalCompassModalProps> = ({
    onComplete,
    onSkip,
}) => {
    const handleSelect = (state: EmotionalState) => {
        saveCompassReading(state, 2);
        onComplete(state);
    };

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onSkip} />

            {/* Sheet */}
            <motion.div
                className="relative w-full max-w-md rounded-t-3xl overflow-hidden"
                style={{
                    background: "linear-gradient(160deg, #0f172a 0%, #1a1040 100%)",
                    border: "1px solid rgba(99,102,241,0.25)",
                    borderBottom: "none",
                }}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                dir="rtl"
            >
                {/* Header */}
                <div className="p-5 pb-4 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary)]/20 flex items-center justify-center mx-auto mb-3">
                        <Compass className="w-5 h-5 text-[var(--color-primary)]" />
                    </div>
                    <h2 className="text-lg font-bold text-white">إيه إحساسك دلوقتي؟</h2>
                    <p className="text-sm text-slate-400 mt-1">
                        سؤال واحد بس — عشان جارفيس يكون معاك صح
                    </p>
                </div>

                {/* Options grid */}
                <div className="px-5 pb-6">
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {COMPASS_OPTIONS.map((opt) => (
                            <motion.button
                                key={opt.state}
                                onClick={() => handleSelect(opt.state)}
                                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center"
                                style={{
                                    background: "rgba(99,102,241,0.07)",
                                    border: "1px solid rgba(99,102,241,0.15)",
                                }}
                                whileHover={{
                                    scale: 1.05,
                                    background: "rgba(99,102,241,0.15)",
                                    borderColor: "rgba(99,102,241,0.4)",
                                }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span className="text-2xl">{opt.emoji}</span>
                                <span className="text-xs font-bold text-white">{opt.label}</span>
                                <span className="text-[10px] text-slate-500 leading-tight">{opt.sublabel}</span>
                            </motion.button>
                        ))}
                    </div>

                    <button
                        onClick={onSkip}
                        className="w-full text-center text-xs text-slate-600 hover:text-slate-400 transition-colors py-2"
                    >
                        تخطّي
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};


