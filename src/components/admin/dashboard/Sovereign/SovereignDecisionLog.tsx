import { FC, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Brain, Zap, Clock, CheckCircle2, XCircle, FileWarning } from "lucide-react";
import { supabase, isSupabaseReady } from "@/services/supabaseClient";
import type { AIDecision } from "@/ai/decision-framework";
import { decisionEngine } from "@/ai/decision-framework";

export const SovereignDecisionLog: FC = () => {
    const [decisions, setDecisions] = useState<AIDecision[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadDecisions = async () => {
        setIsLoading(true);
        try {
            if (isSupabaseReady && supabase) {
                const { data, error } = await supabase
                    .from('dawayir_ai_decisions')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .limit(20);
                
                if (!error && data) {
                    setDecisions(data.map(d => ({
                        id: d.id,
                        type: d.type as any,
                        timestamp: Number(d.timestamp),
                        reasoning: d.reasoning,
                        payload: d.payload,
                        outcome: d.outcome,
                        approvedBy: d.approved_by,
                        executedAt: d.executed_at ? Number(d.executed_at) : undefined
                    })));
                } else if (error) {
                    console.error("Failed to fetch decisions", error);
                }
            } else {
                // Fallback to local DecisionEngine
                setDecisions(decisionEngine.getRecentDecisions().reverse());
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDecisions();
        const interval = setInterval(loadDecisions, 10000); // 10s poll

        let subscription: any;
        if (isSupabaseReady && supabase) {
            subscription = supabase.channel('ai-decisions-log')
              .on('postgres_changes', { event: '*', schema: 'public', table: 'dawayir_ai_decisions' }, () => {
                 loadDecisions();
              })
              .subscribe();
        }

        return () => {
            clearInterval(interval);
            if (subscription) {
               supabase?.removeChannel(subscription);
            }
        };
    }, []);

    const handleApproval = async (id: string, approved: boolean) => {
        decisionEngine.resolveApproval(id, approved);
        // Optimistic update
        setDecisions(prev => prev.map(d => d.id === id ? { ...d, outcome: approved ? "executed" : "rejected", approvedBy: "admin", executedAt: approved ? Date.now() : undefined } : d));
    };

    return (
        <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden flex flex-col h-full shadow-2xl transition-all">
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400">
                    <Brain className="w-4 h-4" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-shadow-glow">سجل قرارات الذكاء الاصطناعي (AI Decisions)</h3>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-indigo-400 animate-pulse' : 'bg-indigo-500'}`} />
                    <span className="text-[10px] font-bold text-indigo-500/50 uppercase tracking-tighter">
                        {isLoading ? 'Syncing...' : 'Live'}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {decisions.length > 0 ? (
                        decisions.map((decision, idx) => (
                            <motion.div
                                key={decision.id || idx}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`p-4 rounded-2xl border transition-all ${
                                    decision.outcome === 'pending_approval' ? 'bg-amber-500/5 border-amber-500/20' :
                                    decision.outcome === 'rejected' || decision.outcome === 'forbidden' ? 'bg-rose-500/5 border-rose-500/20' :
                                    'bg-indigo-500/5 border-indigo-500/10'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            {decision.outcome === 'pending_approval' && <Clock className="w-4 h-4 text-amber-500 animate-pulse" />}
                                            {decision.outcome === 'executed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                            {(decision.outcome === 'rejected' || decision.outcome === 'forbidden') && <XCircle className="w-4 h-4 text-rose-500" />}
                                            <h4 className={`text-sm font-black uppercase tracking-widest ${
                                                decision.outcome === 'pending_approval' ? 'text-amber-500' :
                                                decision.outcome === 'executed' ? 'text-emerald-500' :
                                                'text-rose-500'
                                            }`}>
                                                {decision.type.replace(/_/g, " ")}
                                            </h4>
                                        </div>
                                        <p className="text-xs text-white/70 font-bold leading-relaxed">{decision.reasoning}</p>
                                        <span className="text-[9px] text-white/30 font-mono mt-1">
                                            {new Date(decision.timestamp).toLocaleString("en-US")}
                                        </span>
                                    </div>
                                </div>

                                {decision.outcome === 'pending_approval' && (
                                    <div className="mt-4 flex items-center gap-2">
                                        <button 
                                            onClick={() => handleApproval(decision.id!, true)}
                                            className="flex-1 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            صدّق على القرار
                                        </button>
                                        <button 
                                            onClick={() => handleApproval(decision.id!, false)}
                                            className="flex-1 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            انقض القرار
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center opacity-30">
                            <Brain className="w-10 h-10 mb-2 text-indigo-400" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-center">لا توجد قرارات مسجلة حتى الآن</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
