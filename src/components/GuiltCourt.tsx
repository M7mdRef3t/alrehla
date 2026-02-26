/**
 * Guilt Court — محكمة الشعور بالذنب ⚖️
 * ==========================================
 * واجهة تفاعلية لمقاضاة وتفكيك مشاعر الذنب غير المنطقية.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gavel, ShieldCheck, Scale, AlertCircle, ArrowRight } from "lucide-react";
import { soundManager } from "../services/soundManager";

type TrialStage = "prosecution" | "defense" | "verdict";

export const GuiltCourt: React.FC = () => {
    const [charge, setCharge] = useState("");
    const [stage, setStage] = useState<TrialStage | "entry">("entry");

    const startTrial = () => {
        if (!charge.trim()) return;
        soundManager.playClick();
        setStage("prosecution");
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-6 flex flex-col font-sans">
            <header className="flex items-center gap-4 mb-12">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center border border-[var(--color-primary)]">
                    <Gavel className="w-6 h-6 text-[var(--color-primary)]" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white">محكمة الشعور بالذنب</h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">بروتوكول تفكيك الذنب</p>
                </div>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full">
                <AnimatePresence mode="wait">
                    {stage === "entry" && (
                        <motion.div
                            key="entry"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                                <h2 className="text-xl font-bold text-white mb-4 text-right">ما هي "التهمة" التي يوجهها لك ضميرك؟</h2>
                                <textarea
                                    className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-4 text-slate-200 focus:border-[var(--color-primary)] transition-all outline-none text-right text-lg"
                                    placeholder="مثال: أشعر بالذنب لأني لم أرد على اتصال والدي المسيء..."
                                    value={charge}
                                    onChange={(e) => setCharge(e.target.value)}
                                />
                                <button
                                    onClick={startTrial}
                                    className="w-full mt-6 py-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/30 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 group"
                                >
                                    بدأ المحاكمة
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                            <p className="text-center text-slate-500 text-sm">
                                "نحن لا نتجاهل الصوت الداخلي، نحن نضعه تحت مجهر المنطق."
                            </p>
                        </motion.div>
                    )}

                    {stage === "prosecution" && (
                        <motion.div
                            key="prosecution"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="space-y-6"
                        >
                            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-rose-400 mt-1" />
                                <div>
                                    <h3 className="font-bold text-rose-400 text-sm uppercase mb-1">صوت الناقد الداخلي</h3>
                                    <p className="text-slate-300">"{charge}"</p>
                                </div>
                            </div>

                            <div className="glass-card p-8 border-white/5 space-y-6">
                                <p className="text-lg text-white font-medium leading-relaxed text-right">
                                    هذا الصوت يقول أنك "قاسٍ" أو "جاحد". لكن هل سألت نفسك: هل هناك فرق بين القسوة وبين **تأمين حدودك** للحفاظ على بقائك؟
                                </p>
                                <div className="flex justify-between gap-4">
                                    <button
                                        onClick={() => setStage("defense")}
                                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-[var(--color-primary)] transition-all"
                                    >
                                        استدعاء دفاع جارفيس
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {stage === "defense" && (
                        <motion.div
                            key="defense"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6 text-right"
                        >
                            <div className="flex items-center gap-3 justify-end mb-6">
                                <h2 className="text-2xl font-black text-white">دفاع جارفيس الاستراتيجي</h2>
                                <ShieldCheck className="w-8 h-8 text-teal-400" />
                            </div>

                            <div className="space-y-4">
                                <DefenseArgument
                                    title="قانون الحفاظ على الطاقة"
                                    text="العلاقات التي تستنزف طاقتك دون تبادل صحي هي ثقوب سوداء. حمايتك لنفسك ليست جريمة، بل فريضة استراتيجية."
                                />
                                <DefenseArgument
                                    title="مبدأ المسؤولية الفردية"
                                    text="أنت مسؤول عن استقرارك، لا عن تهدئة مخاوف الآخرين الناتجة عن سلوكهم المسيء."
                                />
                            </div>

                            <button
                                onClick={() => setStage("verdict")}
                                className="w-full mt-8 py-4 bg-teal-500 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2"
                            >
                                النطق بالحكم
                                <Scale className="w-5 h-5" />
                            </button>
                        </motion.div>
                    )}

                    {stage === "verdict" && (
                        <motion.div
                            key="verdict"
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-10"
                        >
                            <div className="w-24 h-24 rounded-full bg-[var(--color-primary)]/20 border border-[var(--color-primary)] flex items-center justify-center mx-auto mb-8 animate-pulse">
                                <Gavel className="w-12 h-12 text-[var(--color-primary)]" />
                            </div>

                            <h1 className="text-4xl font-black text-white tracking-tight">حكم المحكمة: براءة استراتيجية</h1>

                            <div className="bg-slate-900/60 p-8 rounded-3xl border border-white/5 backdrop-blur-xl">
                                <p className="text-xl text-slate-300 leading-relaxed font-medium">
                                    "بناءً على الأدلة، تم تصنيف شعورك بالذنب كـ **ألم نمو**. أنت لا تؤذي أحداً، أنت فقط تتوقف عن إيذاء نفسك."
                                </p>
                            </div>

                            <button
                                onClick={() => window.location.reload()}
                                className="px-10 py-4 bg-white/5 border border-white/10 rounded-full text-slate-400 font-bold hover:bg-white/10 transition-all"
                            >
                                العودة لغرفة العمليات
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

const DefenseArgument = ({ title, text }: { title: string, text: string }) => (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-teal-500/20 transition-all">
        <h3 className="font-black text-teal-400 text-sm mb-2 uppercase tracking-wide">{title}</h3>
        <p className="text-slate-300 leading-relaxed font-medium">{text}</p>
    </div>
);


