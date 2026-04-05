import type { FC } from "react";
import { useState, useEffect } from "react";
import { Users, Loader2, X, Eye, Network, History, Sparkles, BrainCircuit, ArrowRight, UserCircle, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminTooltip } from "../Overview/components/AdminTooltip";
import { isSupabaseReady } from "../../../../services/supabaseClient";
import {
  fetchVisitorSessions,
  fetchJourneyMap,
  fetchSessionEvents,
  type SessionEventRow,
  type VisitorSessionSummary,
  type JourneyMapSnapshot,
} from "../../../../services/adminApi";

export const UsersPanel: FC = () => {
  const [query, setQuery] = useState("");
  const [visitorSessions, setVisitorSessions] = useState<VisitorSessionSummary[] | null>(null);
  const [godViewOpen, setGodViewOpen] = useState(false);
  const [godViewLoading, setGodViewLoading] = useState(false);
  const [godViewError, setGodViewError] = useState("");
  const [godViewSnapshot, setGodViewSnapshot] = useState<JourneyMapSnapshot | null>(null);
  const [godViewSessionId, setGodViewSessionId] = useState<string | null>(null);
  const [journeyLogOpen, setJourneyLogOpen] = useState(false);
  const [journeyLogLoading, setJourneyLogLoading] = useState(false);
  const [journeyLogEvents, setJourneyLogEvents] = useState<SessionEventRow[]>([]);

  useEffect(() => {
    if (!isSupabaseReady) return;
    const refresh = () => {
      fetchVisitorSessions(300).then(setVisitorSessions);
    };
    refresh();
    const timer = setInterval(refresh, 30000);
    return () => clearInterval(timer);
  }, []);

  const openGodView = async (sessionId: string) => {
    setGodViewSessionId(sessionId);
    setGodViewSnapshot(null);
    setGodViewError("");
    setGodViewOpen(true);
    setGodViewLoading(true);
    try {
      if (isSupabaseReady) {
        const data = await fetchJourneyMap(sessionId);
        if (data) setGodViewSnapshot(data);
        else setGodViewError("لا توجد بيانات خريطة.");
      }
    } catch {
      setGodViewError("خطأ في التحميل.");
    } finally {
      setGodViewLoading(false);
    }
  };

  const openJourneyLog = async (sessionId: string) => {
    setJourneyLogOpen(true);
    setJourneyLogLoading(true);
    try {
      if (isSupabaseReady) {
        const data = await fetchSessionEvents(sessionId, 300);
        if (data) setJourneyLogEvents(data);
      }
    } finally {
      setJourneyLogLoading(false);
    }
  };

  const filteredSessions = (visitorSessions ?? []).filter((s) =>
    query.trim().length === 0 ? true : s.sessionId.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-200" dir="rtl">
      {/* Header */}
      <header className="admin-glass-card rounded-2xl p-6 border-slate-800 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10 w-full md:w-auto mb-4 md:mb-0">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                  <Eye className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">رادار الكيانات (God-Eye Ledger)</h2>
                  <div className="flex items-center gap-2 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                      <p className="text-sm font-medium text-cyan-400">مراقبة حية لمستوى نشاط جميع الأرواح في المنصة</p>
                  </div>
              </div>
          </div>
          <div className="relative z-10 w-full md:w-1/3">
             <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث بالبصمة (Session ID)..."
                className="w-full rounded-xl border border-slate-700/50 bg-slate-950/60 px-4 py-2.5 text-xs text-cyan-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono shadow-inner"
                dir="ltr"
             />
          </div>
      </header>

      {/* Grid of users */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSessions.map((s) => {
           const activityLevel = s.eventsCount > 50 ? 'high' : s.eventsCount > 10 ? 'medium' : 'low';
           const glowColor = activityLevel === 'high' ? 'shadow-[0_0_15px_rgba(20,184,166,0.15)] border-teal-500/30' : 
                             activityLevel === 'medium' ? 'border-indigo-500/20' : 'border-slate-800';
           const dotColor = activityLevel === 'high' ? 'bg-teal-400' : activityLevel === 'medium' ? 'bg-indigo-400' : 'bg-slate-500';

           return (
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               key={s.sessionId} 
               className={`relative overflow-hidden group admin-glass-card rounded-2xl p-4 transition-all duration-500 hover:scale-[1.02] ${glowColor}`}
            >
              <div className="flex items-start justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                       <UserCircle className="w-5 h-5" />
                       {activityLevel === 'high' && <span className="absolute inset-0 rounded-full border border-teal-400/50 animate-ping opacity-20" />}
                       <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${dotColor}`} />
                    </div>
                    <div>
                       <p className="font-mono text-xs text-white truncate max-w-[120px]" title={s.sessionId}>{s.sessionId}</p>
                       <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          نبضة: {s.eventsCount}
                       </p>
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800/50">
                 <button 
                   onClick={() => openGodView(s.sessionId)} 
                   className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-[10px] font-bold border border-cyan-500/20 transition-all uppercase tracking-widest"
                 >
                   <Network className="w-3.5 h-3.5" />
                   NEXUS
                 </button>
                 <button 
                   onClick={() => openJourneyLog(s.sessionId)} 
                   className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-[10px] font-bold border border-indigo-500/20 transition-all uppercase tracking-widest"
                 >
                   <History className="w-3.5 h-3.5" />
                   TIMELINE
                 </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      <GodViewModal isOpen={godViewOpen} onClose={() => setGodViewOpen(false)} loading={godViewLoading} error={godViewError} snapshot={godViewSnapshot} sessionId={godViewSessionId} />
      <VisitorJourneyModal isOpen={journeyLogOpen} onClose={() => setJourneyLogOpen(false)} loading={journeyLogLoading} events={journeyLogEvents} />
    </div>
  );
};

interface GodViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  error: string;
  snapshot: JourneyMapSnapshot | null;
  sessionId: string | null;
}

const GodViewModal: FC<GodViewModalProps> = ({ isOpen, onClose, loading, error, snapshot, sessionId }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 sm:p-8" 
        onClick={onClose}
        dir="rtl"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-5xl h-[80vh] flex flex-col rounded-3xl border border-cyan-500/20 bg-[#060B14] overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.1)]" 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-black/20 z-20">
             <div className="flex justify-center items-center gap-3">
               <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                 <Network className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="font-black text-white tracking-widest uppercase">الرؤية المكانية (God View)</h3>
                  {sessionId && <p className="text-[10px] font-mono text-cyan-400/60 mt-0.5" dir="ltr">{sessionId}</p>}
               </div>
             </div>
            <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
               <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 relative overflow-auto p-8 custom-scrollbar">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                <p className="text-xs text-cyan-500/60 font-bold uppercase tracking-widest animate-pulse">جاري بناء خريطة التجربة...</p>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs text-rose-400 font-bold bg-rose-500/10 py-2 px-4 rounded-lg border border-rose-500/20">{error}</p>
              </div>
            ) : snapshot?.nodes?.length ? (
              <div className="flex flex-col items-center justify-center min-h-full">
                 {/* Fake Network Graph View */}
                 <div className="relative flex flex-col items-center gap-8 py-12">
                    {snapshot.nodes.map((node, i) => (
                       <motion.div 
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: i * 0.1 }}
                         key={i}
                         className="relative flex items-center justify-center"
                       >
                          {/* Connection line to next node */}
                          {i !== snapshot.nodes!.length - 1 && (
                             <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-12 bg-gradient-to-b from-cyan-500/50 to-indigo-500/10" />
                          )}
                          <div className="flex items-center gap-4 bg-slate-900 border border-cyan-500/30 rounded-full py-2 px-6 shadow-[0_0_20px_rgba(34,211,238,0.1)] z-10 hover:scale-105 hover:border-cyan-400 transition-transform cursor-crosshair">
                             <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                             <span className="text-xs font-bold text-cyan-100 uppercase tracking-widest">{node.label}</span>
                             <span className="text-[10px] text-cyan-500/50 font-mono bg-black/40 px-2 py-0.5 rounded-md uppercase" dir="ltr">{node.ring}</span>
                          </div>
                       </motion.div>
                    ))}
                 </div>
              </div>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">لا يوجد أثر مسجل لهذا الكيان</p>
                </div>
            )}
            
            {/* Ambient background decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-lg max-h-lg opacity-10 pointer-events-none">
              <div className="absolute inset-0 border border-cyan-500 rounded-full rounded-[40%] animate-spin-slow mix-blend-screen" style={{ animationDuration: '40s' }} />
              <div className="absolute inset-4 border border-indigo-500 rounded-full rounded-[40%] animate-reverse-spin mix-blend-screen" style={{ animationDuration: '50s' }} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

interface VisitorJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  events: SessionEventRow[];
}

const VisitorJourneyModal: FC<VisitorJourneyModalProps> = ({ isOpen, onClose, loading, events }) => {
  if (!isOpen) return null;

  const getEventIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('ai') || t.includes('agent')) return <BrainCircuit className="w-4 h-4 text-purple-400" />;
    if (t.includes('pay') || t.includes('purchase')) return <Sparkles className="w-4 h-4 text-amber-400" />;
    if (t.includes('view') || t.includes('visit') || t.includes('page')) return <Eye className="w-4 h-4 text-cyan-400" />;
    return <Activity className="w-4 h-4 text-slate-400" />;
  };

  const getEventColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('ai') || t.includes('agent')) return "bg-purple-500/10 border-purple-500/20 text-purple-200";
    if (t.includes('pay') || t.includes('purchase')) return "bg-amber-500/10 border-amber-500/20 text-amber-200";
    if (t.includes('view') || t.includes('visit') || t.includes('page')) return "bg-cyan-500/10 border-cyan-500/20 text-cyan-200";
    return "bg-slate-800 border-slate-700 text-slate-300";
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
        className="fixed inset-0 z-50 flex justify-end bg-slate-950/60" 
        onClick={onClose}
        dir="rtl"
      >
        <motion.div 
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-md h-full flex flex-col border-r border-indigo-500/20 bg-[#080B14] shadow-[-20px_0_50px_rgba(99,102,241,0.1)]" 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-5 border-b border-indigo-500/20 bg-indigo-500/5 z-20">
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[inset_0_0_10px_rgba(99,102,241,0.2)]">
                 <History className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="font-black text-white tracking-widest uppercase text-sm">التسلسل الزمني</h3>
                  <p className="text-[10px] text-indigo-400/60 mt-0.5 tracking-wider font-bold">Time-Lapse Chronicle</p>
               </div>
             </div>
            <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
               <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-xs text-indigo-500/60 font-bold uppercase tracking-widest animate-pulse">جاري سحب الترددات...</p>
              </div>
            ) : events.length === 0 ? (
               <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">لا يوجد سجل زمني متاح</p>
               </div>
            ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:mr-[19px] before:w-px before:bg-gradient-to-b before:from-transparent before:via-indigo-500/40 before:to-transparent pt-4 pb-12">
                  {events.map((e, index) => (
                     <motion.div 
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: index * 0.05 }}
                       key={e.id} 
                       className="relative flex items-center gap-6 group"
                     >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-indigo-500/30 shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.2)] bg-slate-900 z-10 transition-transform group-hover:scale-110 group-hover:border-indigo-400">
                           {getEventIcon(e.type)}
                        </div>
                        <div className={`flex-1 p-4 rounded-xl border ${getEventColor(e.type)} shadow-sm transition-all group-hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] relative`}>
                           {/* Little pointer triangle to the line */}
                           <div className={`absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 rotate-45 border-r border-t bg-inherit ${getEventColor(e.type).split(' ')[1]}`} />
                           <div className="flex items-center justify-between mb-1 relative z-10">
                              <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Event</span>
                              <span className="text-[9px] font-mono opacity-50 bg-black/20 border border-white/5 px-1.5 py-0.5 rounded" dir="ltr">
                                {e.createdAt ? new Date(e.createdAt).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "-"}
                              </span>
                           </div>
                           <p className="text-xs font-bold leading-relaxed relative z-10">{e.type}</p>
                           {e.payload && Object.keys(e.payload).length > 0 && (
                             <div className="mt-2 pt-2 border-t border-white/10 relative z-10">
                               <p className="text-[9px] font-mono opacity-70 truncate" title={JSON.stringify(e.payload)}>
                                 {JSON.stringify(e.payload)}
                               </p>
                             </div>
                           )}
                        </div>
                     </motion.div>
                  ))}
                </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
