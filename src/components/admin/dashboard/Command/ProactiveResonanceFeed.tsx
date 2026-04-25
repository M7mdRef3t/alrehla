import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap as Sparkles, Activity, Eye, ShieldCheck, Brain, ArrowRight } from "lucide-react";
import { CollapsibleSection } from "../../ui/CollapsibleSection";
import { generateResonanceInsights, generateGrowthInsights } from "./resonanceEngine";
import type { OverviewStats } from "@/services/admin/adminTypes";

export interface ResonanceInsight {
  id: string;
  type: "emotional" | "analytical" | "actionable";
  title: string;
  narrative: string;
  timestamp: number;
  urgency: "low" | "medium" | "high";
}

interface ProactiveResonanceFeedProps {
  stats: OverviewStats | null;
  mode?: "sentient" | "growth";
  growthMetrics?: any;
}

export const ProactiveResonanceFeed: FC<ProactiveResonanceFeedProps> = ({ stats, mode = "sentient", growthMetrics }) => {
  const [insights, setInsights] = useState<ResonanceInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate thinking/reasoning lag for "Sentient" feel
    setLoading(true);
    const timer = setTimeout(() => {
      const realInsights = mode === "growth" 
        ? generateGrowthInsights(stats, growthMetrics)
        : generateResonanceInsights(stats);
      setInsights(realInsights);
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [stats, mode, growthMetrics]);

  return (
    <div className="mt-8 space-y-4 relative w-full">
      <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
        {mode === "growth" ? <Sparkles className="w-5 h-5 text-rose-500" /> : <Activity className="w-5 h-5 text-amber-500" />}
        {mode === "growth" ? "رنين الجذب والتوسع" : "النبض الاستباقي للوعي"}
      </h3>
      <AnimatePresence>
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 gap-4"
          >
            <div className="w-12 h-12 rounded-full border-b-2 border-emerald-500 animate-spin" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">
              Analyzing collective consciousness...
            </p>
          </motion.div>
        ) : (
          insights.map((insight, idx) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-6 rounded-3xl border bg-slate-900/40 relative overflow-hidden group hover:bg-slate-900/60 transition-all ${
                insight.urgency === 'high' ? 'border-rose-500/30' :
                insight.urgency === 'medium' ? 'border-amber-500/30' :
                'border-emerald-500/30'
              }`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full -z-10 ${
                insight.urgency === 'high' ? 'bg-rose-500/20' :
                insight.urgency === 'medium' ? 'bg-amber-500/20' :
                'bg-emerald-500/20'
              }`} />
              
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-2 mb-3">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      {new Date(insight.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      insight.type === 'emotional' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      insight.type === 'analytical' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {insight.type}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">{insight.title}</h3>
                  <p className="text-sm font-bold text-slate-300 leading-relaxed">
                    {insight.narrative}
                  </p>
                </div>
                <div className={`p-4 rounded-2xl border shrink-0 ${
                  insight.urgency === 'high' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                  insight.urgency === 'medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                  'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                }`}>
                  {insight.type === 'emotional' ? <Sparkles className="w-6 h-6" /> :
                   insight.type === 'analytical' ? <Brain className="w-6 h-6" /> :
                   <ShieldCheck className="w-6 h-6" />}
                </div>
              </div>

              {insight.urgency === 'high' && (
                <div className="mt-6 flex justify-end">
                  <button className="flex items-center gap-2 px-6 py-3 bg-rose-500/20 text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all group/btn">
                    <span>تفعيل بروتوكول الرحمة (عزل)</span>
                    <ArrowRight className="w-3 h-3 group-hover/btn:-translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
};
