import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Ghost, 
  Activity, 
  Eye, 
  Clock, 
  MousePointer2, 
  Zap,
  Smile,
  Meh,
  Frown,
  AlertTriangle,
  ChevronRight,
  Waves
} from "lucide-react";
import { supabase, isSupabaseReady } from "@/services/supabaseClient";
import { sendBroadcast } from "@/services/admin/adminBroadcasts"; // Optional: Use for AI intervention
import { useAdminState } from "@/domains/admin/store/admin.store";

interface GhostTrace {
  id: string;
  sessionId: string;
  type: string;
  label: string;
  timestamp: number;
  sentiment: "positive" | "neutral" | "negative" | "anxious";
  duration: number; // seconds spent here
  path: string;
}

const mapDbEventToTrace = (row: any): GhostTrace => {
  const tId = row.client_event_id || `tr-${row.id || Date.now()}`;
  const sId = row.session_id ? row.session_id.substring(0, 8) : "anonymous";
  const timestamp = new Date(row.occurred_at).getTime();
  const evtType = row.event_type || "unknown";
  const payload = row.payload || {};

  let sentiment: GhostTrace["sentiment"] = "neutral";
  let label = evtType;
  let duration = payload.timeToAction ? Math.round(payload.timeToAction / 1000) : 0;
  let path = "system";

  switch (evtType) {
    case "mood_logged": {
      const score = payload.moodScore;
      if (score > 3) sentiment = "positive";
      else if (score < 3) sentiment = "negative";
      label = `تسجيل مزاج (${score}/5)`;
      path = "/pulse";
      break;
    }

    case "node_added":
      sentiment = payload.isEmergency ? "anxious" : "positive";
      label = `إضافة شخص ${payload.isEmergency ? "(طوارئ)" : ""}`;
      path = "/map";
      break;

    case "flow_event": {
      const step = payload.step || "";
      if (step.includes("success") || step.includes("completed")) sentiment = "positive";
      else if (step.includes("failed") || step.includes("abandoned") || step.includes("dropped")) sentiment = "negative";
      else if (step.includes("unstable") || step.includes("blocked") || step.includes("forced") || step.includes("attempted")) sentiment = "anxious";
      else sentiment = "neutral";
      
      label = step.split("_").join(" ");
      if (payload.extra?.atStep) path = payload.extra.atStep;
      else if (step.startsWith("landing")) path = "/landing";
      else if (step.startsWith("auth")) path = "/auth";
      else if (step.startsWith("onboarding") || step.includes("sanctuary")) path = "/sanctuary";
      else if (step.startsWith("pulse")) path = "/pulse";
      else path = "/app";

      if (payload.extra?.dwellTime && !duration) {
        duration = Math.round(payload.extra.dwellTime / 1000);
      }
      break;
    }

    case "path_started":
      sentiment = "positive";
      label = `بدء مسار: ${payload.pathId || payload.zone}`;
      path = `/path/${payload.pathId || "dynamic"}`;
      break;
      
    case "task_completed":
       sentiment = payload.moodScore ? (payload.moodScore > 3 ? "positive" : (payload.moodScore < 3 ? "negative" : "neutral")) : "positive";
       label = `إتمام خطوة: ${payload.taskLabel || payload.taskId}`;
       path = `/path/${payload.pathId || "dynamic"}`;
       break;
       
    case "path_regenerated":
       sentiment = "neutral";
       label = "إعادة بناء المسار (Regeneration)";
       path = `/path/${payload.pathId || "dynamic"}`;
       break;
      
    default:
      sentiment = "neutral";
      break;
  }

  // Fallbacks for aesthetic realism
  if (!duration) {
     duration = ((String(row.id ?? row.client_event_id ?? evtType).length + timestamp) % 5) + 1;
  }

  return {
    id: tId,
    sessionId: sId,
    type: evtType.replace(/_/g, " "),
    label,
    timestamp,
    sentiment,
    duration,
    path
  };
};

export const GhostMirror: React.FC = () => {
  const [traces, setTraces] = useState<GhostTrace[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [injectionToast, setInjectionToast] = useState<{ sessionId: string, visible: boolean }>({ sessionId: "", visible: false });

  const visibleTraces = useMemo(() => traces.slice(0, 20), [traces]);
  const positiveCount = useMemo(
    () => traces.filter((t) => t.sentiment === "positive").length,
    [traces]
  );
  const anxiousCount = useMemo(
    () => traces.filter((t) => t.sentiment === "anxious" || t.sentiment === "negative").length,
    [traces]
  );
  const totalAnalyzed = Math.max(1, traces.length);
  const resonanceScore = useMemo(
    () => Math.round((positiveCount / totalAnalyzed) * 100),
    [positiveCount, totalAnalyzed]
  );

  useEffect(() => {
    let active = true;

    const fetchInitialLogs = async () => {
      try {
        setLoading(true);
        if (!isSupabaseReady || !supabase) return;
        
        const { data, error } = await supabase
          .from("routing_events")
          .select("*")
          .order("occurred_at", { ascending: false })
          .limit(20);

        if (error) throw error;
        
        if (active && data) {
          setTraces(data.map(mapDbEventToTrace));
          setIsLive(true);
        }
      } catch (err) {
        console.warn("Failed to fetch initial Ghost Mirror traces:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchInitialLogs();

    if (!isSupabaseReady || !supabase) return;

    // Real-time Channel Setup
    const channel = supabase.channel("public:routing_events")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "routing_events"
        },
        (payload) => {
          if (!active) return;
          const newTrace = mapDbEventToTrace(payload.new);
          setTraces(prev => {
            const exists = prev.some(t => t.id === newTrace.id);
            if (exists) return prev;
            const updated = [newTrace, ...prev].slice(0, 30);
            
            const calculateResonance = (currentTraces: any[]) => {
              if (currentTraces.length === 0) return 100;
              const total = currentTraces.reduce((acc, t) => acc + (t.sentiment === "positive" ? 100 : t.sentiment === "neutral" ? 50 : 0), 0);
              const score = Math.round((total / (currentTraces.length * 100)) * 100);
              
              // Sync to Global Sovereign HUD
              useAdminState.getState().setResonanceScore(score);
              
              // Update Latest Friction if negative sentiment
              const latestNegative = [...currentTraces].reverse().find(t => t.sentiment === "anxious" || t.sentiment === "negative");
              if (latestNegative) {
                  useAdminState.getState().setLatestFriction(`${latestNegative.sessionId} @ ${latestNegative.path || 'untracked'}`);
              }

              return score;
            };
            calculateResonance(updated);
            return updated;
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED" && active) {
          setIsLive(true);
        } else if (status === "CHANNEL_ERROR" || status === "CLOSED") {
          setIsLive(false);
        }
      });

    return () => {
      active = false;
      if (supabase) {
        void supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleInjectInsight = (sessionId: string) => {
    setInjectionToast({ sessionId, visible: true });
    setTimeout(() => setInjectionToast(prev => ({ ...prev, visible: false })), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Ghost className="h-6 w-6 text-indigo-400" />
            {isLive && (
              <motion.div 
                animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -inset-1 rounded-full bg-indigo-500/20 blur-sm"
              />
            )}
          </div>
          <div>
            <h2 className="text-xl font-medium text-slate-100 font-display">مرآة الظل (Ghost Mirror)</h2>
            <p className="text-sm text-slate-400">تتبع البصمة النفسية والمسارات اللحظية للمستخدمين.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
          <div className={`h-2 w-2 rounded-full ${isLive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" : "bg-slate-500"}`} />
          <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">{isLive ? "Live Mirroring" : "Disconnected"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Trace Navigation */}
        <div className="lg:col-span-2 space-y-4">
          {loading && traces.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 rounded-xl border border-slate-800/50">
              <Activity className="h-8 w-8 text-indigo-500 animate-pulse mb-3" />
              <p className="text-sm font-bold text-slate-400">جاري مسح البصمات...</p>
            </div>
          ) : traces.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 rounded-xl border border-slate-800/50">
               <Ghost className="h-8 w-8 text-slate-600 mb-3" />
               <p className="text-sm font-bold text-slate-500">لا توجد بصمات حديثة</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {visibleTraces.map((trace, idx) => (
                <motion.div
                  key={trace.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className={`group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                    idx === 0 
                    ? "bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-500/5" 
                    : "bg-slate-900/40 border-slate-800/50 hover:border-slate-700/50"
                  }`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    trace.sentiment === "positive" ? "bg-emerald-500/20 text-emerald-400" :
                    trace.sentiment === "anxious" ? "bg-amber-500/20 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]" :
                    trace.sentiment === "negative" ? "bg-rose-500/20 text-rose-400" :
                    "bg-slate-800 text-slate-400"
                  }`}>
                    {trace.sentiment === "positive" && <Smile className="h-5 w-5" />}
                    {trace.sentiment === "neutral" && <Meh className="h-5 w-5" />}
                    {trace.sentiment === "anxious" && <AlertTriangle className="h-5 w-5" />}
                    {trace.sentiment === "negative" && <Frown className="h-5 w-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-indigo-400">{trace.sessionId}</span>
                      <span className="text-[10px] text-slate-500">•</span>
                      <span className="text-[10px] font-bold text-slate-500">{new Date(trace.timestamp).toLocaleTimeString("ar-EG", { hour12: false })}</span>
                      <span className="text-[10px] text-slate-500">•</span>
                      <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider truncate max-w-[100px]">{trace.type}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-200 truncate capitalize" title={trace.label}>{trace.label}</h3>
                    <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {trace.duration}s</span>
                      <span className="truncate flex items-center gap-1 opacity-60"><ChevronRight className="h-3 w-3" /> {trace.path}</span>
                    </div>
                  </div>

                   {(trace.sentiment === "anxious" || trace.sentiment === "negative" || idx === 0) && (
                    <div className={`absolute top-3 left-4 flex items-center gap-2 transition-opacity ${idx === 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInjectInsight(trace.sessionId);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-[10px] font-black text-indigo-300 uppercase tracking-widest transition-all shadow-sm active:scale-95"
                      >
                        Intervene
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Right Column: Psychological Summary */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-xl shrink-0">
            <h3 className="text-sm font-bold text-slate-400 mb-5 flex items-center gap-2 uppercase tracking-widest">
              <Activity className="h-4 w-4 text-teal-400" /> الحالة الانفعالية العامة
            </h3>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Resonance Map</span>
                <span className={`text-base font-black font-mono ${resonanceScore > 70 ? 'text-teal-400' : resonanceScore > 40 ? 'text-amber-400' : 'text-rose-400'}`}>
        {loading && totalAnalyzed === 1 ? '--%' : `${resonanceScore}%`}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${resonanceScore}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full ${resonanceScore > 70 ? 'bg-gradient-to-r from-teal-500 to-indigo-500' : resonanceScore > 40 ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-rose-500'}`}
                />
              </div>
              
              <div className="pt-2 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800/50 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Waves className="h-5 w-5 text-indigo-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">Flow (Positive)</div>
                  <div className="text-lg font-black text-slate-200">{positiveCount}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800/50 text-center relative overflow-hidden group">
                   <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Zap className="h-5 w-5 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-[10px] font-black text-slate-500 mb-1 uppercase tracking-widest">Friction (Anxious)</div>
                  <div className="text-lg font-black text-slate-200">{anxiousCount}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 shrink-0">
            <h3 className="text-sm font-bold text-indigo-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
              <Eye className="h-4 w-4" /> رصد خاص (Oracle)
            </h3>
            {anxiousCount > 0 && traces[0]?.sentiment === "anxious" ? (
              <p className="text-xs text-amber-400 leading-loose font-bold">
                "تم رصد تردد أو نقطة احتكاك لدى المستخدم <span className="font-mono text-amber-300">({traces[0].sessionId})</span> في <span>{traces[0].label}</span>. ينصح بالتدخل الإداري لتسهيل المسار."
              </p>
            ) : traces.length > 0 ? (
              <p className="text-xs text-slate-400 leading-loose font-bold">
                "التدفق الانفعالي مستقر. معظم الجلسات تتخطى نقاط العبور بدون احتكاك عالي. لا توجد حاجة ملحة للتدخل حالياً."
              </p>
            ) : (
               <p className="text-xs text-slate-500 leading-loose font-bold">
                "في انتظار البيانات الحية لتكوين الرؤية الخاصة..."
              </p>
            )}
            
            <button 
              disabled={traces.length === 0}
              onClick={() => handleInjectInsight(traces[0]?.sessionId || "all")}
              className="w-full mt-6 py-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/20 text-indigo-300 font-black text-[11px] uppercase tracking-widest transition-all disabled:opacity-50 active:scale-95 shadow-sm"
            >
              استدعاء النبض الجماعي (Pulse Push)
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {injectionToast.visible && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-indigo-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-indigo-400/50"
          >
            <div className="p-2 bg-indigo-500 rounded-lg">
              <Zap className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Cognitive Injection Deployed</p>
              <p className="text-xs font-bold font-mono">Session ID: {injectionToast.sessionId}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
