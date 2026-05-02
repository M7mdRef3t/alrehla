import { useState, useEffect, useCallback, useMemo } from "react";
import type { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  User, 
  Clock, 
  Map as MapIcon, 
  CheckCircle2, 
  PlusCircle, 
  Heart, 
  Zap, 
  ExternalLink, 
  RefreshCcw,
  Filter,
  Calendar,
  Activity,
  ChevronLeft,
  MessageSquare
} from "lucide-react";
import { fetchVisitorSessions, fetchSessionEvents } from "@/services/admin/adminUsers";
import { executeIntervention } from "@/services/admin/adminInterventions";
import { useToastState } from "@/modules/map/store/toast.store";
import { useAdminState } from "@/domains/admin/store/admin.store";
import type { VisitorSessionSummary, SessionEventRow } from "@/services/admin/adminTypes";
import { AwarenessSkeleton } from "@/modules/meta/AwarenessSkeleton";

export const JourneyLogPanel: FC = () => {
  const [sessions, setSessions] = useState<VisitorSessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [events, setEvents] = useState<SessionEventRow[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "active" | "registered">("all");
  const [isSendingNudge, setIsSendingNudge] = useState(false);
  const { showToast } = useToastState();
  const setGlobalSessions = useAdminState(s => s.setVisitorSessions);

  const loadSessions = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const data = await fetchVisitorSessions(200);
      if (data) {
        setSessions(data);
        setGlobalSessions(data);
      }
    } catch (err) {
      console.error("Failed to load sessions", err);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const loadEvents = useCallback(async (sid: string) => {
    setIsLoadingEvents(true);
    try {
      const data = await fetchSessionEvents(sid, 300);
      if (data) setEvents(data);
      else setEvents([]);
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  const handleManualNudge = async () => {
    if (!selectedSessionId || !selectedSession) return;
    setIsSendingNudge(true);
    try {
      // Mock an intervention entry for manual nudge
      const intervention = {
        id: `manual-${Date.now()}`,
        userId: selectedSession.linkedUserId || selectedSessionId,
        triggerReason: "manual_steward_intervention",
        aiMessage: "رسالة دعم وتحفيز يدوية من فريق الرحلة.",
        status: "unread" as const,
        createdAt: new Date().toISOString(),
        userName: selectedSession.linkedEmail || "مسافر مجهول",
        userEmail: selectedSession.linkedEmail || "",
        metadata: {}
      };
      
      const result = await executeIntervention(intervention);
      if (result.success) {
        showToast("تم إرسال نداء الحق يدوياً بنجاح ✨", "success");
      } else {
        showToast(result.error || "فشل في إرسال النداء", "error");
      }
    } catch (err) {
      showToast("حدث خطأ أثناء إرسال النداء", "error");
    } finally {
      setIsSendingNudge(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (selectedSessionId) {
      void loadEvents(selectedSessionId);
    }
  }, [selectedSessionId, loadEvents]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchesSearch = s.sessionId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           s.linkedEmail?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === "all" || 
                           (filterType === "registered" && s.linkedUserId) ||
                           (filterType === "active" && s.eventsCount > 5);
      return matchesSearch && matchesFilter;
    });
  }, [sessions, searchQuery, filterType]);

  const selectedSession = useMemo(() => 
    sessions.find(s => s.sessionId === selectedSessionId), 
    [sessions, selectedSessionId]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[600px]" dir="rtl">
      {/* ── Sessions Sidebar (lg:col-span-4) ────────────────────────────────── */}
      <div className="lg:col-span-4 flex flex-col space-y-4">
        <div className="relative group">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 transition-colors group-focus-within:text-emerald-400" />
          <input
            type="text"
            placeholder="بحث عن مسافر أو بريد إلكتروني..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/60 border border-white/5 rounded-2xl py-3 pr-10 pl-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        <div className="flex gap-2 p-1 bg-slate-900/40 border border-white/5 rounded-xl">
          {(["all", "active", "registered"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filterType === t 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {t === "all" ? "الكل" : t === "active" ? "نشط" : "مسجل"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[600px]">
          {isLoadingList ? (
            <div className="space-y-3 opacity-50">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-20 bg-white/5 rounded-3xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-16 text-center space-y-4 bg-slate-900/20 rounded-3xl border border-dashed border-white/10"
            >
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto">
                <Activity className="w-6 h-6 text-slate-600" />
              </div>
              <p className="text-sm text-slate-500 font-bold tracking-wide">لا يوجد مسافرين حالياً</p>
            </motion.div>
          ) : (
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.05 } }
              }}
              className="space-y-2.5"
            >
              {filteredSessions.map((s) => (
                <motion.button
                  key={s.sessionId}
                  variants={{
                    hidden: { opacity: 0, x: 20 },
                    visible: { opacity: 1, x: 0 }
                  }}
                  whileHover={{ scale: 1.02, x: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedSessionId(s.sessionId)}
                  className={`w-full text-right p-5 rounded-[2rem] border transition-all duration-500 group relative overflow-hidden ${
                    selectedSessionId === s.sessionId
                      ? "bg-gradient-to-l from-emerald-500/10 to-emerald-500/5 border-emerald-500/40 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]"
                      : "bg-slate-900/40 border-white/5 hover:border-white/20 hover:bg-slate-800/60"
                  }`}
                >
                {selectedSessionId === s.sessionId && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  />
                )}
                
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <h4 className={`text-sm font-bold truncate ${selectedSessionId === s.sessionId ? "text-emerald-400" : "text-slate-200"}`}>
                      {s.linkedEmail || `مسافر ${s.sessionId.slice(0, 8)}`}
                    </h4>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {s.eventsCount} حدث
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {s.lastSeen ? new Date(s.lastSeen).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`p-2 rounded-xl transition-colors ${selectedSessionId === s.sessionId ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-500 group-hover:text-slate-300"}`}>
                      <User className="w-4 h-4" />
                    </div>
                    {s.riskLevel === 'high' && (
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Journey Timeline Content (lg:col-span-8) ────────────────────────── */}
      <div className="lg:col-span-8 bg-slate-900/20 border border-white/5 rounded-3xl overflow-hidden flex flex-col">
        {!selectedSessionId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center">
              <MapIcon className="w-10 h-10 text-emerald-500/20" />
            </div>
            <div className="max-w-xs space-y-2">
              <h3 className="text-xl font-bold text-white">اختر مسافرًا</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                قم باختيار أحد المسافرين من القائمة الجانبية لمراقبة رحلته وتفاعلاته الحية مع المنصة.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Timeline Header */}
            <div className="p-6 border-b border-white/5 bg-slate-950/40 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors">{selectedSession?.linkedEmail || `مسافر ${selectedSessionId.slice(0, 12)}`}</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    LIVE TELEMETRY: {selectedSessionId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleManualNudge}
                  disabled={isSendingNudge}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all text-[11px] font-black uppercase tracking-widest disabled:opacity-50"
                >
                  {isSendingNudge ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                  إرسال نداء يدوي
                </button>
                <div className="h-4 w-px bg-white/10 mx-1" />
                <button 
                  onClick={() => selectedSessionId && loadEvents(selectedSessionId)}
                  className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                >
                  <RefreshCcw className={`w-4 h-4 ${isLoadingEvents ? "animate-spin" : ""}`} />
                </button>
                <div className="h-4 w-px bg-white/10 mx-1" />
                <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-black/40 border border-white/5 shadow-inner">
                  <div className="text-center min-w-[40px]">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">الرنين</p>
                    <p className={`text-sm font-black transition-colors ${selectedSession?.aiState === 'connected' ? "text-emerald-400" : selectedSession?.aiState === 'disturbed' ? "text-amber-400" : "text-white"}`}>
                      {selectedSession?.aiState === 'connected' ? "متصل" : selectedSession?.aiState === 'disturbed' ? "مشوش" : "مستقر"}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center min-w-[40px]">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">الحالة</p>
                    <p className={`text-sm font-black transition-colors ${selectedSession?.riskLevel === 'high' ? "text-rose-400" : "text-emerald-400"}`}>
                      {selectedSession?.riskLevel === 'high' ? "خطر" : "آمن"}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center min-w-[40px]">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">تقدم</p>
                    <p className="text-sm font-black text-white">%{Math.min(100, ((selectedSession?.taskCompletions || 0) / 7) * 100).toFixed(0)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar relative">
              {isLoadingEvents ? (
                <AwarenessSkeleton />
              ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-600 opacity-50 space-y-4">
                  <Clock className="w-12 h-12" />
                  <p className="text-sm">لا توجد تفاعلات مسجلة لهذه الجلسة</p>
                </div>
              ) : (
                <div className="space-y-8 relative">
                  {/* Vertical Line with Gradient */}
                  <div className="absolute right-[23px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-emerald-500/40 via-slate-700/30 to-transparent" />

                  <AnimatePresence initial={false}>
                    {events.map((event, idx) => (
                      <motion.div
                        key={event.id || idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="relative pr-12 group"
                      >
                        {/* Event Dot */}
                        <div className={`absolute right-0 top-1.5 w-12 h-12 flex items-center justify-center z-10`}>
                          <div className={`w-3.5 h-3.5 rounded-full border-2 bg-slate-950 transition-all duration-500 group-hover:scale-150 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] ${getEventColor(event.type)}`} />
                        </div>
 
                        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 hover:bg-white/[0.05] hover:border-white/20 transition-all duration-500 shadow-2xl relative overflow-hidden group/card">
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${getEventColor(event.type, true)}`}>
                              {formatEventType(event.type)}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {event.createdAt ? new Date(event.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
                            </span>
                          </div>

                          <p className="text-sm text-slate-200 font-medium leading-relaxed">
                            {formatEventPayload(event.type, event.payload)}
                          </p>

                          {event.payload && Object.keys(event.payload).length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2">
                              {Object.entries(event.payload).map(([key, value]) => {
                                if (typeof value === "object") return null;
                                return (
                                  <div key={key} className="px-2 py-1 rounded-lg bg-slate-950/40 border border-white/5 text-[9px] text-slate-400">
                                    <span className="font-bold text-slate-500">{key}:</span> {String(value)}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function getEventColor(type: string, isText = false) {
  const colors: Record<string, string> = {
    path_started: "emerald",
    task_started: "sky",
    task_completed: "emerald",
    mood_logged: "rose",
    node_added: "amber",
    flow_event: "indigo",
    path_regenerated: "amber",
    error: "red",
  };
  
  const color = colors[type] || "slate";
  
  if (isText) {
    if (color === "emerald") return "bg-emerald-500/20 text-emerald-400";
    if (color === "sky") return "bg-sky-500/20 text-sky-400";
    if (color === "rose") return "bg-rose-500/20 text-rose-400";
    if (color === "amber") return "bg-amber-500/20 text-amber-400";
    if (color === "indigo") return "bg-indigo-500/20 text-indigo-400";
    if (color === "red") return "bg-red-500/20 text-red-400";
    return "bg-slate-500/20 text-slate-400";
  }

  if (color === "emerald") return "border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
  if (color === "sky") return "border-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]";
  if (color === "rose") return "border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
  if (color === "amber") return "border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
  if (color === "indigo") return "border-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]";
  if (color === "red") return "border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
  return "border-slate-500";
}

function formatEventType(type: string): string {
  const map: Record<string, string> = {
    path_started: "بداية مسار",
    task_started: "بدء خطوة",
    task_completed: "إتمام خطوة",
    mood_logged: "تسجيل حالة",
    node_added: "إضافة شخص",
    flow_event: "حدث تدفق",
    path_regenerated: "إعادة بناء",
    error: "خطأ تقني",
  };
  return map[type] || type.toUpperCase();
}

function formatEventPayload(type: string, payload: any): string {
  if (!payload) return "لا توجد تفاصيل إضافية";

  switch (type) {
    case "path_started":
      return `بدأ المسافر مساراً جديداً بعنوان "${payload.pathLabel || 'غير مسمى'}" في منطقة ${payload.zone || 'الوعي'}.`;
    case "task_started":
      return `بدأ المسافر في تنفيذ الخطوة "${payload.taskLabel || 'غير مسماة'}".`;
    case "task_completed":
      return `تم إكمال الخطوة "${payload.taskLabel || 'غير مسماة'}" بنجاح.`;
    case "mood_logged":
      return `قام المسافر بتسجيل حالته الشعورية (النتيجة: ${payload.moodScore || 0}).`;
    case "node_added":
      return `تمت إضافة شخص جديد "${payload.personLabel || 'غير مسمى'}" إلى خريطة العلاقات.`;
    case "flow_event":
      return `تفاعل مع واجهة المستخدم: ${payload.step || 'مجهول'}.`;
    case "path_regenerated":
      return `تمت إعادة توليد المسار بسبب: ${payload.reason || 'تحديث البيانات'}.`;
    default:
      return JSON.stringify(payload).slice(0, 100);
  }
}
