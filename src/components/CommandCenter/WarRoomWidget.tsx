import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getQuestionOfDay } from '../../services/dailyIntel';
import { saveDailyIntel, supabase } from '../../services/supabaseClient';
import { Sparkles, Save, ShieldCheck } from 'lucide-react';

export const WarRoomWidget: React.FC = () => {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [isSaved, setIsSaved] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        setQuestion(getQuestionOfDay());
        supabase?.auth.getUser().then(({ data }) => {
            setUserId(data.user?.id || null);
        });
    }, []);

    const handleSave = async () => {
        if (!userId || !answer.trim()) return;

        // Simulate save (replace with actual Supabase call)
        await saveDailyIntel(userId, "daily_q", answer);
        setIsSaved(true);

        // Play tactical sound if available
        // soundManager.playOptimistic(); 
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto my-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-teal-500/10 blur-xl rounded-3xl" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-6 rounded-3xl overflow-hidden"
            >
                {/* Radar Line Animation */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-teal-500/50 shadow-[0_0_10px_rgba(45,212,191,0.5)] animate-scan-line opacity-30" />

                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-teal-400" />
                    <h3 className="text-sm font-bold text-teal-500 uppercase tracking-wider">
                        مهمة استطلاع يومية
                    </h3>
                </div>

                <AnimatePresence mode="wait">
                    {!isSaved ? (
                        <motion.div
                            key="question"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <h2 className="text-xl md:text-2xl text-slate-200 font-medium leading-relaxed mb-6">
                                {question}
                            </h2>

                            <textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                placeholder="اكتب تقريرك الميداني هنا..."
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all resize-none h-32"
                            />

                            <div className="mt-4 flex justify-end">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-full font-medium transition-colors shadow-lg shadow-teal-900/20"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>تأمين التقرير</span>
                                </motion.button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-8"
                        >
                            <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck className="w-8 h-8 text-teal-400" />
                            </div>
                            <h3 className="text-xl text-white font-bold mb-2">
                                تم تأمين البيانات
                            </h3>
                            <p className="text-slate-400">
                                تقريرك وصل لغرفة العمليات. استعد للمهمة الجاية يا قائد.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
