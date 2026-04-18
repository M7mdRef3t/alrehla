import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getQuestionOfDay } from '@/services/dailyIntel';
import { generateDailySovereignState, type DailySovereignState } from '@/services/journeyAgent';
import { useMapState } from '@/modules/map/store/map.store';
import { saveDailyIntel, supabase } from '@/services/supabaseClient';
import { Sparkles, Save, ShieldCheck, Cpu, ArrowLeft } from 'lucide-react';

export const WarRoomWidget: React.FC = () => {
    const nodes = useMapState(s => s.nodes);
    const [question, setQuestion] = useState("");
    const [dailyState, setDailyState] = useState<DailySovereignState | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [answer, setAnswer] = useState("");
    const [isSaved, setIsSaved] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        // Fallback or static question
        setQuestion(getQuestionOfDay());
        
        supabase?.auth.getUser().then(({ data }) => {
            setUserId(data.user?.id || null);
        });
    }, []);

    const handleGenerateInsight = async () => {
        setIsGenerating(true);
        try {
            const state = await generateDailySovereignState(nodes);
            setDailyState(state);
        } catch (err) {
            console.error("Agent failed", err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!userId || !answer.trim()) return;

        // Simulate save (replace with actual Supabase call)
        await saveDailyIntel(userId, "daily_q", answer);
        setIsSaved(true);
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto my-8" dir="rtl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-teal-500/10 blur-xl rounded-3xl" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-6 rounded-3xl overflow-hidden"
            >
                {/* Radar Line Animation */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-teal-500/50 shadow-[0_0_10px_rgba(45,212,191,0.5)] animate-scan-line opacity-30" />

                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-teal-400" />
                        <h3 className="text-sm font-bold text-teal-500 uppercase tracking-wider">
                            غرفة عمليات السيادة (Journey Agent)
                        </h3>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {!isSaved ? (
                        <motion.div
                            key="content"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {!dailyState ? (
                                <div className="py-4">
                                    <h2 className="text-xl md:text-2xl text-slate-200 font-medium leading-relaxed mb-6">
                                        {question}
                                    </h2>
                                    <p className="text-xs text-slate-400 mb-6 font-medium">
                                        أو يمكنك استدعاء الجاسوس الآلي (Journey Agent) ليعطيك تقرير سيادي مبني على خريطتك الحالية.
                                    </p>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleGenerateInsight}
                                        disabled={isGenerating}
                                        className="flex items-center justify-center w-full gap-2 px-6 py-4 bg-slate-800/80 border border-teal-500/30 hover:bg-slate-800 hover:border-teal-400 text-teal-400 rounded-xl font-bold transition-all shadow-lg shadow-teal-900/10 disabled:opacity-50"
                                    >
                                        <Cpu className={`w-5 h-5 ${isGenerating ? "animate-pulse" : ""}`} />
                                        <span>{isGenerating ? "جاري مسح وعيك وخريطتك..." : "استطلاع الحالة السيادية (AI Insight)"}</span>
                                    </motion.button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="p-5 bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/20 rounded-2xl">
                                        <h4 className="text-xs font-black text-teal-500 mb-2 uppercase tracking-widest flex items-center gap-2">
                                            <Cpu className="w-4 h-4" /> تقرير الوعي
                                        </h4>
                                        <p className="text-lg text-slate-100 font-medium leading-relaxed">
                                            {dailyState.insight}
                                        </p>
                                    </div>

                                    <div className="p-5 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl">
                                        <h4 className="text-xs font-black text-amber-500 mb-2 uppercase tracking-widest flex items-center gap-2">
                                            <ArrowLeft className="w-4 h-4" /> تكتيك اليوم
                                        </h4>
                                        <p className="text-base text-amber-100 font-medium leading-relaxed">
                                            {dailyState.action}
                                        </p>
                                        {dailyState.focusNodeLabel && (
                                            <div className="mt-3 inline-block px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-xs font-bold text-amber-400">
                                                نقطة التركيز: {dailyState.focusNodeLabel}
                                            </div>
                                        )}
                                    </div>

                                    <textarea
                                        id="war-room-answer"
                                        name="warRoomAnswer"
                                        value={answer}
                                        onChange={(e) => setAnswer(e.target.value)}
                                        placeholder="ردك ايه على التقرير ده؟..."
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all resize-none h-24"
                                    />

                                    <div className="flex justify-end pt-2">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleSave}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-full font-medium transition-colors shadow-lg shadow-teal-900/20"
                                        >
                                            <Save className="w-4 h-4" />
                                            <span>تأمين الرد</span>
                                        </motion.button>
                                    </div>
                                </div>
                            )}
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
                                تم تأمين وعيك
                            </h3>
                            <p className="text-slate-400">
                                استعد لرحلة النهاردة بوعي سيادي كامل.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
