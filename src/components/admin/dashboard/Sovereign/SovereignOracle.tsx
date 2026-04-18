import { FC, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Brain, Eye, Terminal, Loader2, RefreshCw, Copy, Check } from "lucide-react";
import { fetchSovereignInsights } from "@/services/adminApi";
import { useAdminState, type SovereignInsight } from "@/domains/admin/store/admin.store";
import { getAuthToken } from "@/domains/auth/store/auth.store";

// Module-level guard: survives React Strict Mode's double-invoke
// (useRef gets reset on 2nd mount, this doesn't)
let _oracleFetching = false;

export const SovereignOracle: FC = () => {
  const { 
    sovereignInsights, 
    setSovereignInsights, 
    sovereignStats, 
    setSovereignStats,
    insightResolutions,
    updateInsightResolution
  } = useAdminState();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [isSending, setIsSending] = useState<Record<string, boolean>>({});
  const [sendSuccess, setSendSuccess] = useState<Record<string, boolean>>({});

  const submitToOracle = async (insightId: string, comment: string, currentRes: any) => {
    if (!comment.trim() || isSending[insightId]) return;
    setIsSending(prev => ({ ...prev, [insightId]: true }));
    setSendSuccess(prev => ({ ...prev, [insightId]: false }));

    try {
      const response = await fetch("/api/admin/sovereign/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ insightId, comment })
      });
      
      const res = await response.json();
      
      if (res?.ok) {
        setSendSuccess(prev => ({ ...prev, [insightId]: true }));
        updateInsightResolution(insightId, { ...currentRes, comment, isSent: true, status: 'fixed' });
        
        // keep the success message for 3 seconds
        setTimeout(() => {
          setSendSuccess(prev => ({ ...prev, [insightId]: false }));
        }, 5000);
      }
    } catch (e) {
      console.error("Failed to submit feedback to Oracle", e);
    } finally {
      setIsSending(prev => ({ ...prev, [insightId]: false }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, insightId: string, comment: string, currentRes: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitToOracle(insightId, comment, currentRes);
    }
  };

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
        setCooldown(120); // Complete failure: step back.
      }
    } catch (error: any) {
      console.error("Failed to fetch Oracle insights", error);
      setCooldown(300);
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

  useEffect(() => {
    if (sovereignInsights.length === 0) {
      void refreshInsights();
    }
  }, []);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStatusUpdate = (id: string, status: 'pending' | 'working' | 'fixed') => {
    const current = insightResolutions[id] || { comment: "" };
    updateInsightResolution(id, { ...current, status });
  };

  const handleCommentUpdate = (id: string, comment: string) => {
    const current = insightResolutions[id] || { status: 'pending' };
    updateInsightResolution(id, { ...current, comment });
  };

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
              BETA: Local Sovereignty
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative">
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
            sovereignInsights.map((insight, idx) => {
              const res = insightResolutions[insight.id] || { status: 'pending', comment: "" };
              
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  layout
                  className={`p-3 rounded-2xl border transition-all cursor-default group relative overflow-hidden ${
                    res.status === 'fixed' ? 'bg-emerald-500/10 border-emerald-500/30' :
                    res.status === 'working' ? 'bg-amber-500/10 border-amber-500/30' :
                    insight.type === 'truth' ? 'bg-emerald-500/5 border-emerald-500/10' :
                    insight.type === 'warning' ? 'bg-rose-500/5 border-rose-500/10' :
                    'bg-indigo-500/5 border-indigo-500/10'
                  } ${res.status === 'fixed' ? 'opacity-80 grayscale-[0.3]' : ''}`}
                >
                  <div className="flex items-start gap-3 relative z-10">
                    <div className="mt-1">
                      {insight.type === 'truth' && <Eye className="w-4 h-4 drop-shadow-glow-emerald text-emerald-400" />}
                      {insight.type === 'warning' && <Zap className="w-4 h-4 drop-shadow-glow-rose text-rose-400" />}
                      {insight.type === 'opportunity' && <Sparkles className="w-4 h-4 drop-shadow-glow-indigo text-indigo-400" />}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className={`text-xs leading-relaxed font-bold tracking-tight ${
                        res.status === 'fixed' ? 'line-through opacity-50' : 'text-white'
                      }`}>{insight.message}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] opacity-40 font-mono uppercase tracking-tighter">{insight.timestamp}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(insight.id, insight.message)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                          >
                            {copiedId === insight.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 opacity-40 group-hover:opacity-100" />}
                          </button>
                          
                          {/* Resolution Toggles */}
                          <div className="flex items-center gap-1 bg-black/30 p-0.5 rounded-lg border border-white/5">
                            <button
                              onClick={() => handleStatusUpdate(insight.id, 'working')}
                              className={`p-1 rounded-md transition-all ${res.status === 'working' ? 'bg-amber-500 text-black' : 'opacity-30 hover:opacity-60'}`}
                              title="جاري العمل محلياً"
                            >
                              <Loader2 className={`w-3 h-3 ${res.status === 'working' ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(insight.id, 'fixed')}
                              className={`p-1 rounded-md transition-all ${res.status === 'fixed' ? 'bg-emerald-500 text-black' : 'opacity-30 hover:opacity-60'}`}
                              title="خلصتها خلاص"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            {res.status !== 'pending' && (
                              <button
                                onClick={() => handleStatusUpdate(insight.id, 'pending')}
                                className="p-1 opacity-20 hover:opacity-100 text-[8px] font-bold"
                              >
                                RESET
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Comment Area */}
                      {(res.status !== 'pending' || res.comment) && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="pt-2 border-t border-white/5 space-y-2"
                        >
                          {res.isSent ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 relative overflow-hidden group">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5 text-emerald-400">
                                  <Check className="w-3 h-3" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-shadow-glow">تم التمرير للسيادة</span>
                                </div>
                                <button 
                                  onClick={() => updateInsightResolution(insight.id, { ...res, isSent: false })}
                                  className="text-[8px] text-white/30 hover:text-white transition-colors"
                                >
                                  تعديل
                                </button>
                              </div>
                              <p className="text-[10px] text-white/80 leading-relaxed break-words">{res.comment}</p>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-indigo-400/60">
                                <Terminal className="w-2.5 h-2.5" />
                                <span>تعليق السيادة (Local Activity)</span>
                              </div>
                              <textarea
                                value={res.comment || ""}
                                onChange={(e) => handleCommentUpdate(insight.id, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, insight.id, res.comment || "", res)}
                                placeholder="كتبت إيه في الكود عشان تحل دي؟"
                                disabled={isSending[insight.id]}
                                className={`w-full bg-black/40 border ${
                                  sendSuccess[insight.id] 
                                    ? 'border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                                    : 'border-white/5 focus:border-indigo-500/50'
                                } rounded-xl p-2 text-[10px] text-white placeholder:text-white/10 focus:outline-none transition-all min-h-[40px] resize-none disabled:opacity-50`}
                              />
                              <div className="flex justify-between items-center px-1">
                                 <div className="flex items-center gap-2">
                                   {isSending[insight.id] && (
                                     <span className="text-[8px] text-indigo-400 animate-pulse flex items-center gap-1">
                                       <Loader2 className="w-2.5 h-2.5 animate-spin" /> جاري الدمج مع الوعي السيادي...
                                     </span>
                                   )}
                                   {sendSuccess[insight.id] && (
                                     <span className="text-[8px] text-emerald-400 flex items-center gap-1">
                                       <Check className="w-2.5 h-2.5" /> ✅ تم الإرسال والاندماج بنجاح
                                     </span>
                                   )}
                                 </div>
                                 {!isSending[insight.id] && !sendSuccess[insight.id] && (
                                   <span className="text-[8px] opacity-40 italic flex items-center gap-1">
                                     <span className="opacity-50">محفوظ محلياً</span> • اضغط <kbd className="px-1 py-0.5 bg-white/10 rounded font-sans mx-0.5 shadow-sm">Enter</kbd> للإرسال
                                   </span>
                                 )}
                              </div>
                            </>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
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
