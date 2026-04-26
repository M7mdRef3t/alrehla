import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap as Sparkles, 
  Activity, 
  Eye, 
  ShieldCheck, 
  Brain, 
  ArrowRight,
  Terminal,
  Cpu,
  Unplug
} from "lucide-react";
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
    setLoading(true);
    const timer = setTimeout(() => {
      const realInsights = mode === "growth" 
        ? generateGrowthInsights(stats, growthMetrics)
        : generateResonanceInsights(stats);
      setInsights(realInsights);
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [stats, mode, growthMetrics]);

  return (
    <div className="mt-8 space-y-6 relative w-full" dir="rtl">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 relative">
        <div className="absolute -bottom-px right-0 w-24 h-[2px] bg-emerald-500/50 blur-[1px]" />
        
        <div className="flex items-center gap-4">
          <div className="p-2 bg-slate-900/50 border border-white/10 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <Terminal className="w-5 h-5 text-emerald-500/70" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] font-alexandria">
              {mode === "growth" ? "سجل التوسع (EXPANSION_LOG)" : "النبض الاستباقي (PROACTIVE_PULSE)"}
            </h3>
            <span className="text-[9px] font-mono text-slate-500 tracking-tighter uppercase">مستوى التشغيل: حارس ألفا (SENTINEL_ALPHA)</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-500/80 font-black tracking-widest">مسح_النظام_اللحظي</span>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-8 relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.01]"
            >
              {/* Scanline Effect */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] z-50" />
              
              <div className="relative w-20 h-20">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/20" 
                />
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 rounded-full border-t-2 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-emerald-500/40 animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-2 text-center">
                <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em] font-mono">جاري_رصد_الرنين...</p>
                <div className="flex items-center gap-2 justify-center">
                  <div className="h-1 w-2 bg-emerald-500/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-1 w-2 bg-emerald-500/30 animate-bounce" style={{ animationDelay: '200ms' }} />
                  <div className="h-1 w-2 bg-emerald-500/30 animate-bounce" style={{ animationDelay: '400ms' }} />
                </div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">فك تشفير الوعي الجمعي</p>
              </div>
            </motion.div>
          ) : (
            <div className="grid gap-3">
              {insights.map((insight, idx) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: idx * 0.08, ease: [0.23, 1, 0.32, 1] }}
                  className={`group relative grid grid-cols-[auto_1fr_auto] items-center gap-6 p-6 rounded-2xl border transition-all duration-500 ${
                    insight.urgency === 'high' ? 'bg-rose-500/[0.04] border-rose-500/20 hover:border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.05)]' :
                    insight.urgency === 'medium' ? 'bg-amber-500/[0.04] border-amber-500/20 hover:border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.05)]' :
                    'bg-slate-900/20 border-white/5 hover:border-white/15 hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Status Indicator Bar */}
                  <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 h-2/3 rounded-l-full transition-all duration-300 ${
                    insight.urgency === 'high' ? 'bg-rose-500' :
                    insight.urgency === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                  } group-hover:h-full`} />

                  {/* Meta Column */}
                  <div className="flex flex-col items-center gap-1.5 min-w-[70px] border-l border-white/10 pl-6 ml-2">
                    <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 font-black">
                      <span className="opacity-50 font-normal">T+</span>
                      {new Date(insight.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                      insight.urgency === 'high' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                      insight.urgency === 'medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 
                      'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    }`}>
                      {insight.urgency === 'high' ? 'عاجل' : insight.urgency === 'medium' ? 'متوسط' : 'روتيني'}
                    </div>
                  </div>

                  {/* Narrative Column */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                       <h4 className="text-[15px] font-black text-white font-alexandria tracking-tight group-hover:text-emerald-400 transition-colors">
                         {insight.title}
                       </h4>
                       <div className="h-px flex-grow bg-gradient-to-l from-white/10 to-transparent" />
                    </div>
                    <p className="text-sm font-bold text-slate-400 leading-relaxed font-tajawal pr-4 group-hover:text-slate-200 transition-colors">
                      {insight.narrative}
                    </p>
                  </div>

                  {/* Type Icon Column */}
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${
                    insight.type === 'emotional' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                    insight.type === 'analytical' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                    'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}>
                    {insight.type === 'emotional' ? <Sparkles className="w-5 h-5" /> :
                     insight.type === 'analytical' ? <Brain className="w-5 h-5" /> :
                     <ShieldCheck className="w-5 h-5" />}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
      
      {!loading && (
        <div className="pt-6 flex justify-between items-center text-[9px] font-mono text-slate-600 uppercase tracking-[0.3em] border-t border-white/5 relative">
          <div className="flex items-center gap-2">
            <Unplug className="w-3 h-3 text-slate-700" />
            <span>نهاية_البث_اللحظي</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-500/40">
             <span className="w-1 h-1 rounded-full bg-emerald-500/40 animate-ping" />
             <span className="font-black animate-pulse">_المؤشر_جاهز</span>
          </div>
        </div>
      )}
    </div>
  );
};

