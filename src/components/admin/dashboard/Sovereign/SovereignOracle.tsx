import { FC, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Brain, Eye, Terminal, Loader2, RefreshCw } from "lucide-react";
import { fetchSovereignInsights } from "@/services/adminApi";
import { useAdminState, type SovereignInsight } from "@/domains/admin/store/admin.store";

// Module-level guard: survives React Strict Mode's double-invoke
// (useRef gets reset on 2nd mount, this doesn't)
let _oracleFetching = false;

export const SovereignOracle: FC = () => {
  const { sovereignInsights, setSovereignInsights, sovereignStats, setSovereignStats } = useAdminState();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cooldown, setCooldown] = useState<number>(0);

  const refreshInsights = useCallback(async () => {
    if (cooldown > 0 || _oracleFetching) return;
    _oracleFetching = true;
    setIsRefreshing(true);
    try {
      const result = await fetchSovereignInsights();
      if (result) {
        if (result.insights && result.insights.length > 0) {
          setSovereignInsights(result.insights);
        }
        if (result.stats) {
          setSovereignStats(result.stats);
        }
        if (result.retryAfterSec) {
          setCooldown(result.retryAfterSec);
        } else if (!result.insights || result.insights.length === 0) {
          setCooldown(60); // Fallback: Prevent spam if nothing returned
        }
      } else {
        setCooldown(60); // Complete failure: step back.
      }
    } catch (error) {
      console.error("Failed to fetch Oracle insights", error);
      setCooldown(60);
    } finally {
      setIsRefreshing(false);
      _oracleFetching = false;
    }
  }, [setSovereignInsights, setSovereignStats, cooldown]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  // Run once on mount if we have no cached insights in state
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (sovereignInsights.length === 0) {
      void refreshInsights();
    }
  }, []);

  const sortedFriction = sovereignStats?.behavioralFriction?.filter(f => f.avgTimeSec > 30) || [];

  return (
    <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden flex flex-col h-full shadow-2xl transition-all">
      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-400">
          <Brain className="w-4 h-4" />
          <h3 className="text-xs font-black uppercase tracking-widest text-shadow-glow">توجيهات الأوراكل (Sovereign AI)</h3>
        </div>
        <div className="flex items-center gap-2">
           {isRefreshing && <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />}
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${isRefreshing ? 'bg-indigo-400 animate-pulse' : 'bg-indigo-500'}`} />
            <span className="text-[10px] font-bold text-indigo-500/50 uppercase tracking-tighter">
              {isRefreshing ? 'Thinking...' : 'Active Pulse'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative">
        {/* Behavioral Friction Section */}
        {sortedFriction.length > 0 && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-2xl mb-2"
            >
                <div className="flex items-center gap-2 mb-2 text-rose-400">
                    <Zap className="w-3 h-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">احتكاك السلوك (Behavioral Friction)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {sortedFriction.slice(0, 4).map(f => (
                        <div key={f.scenario} className="flex justify-between items-center text-[10px]">
                            <span className="opacity-60">{f.scenario}</span>
                            <span className={`font-mono font-bold ${f.avgTimeSec > 120 ? 'text-rose-400' : 'text-amber-400'}`}>
                                {f.avgTimeSec}s
                            </span>
                        </div>
                    ))}
                </div>
            </motion.div>
        )}

        <AnimatePresence mode="popLayout" initial={false}>
          {sovereignInsights.length > 0 ? (
            sovereignInsights.map((insight, idx) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                layout
                className={`p-3 rounded-2xl border transition-all hover:scale-[1.02] cursor-default group relative overflow-hidden ${
                  insight.type === 'truth' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10' :
                  insight.type === 'warning' ? 'bg-rose-500/5 border-rose-500/10 text-rose-400 hover:bg-rose-500/10' :
                  'bg-indigo-500/5 border-indigo-500/10 text-indigo-400 hover:bg-indigo-500/10'
                }`}
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity bg-gradient-to-br ${
                   insight.type === 'truth' ? 'from-emerald-500' :
                   insight.type === 'warning' ? 'from-rose-500' :
                   'from-indigo-500'
                }`} />

                <div className="flex items-start gap-3 relative z-10">
                  <div className="mt-1">
                    {insight.type === 'truth' && <Eye className="w-4 h-4 drop-shadow-glow-emerald" />}
                    {insight.type === 'warning' && <Zap className="w-4 h-4 drop-shadow-glow-rose" />}
                    {insight.type === 'opportunity' && <Sparkles className="w-4 h-4 drop-shadow-glow-indigo" />}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <p className="text-xs leading-relaxed font-bold tracking-tight">{insight.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] opacity-40 font-mono uppercase tracking-tighter">{insight.timestamp}</span>
                      <Terminal className="w-3 h-3 opacity-20 group-hover:opacity-40 transition-opacity" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-30 py-10 scale-90 grayscale">
               <Brain className="w-8 h-8 animate-pulse text-indigo-400" />
               <p className="text-[10px] font-black uppercase tracking-widest text-center">الارتباط المعرفي جارٍ الاستعداد له...</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-3 bg-white/2 px-4 border-t border-white/5">
        <button 
          onClick={() => void refreshInsights()}
          disabled={isRefreshing || cooldown > 0}
          className={`w-full py-2 ${cooldown > 0 ? 'bg-white/5 text-white/30' : 'bg-indigo-600/20 hover:bg-indigo-600/30'} active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group`}
        >
          {isRefreshing ? (
             <RefreshCw className="w-3 h-3 animate-spin" />
          ) : cooldown > 0 ? (
             <Loader2 className="w-3 h-3 animate-pulse" />
          ) : (
             <Zap className="w-3 h-3 group-hover:animate-bounce" />
          )}
          {cooldown > 0 ? `فترة تهدئة: ${cooldown}s` : 'توليد تحليل معمق (AI Pulse)'}
        </button>
      </div>
    </div>
  );
};
