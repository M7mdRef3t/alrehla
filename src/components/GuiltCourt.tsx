/**
 * Guilt Court  حة اشعر باذب ️
 * ==========================================
 * اجة تفاعة اضاة تف شاعر اذب غر اطة.
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
                <div className="w-12 h-12 rounded-2xl bg-[var(--soft-teal)]/10 flex items-center justify-center border border-[var(--soft-teal)]">
                    <Gavel className="w-6 h-6 text-[var(--soft-teal)]" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white">حة اشعر باذب</h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">برت تف اذب</p>
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
                                <h2 className="text-xl font-bold text-white mb-4 text-right">ا  "اتة" ات جا  ضر</h2>
                                <textarea
                                    className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-4 text-slate-200 focus:border-[var(--soft-teal)] transition-all outline-none text-right text-lg"
                                    placeholder="ثا: أشعر باذب أ  أرد ع اتصا اد اسء..."
                                    value={charge}
                                    onChange={(e) => setCharge(e.target.value)}
                                />
                                <button
                                    onClick={startTrial}
                                    className="w-full mt-6 py-4 bg-[var(--soft-teal)] hover:bg-[var(--soft-teal)]/30 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 group"
                                >
                                    بدأ احاة
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                            <p className="text-center text-slate-500 text-sm">
                                "ح ا تجا اصت اداخ ح ضع تحت جر اط."
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
                                    <h3 className="font-bold text-rose-400 text-sm uppercase mb-1">صت ااد اداخ</h3>
                                    <p className="text-slate-300">"{charge}"</p>
                                </div>
                            </div>

                            <div className="glass-card p-8 border-white/5 space-y-6">
                                <p className="text-lg text-white font-medium leading-relaxed text-right">
                                    ذا اصت  أ "اسٍ" أ "جاحد".   سأت فس:  ا فر ب اسة ب **تأ حدد** حفاظ ع بائ
                                </p>
                                <div className="flex justify-between gap-4">
                                    <button
                                        onClick={() => setStage("defense")}
                                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-[var(--soft-teal)] transition-all"
                                    >
                                        استدعاء دفاع جارفس
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
                                <h2 className="text-2xl font-black text-white">دفاع جارفس ااستراتج</h2>
                                <ShieldCheck className="w-8 h-8 text-teal-400" />
                            </div>

                            <div className="space-y-4">
                                <DefenseArgument
                                    title="ا احفاظ ع اطاة"
                                    text="اعاات ات تستزف طات د تباد صح  ثب سداء. حات فس ست جرة ب فرضة استراتجة."
                                />
                                <DefenseArgument
                                    title="بدأ اسؤة افردة"
                                    text="أت سؤ ع استرار ا ع تدئة خاف اآخر ااتجة ع س اسء."
                                />
                            </div>

                            <button
                                onClick={() => setStage("verdict")}
                                className="w-full mt-8 py-4 bg-teal-500 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2"
                            >
                                اط باح
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
                            <div className="w-24 h-24 rounded-full bg-[var(--soft-teal)]/20 border border-[var(--soft-teal)] flex items-center justify-center mx-auto mb-8 animate-pulse">
                                <Gavel className="w-12 h-12 text-[var(--soft-teal)]" />
                            </div>

                            <h1 className="text-4xl font-black text-white tracking-tight">ح احة: براءة استراتجة</h1>

                            <div className="bg-slate-900/60 p-8 rounded-3xl border border-white/5 backdrop-blur-xl">
                                <p className="text-xl text-slate-300 leading-relaxed font-medium">
                                    "باء ع اأدة ت تصف شعر باذب  **أ **. أت ا تؤذ أحدا أت فط تتف ع إذاء فس."
                                </p>
                            </div>

                            <button
                                onClick={() => window.location.reload()}
                                className="px-10 py-4 bg-white/5 border border-white/10 rounded-full text-slate-400 font-bold hover:bg-white/10 transition-all"
                            >
                                اعدة غرفة اعات
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



