import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Gavel, X, Shield, AlertTriangle, CheckCircle, BookOpen } from "lucide-react";

interface InnerCourtProps {
    isOpen: boolean;
    onClose: () => void;
}

type VerdictType = "innocent" | "self_defense" | "correction";

export const InnerCourt: FC<InnerCourtProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<"accusation" | "trial" | "verdict">("accusation");
    const [accusation, setAccusation] = useState("");
    const [verdict, setVerdict] = useState<VerdictType | null>(null);

    const handleStartTrial = () => {
        if (accusation.trim()) setStep("trial");
    };

    const handleVerdict = (v: VerdictType) => {
        setVerdict(v);
        setStep("verdict");
    };

    const reset = () => {
        setAccusation("");
        setVerdict(null);
        setStep("accusation");
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                                    <Scale className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-100 font-serif tracking-wide">محكمة الضمير</h2>
                                    <p className="text-xs text-slate-400 uppercase tracking-widest">Inner Court</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">

                            {/* Step 1: The Accusation */}
                            {step === "accusation" && (
                                <div className="space-y-6">
                                    <div className="text-center space-y-2">
                                        <Gavel className="w-12 h-12 text-slate-600 mx-auto opacity-50" />
                                        <h3 className="text-lg font-medium text-slate-200">ما هي التهمة الموجهة إليك؟</h3>
                                        <p className="text-sm text-slate-400 max-w-md mx-auto">
                                            سجل الشعور بالذنب أو الاتهام الداخلي الذي يلح عليك الآن.
                                        </p>
                                    </div>

                                    <textarea
                                        value={accusation}
                                        onChange={(e) => setAccusation(e.target.value)}
                                        placeholder="أشعر بالذنب لأنني..."
                                        className="w-full h-32 bg-slate-800 border-2 border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all resize-none text-lg text-right dir-rtl"
                                        dir="rtl"
                                    />

                                    <button
                                        onClick={handleStartTrial}
                                        disabled={!accusation.trim()}
                                        className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <Gavel className="w-5 h-5" />
                                        بدء المداولة
                                    </button>
                                </div>
                            )}

                            {/* Step 2: The Trial (Select Verdict) */}
                            {step === "trial" && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-right">
                                        <p className="text-xs text-slate-500 mb-1">التهمة:</p>
                                        <p className="text-lg text-slate-200 font-medium leading-relaxed">"{accusation}"</p>
                                    </div>

                                    <h3 className="text-center text-amber-500 font-serif text-lg">أصدر حكمك أيها القاضي</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Innocent */}
                                        <button
                                            onClick={() => handleVerdict("innocent")}
                                            className="group relative p-6 bg-slate-800 border-2 border-slate-700 hover:border-emerald-500 rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 text-right"
                                        >
                                            <div className="mb-3 p-3 bg-emerald-500/10 w-fit rounded-lg group-hover:bg-emerald-500/20">
                                                <Shield className="w-6 h-6 text-emerald-500" />
                                            </div>
                                            <h4 className="font-bold text-emerald-400 mb-1">بريء (Innocent)</h4>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                لم تخطئ. هذا الشعور وهمي أو مزروع من الخارج.
                                            </p>
                                        </button>

                                        {/* Self-Defense */}
                                        <button
                                            onClick={() => handleVerdict("self_defense")}
                                            className="group relative p-6 bg-slate-800 border-2 border-slate-700 hover:border-amber-500 rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/10 text-right"
                                        >
                                            <div className="mb-3 p-3 bg-amber-500/10 w-fit rounded-lg group-hover:bg-amber-500/20">
                                                <Scale className="w-6 h-6 text-amber-500" />
                                            </div>
                                            <h4 className="font-bold text-amber-400 mb-1">دفاع شرعي (Self-Defense)</h4>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                الفعل كان ضرورياً لحماية نفسك أو حدودك، حتى لو أزعج الآخرين.
                                            </p>
                                        </button>

                                        {/* Correction */}
                                        <button
                                            onClick={() => handleVerdict("correction")}
                                            className="group relative p-6 bg-slate-800 border-2 border-slate-700 hover:border-blue-500 rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 text-right"
                                        >
                                            <div className="mb-3 p-3 bg-blue-500/10 w-fit rounded-lg group-hover:bg-blue-500/20">
                                                <BookOpen className="w-6 h-6 text-blue-500" />
                                            </div>
                                            <h4 className="font-bold text-blue-400 mb-1">تصحيح (Corrective Measure)</h4>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                حدث خطأ، لكن الحل هو الإصلاح والتعلم، وليس الجلد الذاتي.
                                            </p>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Verdict Executed */}
                            {step === "verdict" && verdict && (
                                <div className="flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-500 py-8">

                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                        className="w-24 h-24 rounded-full flex items-center justify-center bg-slate-800 border-4 border-slate-700 shadow-2xl"
                                    >
                                        {verdict === "innocent" && <Shield className="w-12 h-12 text-emerald-500" />}
                                        {verdict === "self_defense" && <Scale className="w-12 h-12 text-amber-500" />}
                                        {verdict === "correction" && <CheckCircle className="w-12 h-12 text-blue-500" />}
                                    </motion.div>

                                    <div>
                                        <h3 className="text-3xl font-bold text-white mb-2 font-serif">حكم المحكمة</h3>
                                        <p className={`text-xl font-medium ${verdict === "innocent" ? "text-emerald-400" :
                                                verdict === "self_defense" ? "text-amber-400" : "text-blue-400"
                                            }`}>
                                            {verdict === "innocent" && "البراءة التامة"}
                                            {verdict === "self_defense" && "دفاع مشروع عن النفس"}
                                            {verdict === "correction" && "إصلاح فوري وإغلاق الملف"}
                                        </p>
                                    </div>

                                    <div className="max-w-md p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                        <p className="text-slate-300 leading-relaxed text-lg">
                                            {verdict === "innocent" && "أنت لم ترتكب خطأ. أسقط التهمة فوراً وتحرر من ثقلها."}
                                            {verdict === "self_defense" && "حماية حدودك ليست جريمة. أولويتك هي سلامك الداخلي."}
                                            {verdict === "correction" && "الخطأ درس، لا وصمة. أصلح ما يمكن إصلاحه وامضِ قدماً. لا وقت للندم."}
                                        </p>
                                    </div>

                                    <button
                                        onClick={onClose}
                                        className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold transition-colors"
                                    >
                                        رفعت الجلسة
                                    </button>
                                </div>
                            )}

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
