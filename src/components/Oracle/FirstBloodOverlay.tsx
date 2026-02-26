import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Hammer, Flame, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { HiveEngine, ProvenPath } from '../../services/hiveEngine';

interface FirstBloodProps {
    oracleId: string;
    onComplete: () => void;
}

/**
 * 🦅 THE FIRST BLOOD OVERLAY
 * Prevents "The Ghost Town Trap" and calibrates new Oracles via "Task Zero".
 */
export const FirstBloodOverlay: React.FC<FirstBloodProps> = ({ oracleId, onComplete }) => {
    const [step, setStep] = useState<'welcome' | 'task' | 'judgment'>('welcome');
    const [judgment, setJudgment] = useState<'approve' | 'flag' | null>(null);

    // THE CALIBRATION CASE (Synthetic Trajectory)
    const taskZero: ProvenPath = {
        id: 'synthetic-task-zero',
        title: 'Map Escape Protocol (Sovereign_Initiate_73)',
        initial_vector: { rs: 0.4, av: 0.6, bi: 0.8, se: 0.2, cb: 0.9, timestamp: Date.now() },
        mission_data: {
            daily_missions: [
                { day: 1, actionable_task: "Set a boundary with your most difficult color (Friction Zone)." }
            ]
        },
        tags: ['PSYCHOLOGICAL_BYPASS', 'GHOST_MODE'],
    };

    const handleJudgment = async (type: 'approve' | 'flag') => {
        setJudgment(type);
        setStep('judgment');

        // Calibrate initially - if they flag it (the correct choice), they get better initial rep
        if (type === 'flag') {
            await HiveEngine.updateOracleReputation(oracleId, 5); // Bonus for correct calibration
        } else {
            await HiveEngine.updateOracleReputation(oracleId, 0); // Neutral start
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950 overflow-y-auto font-sans text-slate-100 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <AnimatePresence mode="wait">
                    {step === 'welcome' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center space-y-8"
                        >
                            <div className="relative inline-block">
                                <Shield className="w-24 h-24 text-amber-500 mx-auto" />
                                <motion.div
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full"
                                />
                            </div>

                            <div className="space-y-4">
                                <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-amber-200 to-amber-600">
                                    أهلاً بك في مجلس الحكماء
                                </h1>
                                <p className="text-xl text-slate-400 leading-relaxed max-w-lg mx-auto">
                                    السرب دلوقتي في انتظار حكمك الأول.
                                    منصبك كـ <span className="text-amber-500 font-bold">أوراكل</span> مش مجرد رتبة، دي مسؤولية حماية وعي الجماعة.
                                </p>
                            </div>

                            <button
                                onClick={() => setStep('task')}
                                className="group relative px-12 py-5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xl uppercase tracking-tighter rounded-2xl transition-all shadow-[0_0_40px_rgba(245,158,11,0.3)]"
                            >
                                الترقية تبدأ الآن
                                <ArrowRight className="inline-block ml-3 group-hover:translate-x-2 transition-transform" />
                            </button>
                        </motion.div>
                    )}

                    {step === 'task' && (
                        <motion.div
                            key="task"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="space-y-8"
                        >
                            <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                                <Hammer className="w-8 h-8 text-amber-500" />
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">القرار السيادي الأول: حالة للمعايرة</h2>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Synthetic Trajectory Audit // Task Zero</p>
                                </div>
                            </div>

                            <div className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 p-8 space-y-6">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">تقرير الرائد Initiate_73</span>
                                    <p className="text-lg font-medium text-slate-300 italic">
                                        "كنت بغير ألوان الدايرة بتاعتي بقالي 3 أيام بس مش حاسس بأي تغيير في ضغطي العصبي.. فـ غيرت اللون للأزرق عشان مريح أكتر"
                                    </p>
                                </div>

                                <div className="p-6 bg-slate-950/60 rounded-3xl border border-white/5 space-y-3">
                                    <span className="text-[10px] font-black text-[var(--color-primary)] uppercase">المهمة اللي كانت مطلوبة:</span>
                                    <p className="text-sm text-slate-400">"{taskZero.mission_data.daily_missions[0].actionable_task}"</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                    <button
                                        onClick={() => handleJudgment('approve')}
                                        className="py-4 bg-slate-800 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        اعتماد المسار
                                    </button>
                                    <button
                                        onClick={() => handleJudgment('flag')}
                                        className="py-4 bg-slate-800 hover:bg-red-600/40 text-red-400 border border-white/5 rounded-2xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2"
                                    >
                                        <AlertCircle className="w-4 h-4" />
                                        رفض (هروب نفسي)
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 'judgment' && (
                        <motion.div
                            key="judgment"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-8"
                        >
                            {judgment === 'flag' ? (
                                <>
                                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                                        <Flame className="w-10 h-10 text-emerald-500" />
                                    </div>
                                    <div className="space-y-4">
                                        <h2 className="text-3xl font-black text-white">نظرة ثاقبة يا أوراكل!</h2>
                                        <p className="text-slate-400 leading-relaxed px-12">
                                            الرائد ده كان بيستخدم "الألوان" كمهرب مريح بدلاً من مواجهة الصراع الحقيقي. برفضك ده، إنت حميت السرب من تراكم "الضوضاء" (Noise).
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                                        <AlertCircle className="w-10 h-10 text-red-500" />
                                    </div>
                                    <div className="space-y-4">
                                        <h2 className="text-3xl font-black text-white">الرحمة مش دايما تطور</h2>
                                        <p className="text-slate-400 leading-relaxed px-12">
                                            الحالة دي كانت "هروب نفسي" صريح. كـ أوراكل، لازم تتعلم تفرق بين "الراحة" و "التطور". السرب بيعتمد عليك عشان تكون "المراقب الصارم".
                                        </p>
                                    </div>
                                </>
                            )}

                            <button
                                onClick={onComplete}
                                className="px-12 py-5 bg-white text-slate-950 font-black text-lg uppercase tracking-tight rounded-2xl hover:scale-105 transition-transform"
                            >
                                دخول مجلس الحكماء الحقيقي
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

