import type { FC } from "react";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Wind, ArrowLeft } from "lucide-react";
import { LiveStatusBar } from '@/modules/meta/shared/LiveStatusBar';
import {
    generateQuickPath,
    SITUATION_LABELS,
    SITUATION_ICONS,
    type QuickPathSituation,
    type QuickPathResult,
} from "@/services/quickPath";

/* ══════════════════════════════════════════
   QUICK PATH MODAL — المسار السريع
   جملة خروج فورية بدون خريطة كاملة
   ══════════════════════════════════════════ */

interface QuickPathModalProps {
    onClose: () => void;
}

type Step = "choose" | "context" | "result";

const SITUATIONS: QuickPathSituation[] = [
    "pressure", "guilt", "anger", "overwhelmed", "boundary", "escape",
];

export const QuickPathModal: FC<QuickPathModalProps> = ({ onClose }) => {
    const [step, setStep] = useState<Step>("choose");
    const [selected, setSelected] = useState<QuickPathSituation | null>(null);
    const [context, setContext] = useState("");
    const [result, setResult] = useState<QuickPathResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [breatheActive, setBreatheActive] = useState(false);

    const handleSituationSelect = (s: QuickPathSituation) => {
        setSelected(s);
        setGenerateError(null);
        setStep("context");
    };

    const handleGenerate = useCallback(async () => {
        if (!selected) return;
        setLoading(true);
        setGenerateError(null);
        try {
            const r = await generateQuickPath(selected, context || undefined);
            setResult(r);
            setLastUpdatedAt(Date.now());
            setStep("result");
        } catch {
            setGenerateError("حصلت مشكلة أثناء تجهيز المسار. جرّب مرة تانية.");
        } finally {
            setLoading(false);
        }
    }, [selected, context]);

    const handleBack = () => {
        if (step === "context") { setStep("choose"); setSelected(null); }
        else if (step === "result") { setStep("context"); setResult(null); }
    };

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Backdrop */}
            <motion.div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sheet */}
            <motion.div
                className="relative w-full max-w-md rounded-t-3xl overflow-hidden"
                style={{
                    background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
                    border: "1px solid rgba(139,92,246,0.3)",
                    borderBottom: "none",
                    maxHeight: "90dvh",
                }}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                dir="rtl"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 pb-3">
                    <div className="flex items-center gap-2">
                        {step !== "choose" && (
                            <button
                                onClick={handleBack}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                        )}
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-violet-600/30 flex items-center justify-center">
                                <Zap className="w-4 h-4 text-violet-400" />
                            </div>
                            <div>
                                <p className="text-xs text-violet-400 font-bold uppercase tracking-wider">مسار سريع</p>
                                <h2 className="text-sm font-bold text-white">جملة خروج فورية</h2>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-5 pb-8 overflow-y-auto" style={{ maxHeight: "75dvh" }}>
                    <LiveStatusBar
                        title="حالة توليد المسار"
                        mode={result ? "live" : "fallback"}
                        isLoading={loading}
                        lastUpdatedAt={lastUpdatedAt}
                    />
                    <AnimatePresence mode="wait">

                        {/* Step 1: Choose situation */}
                        {step === "choose" && (
                            <motion.div
                                key="choose"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25 }}
                            >
                                <p className="text-slate-400 text-sm mb-4">إيه اللي بيحصل دلوقتي؟</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {SITUATIONS.map((s) => (
                                        <motion.button
                                            key={s}
                                            onClick={() => handleSituationSelect(s)}
                                            className="flex flex-col items-center gap-2 p-4 rounded-2xl text-center transition-all"
                                            style={{
                                                background: "rgba(139,92,246,0.08)",
                                                border: "1px solid rgba(139,92,246,0.2)",
                                            }}
                                            whileHover={{ scale: 1.03, borderColor: "rgba(139,92,246,0.5)" }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            <span className="text-2xl">{SITUATION_ICONS[s]}</span>
                                            <span className="text-sm font-semibold text-white">{SITUATION_LABELS[s]}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Optional context */}
                        {step === "context" && selected && (
                            <motion.div
                                key="context"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.25 }}
                            >
                                <div className="flex items-center gap-2 mb-4 p-3 rounded-xl"
                                    style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
                                    <span className="text-xl">{SITUATION_ICONS[selected]}</span>
                                    <span className="text-white font-semibold">{SITUATION_LABELS[selected]}</span>
                                </div>

                                <p className="text-slate-400 text-sm mb-3">
                                    في تفاصيل تساعدني أكون أدق؟ <span className="text-slate-500">(اختياري)</span>
                                </p>
                                <textarea
                                    id="quick-path-context"
                                    name="quickPathContext"
                                    value={context}
                                    onChange={(e) => setContext(e.target.value)}
                                    placeholder="مثلاً: ماما بتطلب مني حاجة مش قادر أرفضها..."
                                    className="w-full rounded-xl p-3 text-sm text-white resize-none outline-none"
                                    style={{
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        minHeight: 80,
                                    }}
                                    rows={3}
                                />

                                <motion.button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="w-full mt-4 py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                                    style={{
                                        background: loading
                                            ? "rgba(139,92,246,0.3)"
                                            : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                                    }}
                                    whileHover={!loading ? { scale: 1.02 } : {}}
                                    whileTap={!loading ? { scale: 0.98 } : {}}
                                >
                                    {loading ? (
                                        <>
                                            <motion.div
                                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                            />
                                            جارفيس بيحلل...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-4 h-4" />
                                            اعطني الجملة
                                        </>
                                    )}
                                </motion.button>
                                {generateError && (
                                    <p className="mt-3 text-xs text-rose-300 text-right">{generateError}</p>
                                )}
                            </motion.div>
                        )}

                        {/* Step 3: Result */}
                        {step === "result" && result && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* Exit phrase */}
                                <div className="p-5 rounded-2xl mb-4"
                                    style={{
                                        background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(79,70,229,0.1))",
                                        border: "1px solid rgba(139,92,246,0.3)",
                                    }}>
                                    <p className="text-xs text-violet-400 font-bold uppercase tracking-wider mb-2">جملة الخروج</p>
                                    <p className="text-xl font-bold text-white leading-relaxed">{result.exitPhrase}</p>
                                </div>

                                {/* Breathing cue */}
                                <motion.button
                                    onClick={() => setBreatheActive(!breatheActive)}
                                    className="w-full p-4 rounded-2xl mb-3 text-right flex items-start gap-3"
                                    style={{
                                        background: breatheActive
                                            ? "rgba(14,165,233,0.15)"
                                            : "rgba(255,255,255,0.04)",
                                        border: `1px solid ${breatheActive ? "rgba(14,165,233,0.4)" : "rgba(255,255,255,0.08)"}`,
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Wind className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-sky-400 font-bold mb-1">تنفس</p>
                                        <p className="text-sm text-slate-300">{result.breathingCue}</p>
                                    </div>
                                </motion.button>

                                {/* Follow-up */}
                                <div className="p-4 rounded-2xl"
                                    style={{
                                        background: "rgba(255,255,255,0.03)",
                                        border: "1px solid rgba(255,255,255,0.06)",
                                    }}>
                                    <p className="text-xs text-slate-500 font-bold mb-1">خطوة تالية (اختياري)</p>
                                    <p className="text-sm text-slate-400">{result.followUpAction}</p>
                                </div>

                                <motion.button
                                    onClick={onClose}
                                    className="w-full mt-5 py-3 rounded-2xl font-bold text-white"
                                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                                    whileHover={{ background: "rgba(255,255,255,0.12)" }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    تمام، شكراً جارفيس 🫡
                                </motion.button>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
};
