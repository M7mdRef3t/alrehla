import { FC, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Brain, Eye, Terminal, Loader2, RefreshCw, Activity, ShieldCheck, ChevronDown, ChevronUp, Copy, Check, MessageSquare, Send } from "lucide-react";
import { fetchSovereignInsights, respondToOracleInsight } from "@/services/adminApi";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { augmentInsightWithAi } from "@/services/oracleAiService";

// Module-level guard: survives React Strict Mode's double-invoke
let _oracleFetching = false;

interface SovereignOracleProps {
  minimal?: boolean;
}

/**
 * NeuralPulse: A complex SVG representing neural synchronization
 */
const NeuralPulse = () => (
  <div className="relative w-12 h-12 flex items-center justify-center">
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl"
    />
    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 overflow-visible">
      <defs>
        <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <motion.line
          key={i}
          x1="50" y1="50"
          x2={50 + Math.cos(angle * Math.PI / 180) * 40}
          y2={50 + Math.sin(angle * Math.PI / 180) * 40}
          stroke="url(#neural-gradient)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 0], opacity: [0, 0.8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
      <circle cx="50" cy="50" r="8" fill="url(#neural-gradient)" className="filter drop-shadow-glow-indigo" />
    </svg>
  </div>
);

const ConfidenceGauge = ({ value, type }: { value: number, type: string }) => {
  const colorClass =
    type === 'truth' ? 'bg-emerald-500' :
    type === 'warning' ? 'bg-rose-500' :
    'bg-indigo-500';

  return (
    <div className="flex flex-col gap-1 w-12">
      <div className="flex justify-between items-center text-[8px] font-mono opacity-50 uppercase tracking-tighter">
        <span>Conf</span>
        <span>{value}%</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${colorClass} shadow-[0_0_8px_rgba(0,0,0,0.5)]`}
        />
      </div>
    </div>
  );
};

export const SovereignOracle: FC<SovereignOracleProps> = ({ minimal }) => {
  const { sovereignInsights, setSovereignInsights, sovereignStats, setSovereignStats } = useAdminState();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [isSendingResponse, setIsSendingResponse] = useState(false);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const refreshInsights = useCallback(async () => {
    if (cooldown > 0 || _oracleFetching) return;
    _oracleFetching = true;
    setIsRefreshing(true);
    try {
      const result = await fetchSovereignInsights();
      if (result) {
        if (result.insights && result.insights.length > 0) {
          const nowTime = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          });

          let pulseTime = nowTime;
          if (result.timestamp) {
            pulseTime = new Date(result.timestamp).toLocaleTimeString('ar-EG', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            });
          } else {
            pulseTime = new Date().toLocaleTimeString('ar-EG', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            });
          }

          // 1. Initial State Sync
          const localizedInsights = result.insights.map(i => ({
            ...i,
            timestamp: (i.timestamp === "\u0627\u0644\u0622\u0646" || i.timestamp === "Now" || !i.timestamp) ? pulseTime : i.timestamp
          }));
          setSovereignInsights(localizedInsights);

          // 2. Immediate Parallel Augmentation (Only for insights missing Rationale)
          const augmentationPromises = localizedInsights.map(async (insight) => {
            if (!insight.rationale) {
              const augmentation = await augmentInsightWithAi(insight);
              if (augmentation.rationale) {
                return { id: insight.id, ...augmentation };
              }
            }
            return null;
          });

          const augmentations = await Promise.all(augmentationPromises);

          const validAugmentations = augmentations.filter((a): a is { id: string, rationale: string, confidence: number, tag: string } => a !== null);
          if (validAugmentations.length > 0) {
            const currentInsights = useAdminState.getState().sovereignInsights;
            const updatedInsights = currentInsights.map(item => {
              const aug = validAugmentations.find(a => a.id === item.id);
              return aug ? { ...item, ...aug } : item;
            });
            setSovereignInsights(updatedInsights);
          }
        }
        if (result.stats) {
          setSovereignStats(result.stats);
        }
        if (result.retryAfterSec) {
          setCooldown(result.retryAfterSec);
        } else if (!result.insights || result.insights.length === 0) {
          setCooldown(60);
        }
      } else {
        setCooldown(60);
      }
    } catch (error) {
      console.error("Failed to fetch Oracle insights", error);
      setCooldown(60);
    } finally {
      setIsRefreshing(false);
      _oracleFetching = false;
    }
  }, [setSovereignInsights, setSovereignStats, cooldown]);

  const handleRespond = async (insight: any) => {
    if (!responseMessage.trim() || isSendingResponse) return;
    setIsSendingResponse(true);
    try {
      const ok = await respondToOracleInsight(insight.id, responseMessage);
      if (ok) {
        setResolvedIds(prev => new Set(prev).add(insight.id));
        setRespondingId(null);
        setResponseMessage("");
        // Optionally refresh after a bit to let the truth vault propagate
      }
    } catch (err) {
      console.error("Failed to send response", err);
    } finally {
      setIsSendingResponse(false);
    }
  };

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
  }, [sovereignInsights.length, refreshInsights]);

  const sortedFriction = sovereignStats?.behavioralFriction?.filter(f => f.avgTimeSec > 30) || [];

  const content = (
    <>
      {!minimal && (
        <div className="p-4 border-b border-white/5 bg-white/10 backdrop-blur-md flex items-center justify-between flex-row-reverse sticky top-0 z-20">
          <div className="flex items-center gap-3 text-indigo-400 flex-row-reverse text-right">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Brain className="w-4 h-4 drop-shadow-glow-indigo" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-shadow-glow">توجيهات الأوراكل</h3>
              <p className="text-[9px] opacity-40 font-mono tracking-tighter uppercase">Sovereign Intelligence Pulse</p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-row-reverse">
            {isRefreshing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 flex-row-reverse">
                <Activity className="w-3 h-3 text-indigo-400 animate-pulse" />
                <span className="text-[9px] font-mono text-indigo-400/60 uppercase">Syncing...</span>
              </motion.div>
            )}
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/5 rounded-full border border-indigo-500/10 flex-row-reverse">
              <div className={`w-1.5 h-1.5 rounded-full ${isRefreshing ? 'bg-indigo-400 animate-pulse shadow-[0_0_8px_#818cf8]' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'}`} />
              <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">
                {isRefreshing ? 'Thinking' : 'Active'}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto ${minimal ? '' : 'p-4'} space-y-4 custom-scrollbar relative`}>
        {/* Behavioral Friction Section */}
        {sortedFriction.length > 0 && (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl mb-2 relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                  <Zap className="w-12 h-12 text-rose-500" />
                </div>
                <div className="flex items-center gap-2 mb-3 text-rose-400 relative z-10 flex-row-reverse text-right">
                    <Activity className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">احتكاك السلوك (Behavioral Friction)</span>
                </div>
                <div className="grid grid-cols-2 gap-3 relative z-10">
                    {sortedFriction.slice(0, 4).map(f => (
                        <div key={f.scenario} className="p-2 bg-white/2 rounded-lg border border-white/5 flex flex-row-reverse justify-between items-center text-[10px] group/item hover:bg-white/5 transition-colors text-right">
                            <span className="opacity-50 font-medium tracking-tight truncate max-w-[80px]">{f.scenario}</span>
                            <div className="flex items-center gap-1.5 flex-row-reverse">
                              <div className={`h-1 w-8 bg-white/5 rounded-full overflow-hidden`}>
                                <div className={`h-full ${f.avgTimeSec > 120 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, f.avgTimeSec/2)}%` }} />
                              </div>
                              <span className={`font-mono font-bold ${f.avgTimeSec > 120 ? 'text-rose-400' : 'text-amber-400'}`}>
                                  {f.avgTimeSec}s
                              </span>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        )}

        <AnimatePresence mode="popLayout" initial={false}>
          {sovereignInsights.length > 0 ? (
            sovereignInsights.map((insight, idx) => {
              const isExpanded = expandedId === insight.id;

              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  layout
                  onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                  className={`p-4 rounded-2xl border transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer group relative overflow-hidden ${
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

                  <div className="flex flex-col gap-3 relative z-10 text-right">
                    <div className="flex flex-row-reverse items-start justify-between gap-3">
                      <div className="flex flex-row-reverse items-start gap-3 flex-1">
                        <div className={`mt-0.5 p-2 rounded-lg ${
                          insight.type === 'truth' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                          insight.type === 'warning' ? 'bg-rose-500/10 border border-rose-500/20' :
                          'bg-indigo-500/10 border border-indigo-500/20'
                        }`}>
                          {insight.type === 'truth' && <Eye className="w-4 h-4 drop-shadow-glow-emerald" />}
                          {insight.type === 'warning' && <Zap className="w-4 h-4 drop-shadow-glow-rose" />}
                          {insight.type === 'opportunity' && <Sparkles className="w-4 h-4 drop-shadow-glow-indigo" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-row-reverse items-center gap-2 mb-1">
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-50">
                              {insight.tag || "Analyzing Spectrum..."}
                            </span>
                            <div className="h-px flex-1 bg-white/5" />
                          </div>
                          <p className="text-xs leading-relaxed font-bold tracking-tight">{insight.message}</p>
                        </div>
                      </div>
                      <ConfidenceGauge value={insight.confidence || 0} type={insight.type} />
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3 mt-3 border-t border-white/5 space-y-3">
                            <div className="flex flex-row-reverse items-center gap-2 text-[10px] font-bold opacity-80">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              <span>المنطق السيادي (Deep Rationale)</span>
                            </div>
                            <p className="text-[10px] leading-relaxed opacity-60 font-medium italic">
                              {insight.rationale || (
                                <span className="flex flex-row-reverse items-center gap-2">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  جاري مزامنة المنطق السيادي من المبادئ الأولى...
                                </span>
                              )}
                            </p>
                            <div className="flex flex-row-reverse items-center gap-2 p-2 bg-black/20 rounded-lg border border-white/5">
                              <Terminal className="w-3 h-3 opacity-40" />
                              <span className="text-[9px] font-mono opacity-40 uppercase tracking-tighter">Analysis Node: {insight.id.split('-')[0]}</span>
                            </div>

                            {/* Response Section */}
                            <div className="pt-2">
                              {resolvedIds.has(insight.id) ? (
                                <div className="flex flex-row-reverse items-center gap-2 py-2 px-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-[10px] font-bold">
                                  <ShieldCheck className="w-4 h-4" />
                                  <span>تم تسجيل الرد في خزانة الحقائق السيادية</span>
                                </div>
                              ) : respondingId === insight.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    autoFocus
                                    value={responseMessage}
                                    onChange={(e) => setResponseMessage(e.target.value)}
                                    placeholder="اكتب ردك هنا (ماذا فعلت؟ أو لماذا قررت تجاهل هذا؟)"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[10px] text-right text-white focus:outline-none focus:border-indigo-500/50 transition-colors min-h-[80px]"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex flex-row-reverse gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRespond(insight);
                                      }}
                                      disabled={isSendingResponse || !responseMessage.trim()}
                                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 transition-all"
                                    >
                                      {isSendingResponse ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                      إرسال الرد للسيستم
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setRespondingId(null);
                                        setResponseMessage("");
                                      }}
                                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg text-[10px] font-bold transition-all"
                                    >
                                      إلغاء
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRespondingId(insight.id);
                                    // Pre-fill if it's a known work
                                    if (insight.message.includes("الهوية") || insight.message.includes("بوابة")) {
                                       setResponseMessage("تم تنفيذ تحسين مسار الهوية (Split Reveal) وتفعيل الأرشفة اللحظية (Incremental Indexing) والأتمتة (Lead Nudge) لتقليل الفقد.");
                                    }
                                  }}
                                  className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 transition-all text-white/80"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  رد على التوجيه
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex flex-row-reverse items-center justify-between pt-2">
                      <div className="flex flex-row-reverse items-center gap-3">
                        <span className="text-[9px] opacity-30 font-mono uppercase tracking-tighter">{insight.timestamp}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(insight.message);
                            setCopiedId(insight.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className={`p-1.5 rounded-lg border transition-all ${
                            copiedId === insight.id
                            ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                          }`}
                          title="نسخ التوجيه"
                        >
                          {copiedId === insight.id ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      <div className="flex flex-row-reverse items-center gap-2">
                        <span className="text-[8px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-40 transition-opacity">
                          {isExpanded ? 'Collapse' : 'Expand'}
                        </span>
                        {isExpanded ? <ChevronUp className="w-3 h-3 opacity-20" /> : <ChevronDown className="w-3 h-3 opacity-20" />}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-6 py-20 grayscale-0">
               {isRefreshing ? (
                 <NeuralPulse />
               ) : (
                 <Brain className="w-12 h-12 opacity-10 animate-pulse text-indigo-400" />
               )}
               <div className="text-center space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400/40">الارتباط المعرفي</p>
                  <p className="text-xs font-bold opacity-30">جاري تحليل المبادئ الأولى للفضاء...</p>
               </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className={`p-4 ${minimal ? '' : 'bg-white/2 border-t border-white/5 backdrop-blur-xl'}`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            void refreshInsights();
          }}
          disabled={isRefreshing || cooldown > 0}
          className={`w-full py-3 ${cooldown > 0 ? 'bg-white/5 text-white/30' : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300'} active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group relative overflow-hidden`}
        >
          {isRefreshing ? (
             <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : cooldown > 0 ? (
             <div className="flex flex-row-reverse items-center gap-2">
               <div className="w-3.5 h-3.5 border-2 border-white/10 border-t-white/30 rounded-full animate-spin" />
               <span>جاري المعالجة (Cooling Down)</span>
             </div>
          ) : (
             <>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Sparkles className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />
              <span>توليد تحليل معمق (AI Pulse)</span>
             </>
          )}
          {cooldown > 0 && <span className="font-mono ml-2">[{cooldown}s]</span>}
        </button>
      </div>
    </>
  );

  if (minimal) return content;

  return (
    <div className="bg-[#0B0F19]/60 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col h-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] transition-all">
      {content}
    </div>
  );
};
