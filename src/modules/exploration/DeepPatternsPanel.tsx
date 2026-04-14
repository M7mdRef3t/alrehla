import { logger } from "@/services/logger";
import { FC, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Network, ChevronRight, Activity, AlertCircle } from "lucide-react";
import { supabase } from "@/services/supabaseClient";

interface ContextualInsight {
    id: string;
    insight_type: string;
    title: string;
    description: string;
    confidence_score: number;
    surfaced_at: string;
}

export const DeepPatternsPanel: FC = () => {
    const [insights, setInsights] = useState<ContextualInsight[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const fetchInsights = async () => {
        try {
            const { data: { session } } = await supabase!.auth.getSession();
            const res = await fetch('/api/contextual-insights', {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setInsights(data);
            }
        } catch (err) {
            logger.error(err);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, []);

    if (insights.length === 0) return null;

    return (
        <div className="w-full max-w-[38rem] mx-auto mt-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 rounded-3xl bg-slate-950/80 border border-purple-500/30 backdrop-blur-xl hover:bg-slate-900/60 transition-all border-l-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.1)] group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-30 pointer-events-none" />
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                        <Network className="w-4 h-4" />
                    </div>
                    <div className="text-right relative z-10">
                        <p className="text-[15px] font-black text-slate-100 tracking-tight">الأنماط العميقة (Deep Patterns)</p>
                        <p className="text-[10px] text-slate-500 font-bold">تحليل العلاقات الخفية بين دواير حياتك</p>
                    </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-3"
                    >
                        <div className="space-y-4 px-2 pb-6">
                            {insights.map((insight) => (
                                <motion.div
                                    key={insight.id}
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="p-6 rounded-[2.5rem] bg-slate-950/60 border border-white/5 backdrop-blur-md relative overflow-hidden group/item shadow-xl"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.03] to-purple-500/[0.03] opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                    {/* Confidence Indicator */}
                                    <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                                        <Activity className="w-3 h-3 text-cyan-400" />
                                        <span className="text-[9px] font-black text-cyan-400">ثقة {Math.round(insight.confidence_score * 100)}%</span>
                                    </div>

                                    <div className="flex items-start gap-4 justify-end text-right">
                                        <div className="flex-1">
                                            <h4 className="text-[13px] font-black text-cyan-100 mb-2">{insight.title}</h4>
                                            <p className="text-[12px] text-slate-400 leading-relaxed font-medium">
                                                {insight.description}
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 rounded-2xl bg-cyan-500/5 flex items-center justify-center shrink-0 border border-cyan-500/10 group-hover/item:border-cyan-500/30 transition-all">
                                            <Brain className="w-5 h-5 text-cyan-400/70" />
                                        </div>
                                    </div>

                                    {/* Footer / Context Date */}
                                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5">
                                                <AlertCircle className="w-3 h-3 text-cyan-500/50" />
                                                <span className="text-[9px] text-slate-500 uppercase tracking-tighter">تحديث نصف أسبوعي</span>
                                            </div>
                                        </div>
                                        <span className="text-[9px] text-slate-600 font-bold">
                                            {new Date(insight.surfaced_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>

                                    {/* Grid background effect */}
                                    <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] pointer-events-none" />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
