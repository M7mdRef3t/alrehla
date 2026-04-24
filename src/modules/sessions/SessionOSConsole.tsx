/**
 * SessionOS Console — لوحة تحكم الكوتش/المعالج
 *
 * شاشة تفاعلية داخل المنصة الأم تجمع:
 * 1. Intake Requests — طلبات الجلسات الواردة
 * 2. AI Pre-Brief — ملخص ذكي تلقائي قبل كل جلسة
 * 3. Session Management — إدارة الحالات
 * 4. Client Timeline — تاريخ كل عميل
 *
 * يستهلك domain types من domains/sessions
 * ويربط بـ Tajmeed rewards عبر eventBus
 */

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Clock, CheckCircle2, AlertCircle, Plus, Brain,
  User, Calendar, ChevronRight, ChevronLeft, X, Activity, Target,
  FileText, Zap as Sparkles, TrendingUp, Timer, Shield, Phone, Mail,
  ArrowRight, Zap, Heart, AlertTriangle, BarChart3, Eye
} from "lucide-react";
import { eventBus } from "@/shared/events/bus";
import type {
  IntakeFormData,
  SessionRequestStatus,
  AIExtractedBrief,
} from "@/domains/sessions/types";

// ─── Types ──────────────────────────────────────────────────────────────

interface ConsoleSession {
  id: string;
  client: {
    name: string;
    phone: string;
    email?: string;
    country?: string;
  };
  intake: Partial<IntakeFormData>;
  status: SessionRequestStatus;
  sessionType: "assessment" | "followup" | "crisis" | "coaching";
  scheduledAt: string | null;
  notes: string;
  aiBrief: AIExtractedBrief | null;
  createdAt: string;
}

type ConsoleView = "overview" | "detail";
type FilterTab = "all" | "prep_pending" | "brief_generated" | "scheduled" | "completed";

// ─── Constants ──────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  prep_pending:        { label: "بانتظار التحضير", color: "text-amber-400",   bg: "bg-amber-400/10 border-amber-400/20",   icon: <Clock className="w-3.5 h-3.5" /> },
  needs_manual_review: { label: "مراجعة يدوية",   color: "text-orange-400",  bg: "bg-orange-400/10 border-orange-400/20",  icon: <Eye className="w-3.5 h-3.5" /> },
  brief_generated:     { label: "البريف جاهز",    color: "text-purple-400",  bg: "bg-purple-400/10 border-purple-400/20",  icon: <Brain className="w-3.5 h-3.5" /> },
  approved:            { label: "معتمد",          color: "text-blue-400",    bg: "bg-blue-400/10 border-blue-400/20",      icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  scheduled:           { label: "مجدول",          color: "text-cyan-400",    bg: "bg-cyan-400/10 border-cyan-400/20",      icon: <Calendar className="w-3.5 h-3.5" /> },
  in_progress:         { label: "الجلسة الآن",    color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", icon: <Activity className="w-3.5 h-3.5" /> },
  completed:           { label: "اكتملت",         color: "text-slate-400",   bg: "bg-slate-400/10 border-slate-400/20",    icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  cancelled:           { label: "ملغية",          color: "text-rose-400",    bg: "bg-rose-400/10 border-rose-400/20",      icon: <X className="w-3.5 h-3.5" /> },
};

const TYPE_META: Record<string, { label: string; color: string; emoji: string }> = {
  assessment: { label: "تقييم أولي", color: "text-indigo-400", emoji: "🔍" },
  followup:   { label: "متابعة",    color: "text-cyan-400",   emoji: "🔄" },
  crisis:     { label: "طوارئ",     color: "text-rose-400",   emoji: "🚨" },
  coaching:   { label: "كوتشينج",   color: "text-purple-400", emoji: "🎯" },
};

// ─── Mock Data (from localStorage or Supabase later) ────────────────────

function loadSessions(): ConsoleSession[] {
  try {
    const stored = localStorage.getItem("sessionos-console-data");
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return getDefaultSessions();
}

function saveSessions(sessions: ConsoleSession[]): void {
  try {
    localStorage.setItem("sessionos-console-data", JSON.stringify(sessions));
  } catch { /* ignore */ }
}

function getDefaultSessions(): ConsoleSession[] {
  return [
    {
      id: "s-001",
      client: { name: "أحمد م.", phone: "+201012345678", email: "ahmed@example.com", country: "EG" },
      intake: {
        requestReason: "مش فاهم نفسي في العلاقة — بكرهها وبحبها في نفس الوقت",
        urgencyReason: "الموقف بيتكرر كل أسبوع وبدأ يأثر على شغلي",
        biggestChallenge: "مش قادر أحط حدود مع أهلي بدون ما أحس بالذنب",
        impactScore: 8,
        durationOfProblem: "أكتر من سنة",
        sessionGoalType: "فهم نمط متكرر",
        previousSessions: "أخدت كوتشينج مرة واحدة",
      },
      status: "prep_pending",
      sessionType: "assessment",
      scheduledAt: null,
      notes: "",
      aiBrief: null,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "s-002",
      client: { name: "سارة ع.", phone: "+966501234567", country: "SA" },
      intake: {
        requestReason: "علاقتي بأمي سامة وعايزة أعرف أنهيها صح",
        urgencyReason: "محتاجة قبل ما نسافر مع بعض الشهر الجاي",
        biggestChallenge: "كل ما أحاول أحط حدود بتقول إني ناكرة جميل",
        impactScore: 9,
        durationOfProblem: "من صغري",
        sessionGoalType: "قرار محدد",
        crisisFlag: false,
      },
      status: "brief_generated",
      sessionType: "coaching",
      scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      notes: "عميلة واعية جداً. الموضوع مع الأم عميق.",
      aiBrief: {
        visible_problem: "علاقة مختنقة مع الأم — نمط تحكم واستخدام الذنب كأداة ضغط",
        emotional_signal: "شعور عميق بالخيانة تجاه نفسها عند وضع الحدود",
        hidden_need: "تحتاج إذن داخلي بأن الانفصال الصحي ليس خيانة",
        expected_goal: "بناء خريطة حدود واضحة قبل السفر",
        first_hypothesis: "ممكن تكون عندها نمط attachment أساسه الخوف من الهجر",
        session_boundaries: "تجنب الحكم القيمي على الأم — التركيز على سلوكياتها كبيانات",
      },
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "s-003",
      client: { name: "يوسف ك.", phone: "+971501234567", country: "AE" },
      intake: {
        requestReason: "حالة panic attacks مستمرة",
        urgencyReason: "حصلت 3 مرات الأسبوع ده",
        biggestChallenge: "مش فاهم إيه اللي بيطلعها — بتيجي من فراغ",
        impactScore: 10,
        sessionGoalType: "تخفيف ضغط نفسي",
        crisisFlag: true,
      },
      status: "prep_pending",
      sessionType: "crisis",
      scheduledAt: null,
      notes: "",
      aiBrief: null,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
  ];
}

// ─── AI Brief Generator (local simulation) ──────────────────────────────

function generateAIBrief(intake: Partial<IntakeFormData>): AIExtractedBrief {
  return {
    visible_problem: intake.requestReason || "لم يُحدد بعد",
    emotional_signal: intake.urgencyReason
      ? `إشارة عاطفية من السياق: "${intake.urgencyReason.substring(0, 60)}..."`
      : "لا توجد إشارة واضحة",
    hidden_need: intake.biggestChallenge
      ? `الحاجة الخفية وراء التحدي: ${intake.biggestChallenge.substring(0, 80)}`
      : "يحتاج استكشاف أعمق في الجلسة",
    expected_goal: intake.sessionGoalType || "غير محدد",
    first_hypothesis: intake.impactScore && intake.impactScore >= 8
      ? "مستوى التأثير عالي — قد يحتاج تدخل مبكر قبل الجلسة"
      : "مستوى تأثر متوسط — الجلسة العادية كفاية",
    session_boundaries: intake.crisisFlag
      ? "⚠️ تنبيه أمان — تأكد من جاهزية بروتوكول الأزمات"
      : "لا إشارات خطر — الجلسة آمنة للمضي",
  };
}

// ─── Component ──────────────────────────────────────────────────────────

export default function SessionOSConsole() {
  const [sessions, setSessions] = useState<ConsoleSession[]>([]);
  const [view, setView] = useState<ConsoleView>("overview");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);

  // Load on mount
  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  // Save on change
  useEffect(() => {
    if (sessions.length > 0) saveSessions(sessions);
  }, [sessions]);

  // Derived
  const selected = sessions.find(s => s.id === selectedId) ?? null;
  const filtered = filterTab === "all"
    ? sessions
    : sessions.filter(s => s.status === filterTab);

  const counts = {
    all: sessions.length,
    prep_pending: sessions.filter(s => s.status === "prep_pending").length,
    brief_generated: sessions.filter(s => s.status === "brief_generated").length,
    scheduled: sessions.filter(s => s.status === "scheduled").length,
    completed: sessions.filter(s => s.status === "completed").length,
  };

  const crisisCount = sessions.filter(s => s.intake.crisisFlag).length;

  // ── Handlers ──

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setView("detail");
  }, []);

  const handleBack = useCallback(() => {
    setView("overview");
    setSelectedId(null);
  }, []);

  const handleGenerateBrief = useCallback(async (session: ConsoleSession) => {
    setIsGeneratingBrief(true);
    // Simulate AI processing
    await new Promise(r => setTimeout(r, 2000));
    const brief = generateAIBrief(session.intake);

    setSessions(prev =>
      prev.map(s =>
        s.id === session.id
          ? { ...s, aiBrief: brief, status: "brief_generated" as SessionRequestStatus }
          : s
      )
    );
    setIsGeneratingBrief(false);

    eventBus.emit("session:session_completed", { sessionId: session.id });
  }, []);

  const handleStatusChange = useCallback((id: string, newStatus: SessionRequestStatus) => {
    setSessions(prev =>
      prev.map(s => s.id === id ? { ...s, status: newStatus } : s)
    );
  }, []);

  const handleUpdateNotes = useCallback((id: string, notes: string) => {
    setSessions(prev =>
      prev.map(s => s.id === id ? { ...s, notes } : s)
    );
  }, []);

  // ── Time helpers ──
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} دقيقة`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ساعة`;
    return `${Math.floor(hours / 24)} يوم`;
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen text-white font-sans bg-[#03050a] selection:bg-teal-500/30 selection:text-teal-200 relative overflow-hidden"
      dir="rtl"
    >
      {/* ── Background Elements ── */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-teal-900/10 via-emerald-900/5 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.015] pointer-events-none mix-blend-overlay" />

      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b border-white/[0.05] bg-[#03050a]/80 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {view === "detail" && (
              <button
                onClick={handleBack}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight">
                  Session<span className="text-teal-400">OS</span>
                  <span className="text-xs text-slate-500 font-bold mr-2">Console</span>
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  {sessions.length} طلب · {counts.prep_pending} بانتظار التحضير
                </p>
              </div>
            </div>
          </div>

          {/* Crisis Alert Badge */}
          {crisisCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-rose-400 text-xs font-black">{crisisCount} طوارئ</span>
            </div>
          )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {view === "overview" ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: 20 }}
            className="max-w-7xl mx-auto px-6 py-8 space-y-8"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {(["all", "prep_pending", "brief_generated", "scheduled", "completed"] as FilterTab[]).map(tab => {
                const isActive = filterTab === tab;
                const meta = tab === "all"
                  ? { label: "الكل", color: "text-white", bg: "bg-white/5 border-white/10", icon: <BarChart3 className="w-4 h-4" /> }
                  : STATUS_META[tab] ?? { label: tab, color: "text-slate-400", bg: "bg-white/5 border-white/10", icon: <Activity className="w-4 h-4" /> };
                return (
                  <button
                    key={tab}
                    onClick={() => setFilterTab(tab)}
                    className={`p-4 rounded-2xl border transition-all text-right space-y-2 ${
                      isActive
                        ? `${meta.bg} ${meta.color} ring-1 ring-current/20`
                        : "bg-white/[0.02] border-white/5 text-slate-500 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-2xl font-black ${isActive ? meta.color : "text-white"}`}>
                        {counts[tab]}
                      </span>
                      <span className={isActive ? meta.color : "text-slate-700"}>
                        {meta.icon}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider">{meta.label}</p>
                  </button>
                );
              })}
            </div>

            {/* Sessions List */}
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                  الطلبات الواردة
                </h2>
              </div>

              {filtered.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-8 h-8 text-slate-700" />
                  </div>
                  <p className="text-slate-500 font-bold">لا توجد طلبات في هذا التصنيف</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filtered.map((session) => {
                    const statusMeta = STATUS_META[session.status] ?? STATUS_META.prep_pending;
                    const typeMeta = TYPE_META[session.sessionType] ?? TYPE_META.assessment;
                    const isCrisis = session.intake.crisisFlag;
                    const hasAIBrief = !!session.aiBrief;

                    return (
                      <motion.button
                        key={session.id}
                        onClick={() => handleSelect(session.id)}
                        whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                        className="w-full text-right px-6 py-5 flex items-start gap-4 transition-all group"
                      >
                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 border ${
                          isCrisis
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : hasAIBrief
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                              : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                        }`}>
                          {session.client.name.charAt(0)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-black text-white text-sm truncate">{session.client.name}</h3>
                            {isCrisis && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md text-rose-400">
                                <AlertTriangle className="w-3 h-3" />
                                <span className="text-[9px] font-black uppercase">طوارئ</span>
                              </span>
                            )}
                            {hasAIBrief && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-md text-purple-400">
                                <Brain className="w-3 h-3" />
                                <span className="text-[9px] font-black uppercase">بريف جاهز</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1 mb-1.5">
                            {session.intake.requestReason || "لم يُذكر سبب"}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500">
                            <span className={`font-bold ${typeMeta.color}`}>
                              {typeMeta.emoji} {typeMeta.label}
                            </span>
                            <span className="text-slate-700">·</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              منذ {timeAgo(session.createdAt)}
                            </span>
                            {session.intake.impactScore && (
                              <>
                                <span className="text-slate-700">·</span>
                                <span className={`font-bold ${
                                  session.intake.impactScore >= 8 ? "text-rose-400" :
                                  session.intake.impactScore >= 5 ? "text-amber-400" : "text-emerald-400"
                                }`}>
                                  تأثير: {session.intake.impactScore}/10
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-xl border ${statusMeta.bg} ${statusMeta.color}`}>
                            {statusMeta.icon}
                            {statusMeta.label}
                          </span>
                          <ChevronLeft className="w-4 h-4 text-slate-700 group-hover:text-white transition-colors" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        ) : selected ? (
          /* ─── Detail View ─── */
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="max-w-5xl mx-auto px-6 py-8 space-y-8"
          >
            {/* Client Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border ${
                    selected.intake.crisisFlag
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                  }`}>
                    {selected.client.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">{selected.client.name}</h2>
                    <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                      {selected.client.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          <span dir="ltr">{selected.client.phone}</span>
                        </span>
                      )}
                      {selected.client.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {selected.client.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Selector */}
              <div className="flex gap-2 flex-wrap">
                {(["prep_pending", "brief_generated", "scheduled", "in_progress", "completed"] as SessionRequestStatus[]).map(s => {
                  const meta = STATUS_META[s];
                  if (!meta) return null;
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(selected.id, s)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black border transition-all ${
                        selected.status === s
                          ? `${meta.bg} ${meta.color}`
                          : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10"
                      }`}
                    >
                      {meta.icon}
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column — Intake Data */}
              <div className="space-y-6">
                {/* Intake Summary */}
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    بيانات الاستبيان (Intake)
                  </h3>

                  <div className="space-y-4">
                    {selected.intake.requestReason && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-teal-500 uppercase tracking-wider">سبب الطلب</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{selected.intake.requestReason}</p>
                      </div>
                    )}
                    {selected.intake.biggestChallenge && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-wider">أكبر تحدي</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{selected.intake.biggestChallenge}</p>
                      </div>
                    )}
                    {selected.intake.urgencyReason && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">سبب الاستعجال</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{selected.intake.urgencyReason}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      {selected.intake.impactScore && (
                        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
                          <p className="text-[9px] font-black text-slate-500 uppercase mb-1">مستوى التأثير</p>
                          <p className={`text-2xl font-black ${
                            selected.intake.impactScore >= 8 ? "text-rose-400" :
                            selected.intake.impactScore >= 5 ? "text-amber-400" : "text-emerald-400"
                          }`}>
                            {selected.intake.impactScore}<span className="text-sm text-slate-600">/10</span>
                          </p>
                        </div>
                      )}
                      {selected.intake.durationOfProblem && (
                        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
                          <p className="text-[9px] font-black text-slate-500 uppercase mb-1">مدة المشكلة</p>
                          <p className="text-sm font-black text-slate-300">{selected.intake.durationOfProblem}</p>
                        </div>
                      )}
                    </div>

                    {selected.intake.crisisFlag && (
                      <div className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                        <Shield className="w-5 h-5 text-rose-400 shrink-0" />
                        <div>
                          <p className="text-xs font-black text-rose-400">⚠️ تنبيه أمان</p>
                          <p className="text-[11px] text-rose-300/70">هذا العميل أشار لمؤشرات خطر — تأكد من بروتوكول الأزمات</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Session Notes */}
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    ملاحظات الجلسة
                  </h3>
                  <textarea
                    value={selected.notes}
                    onChange={(e) => handleUpdateNotes(selected.id, e.target.value)}
                    placeholder="سجّل ملاحظاتك هنا..."
                    rows={5}
                    className="w-full text-sm text-slate-300 bg-white/[0.03] border border-white/5 rounded-2xl p-4 resize-none outline-none focus:border-teal-500/30 transition-colors placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Right Column — AI Brief */}
              <div className="space-y-6">
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-purple-400 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      AI Pre-Brief — ملخص ذكي قبل الجلسة
                    </h3>
                    {!selected.aiBrief && (
                      <button
                        onClick={() => handleGenerateBrief(selected)}
                        disabled={isGeneratingBrief}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl text-xs font-black hover:bg-purple-500/20 transition-all disabled:opacity-50"
                      >
                        {isGeneratingBrief ? (
                          <span className="animate-pulse">جاري التحليل...</span>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            صنّع البريف
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {isGeneratingBrief ? (
                    <div className="space-y-3 py-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="space-y-1.5">
                          <div className="h-3 bg-purple-500/10 rounded animate-pulse" style={{ width: `${30 + i * 15}%` }} />
                          <div className="h-3 bg-purple-500/5 rounded animate-pulse" style={{ width: `${50 + i * 10}%` }} />
                        </div>
                      ))}
                    </div>
                  ) : selected.aiBrief ? (
                    <div className="space-y-4">
                      {[
                        { key: "visible_problem",    label: "المشكلة الظاهرة",    color: "text-teal-400",   border: "border-teal-500/20" },
                        { key: "emotional_signal",   label: "الإشارة العاطفية",    color: "text-amber-400",  border: "border-amber-500/20" },
                        { key: "hidden_need",        label: "الحاجة الخفية",      color: "text-purple-400", border: "border-purple-500/20" },
                        { key: "expected_goal",      label: "الهدف المتوقع",      color: "text-cyan-400",   border: "border-cyan-500/20" },
                        { key: "first_hypothesis",   label: "الفرضية الأولى",     color: "text-indigo-400", border: "border-indigo-500/20" },
                        { key: "session_boundaries", label: "حدود الجلسة",       color: "text-rose-400",   border: "border-rose-500/20" },
                      ].map(({ key, label, color, border }) => (
                        <div key={key} className={`pr-3 border-r-2 ${border} space-y-1`}>
                          <p className={`text-[10px] font-black uppercase tracking-wider ${color}`}>{label}</p>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            {(selected.aiBrief as any)?.[key] || "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto">
                        <Brain className="w-6 h-6 text-purple-500/40" />
                      </div>
                      <p className="text-sm text-slate-500">لم يُولّد البريف بعد</p>
                      <p className="text-xs text-slate-600">اضغط &quot;صنّع البريف&quot; لتوليد ملخص ذكي من بيانات الاستبيان</p>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    إجراءات سريعة
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleStatusChange(selected.id, "scheduled")}
                      className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/5 hover:from-cyan-500/20 hover:to-blue-500/10 border border-cyan-500/20 hover:border-cyan-500/40 transition-all text-cyan-400 gap-2 group"
                    >
                      <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black">جدول الجلسة</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(selected.id, "in_progress")}
                      className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 hover:from-emerald-500/20 hover:to-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all text-emerald-400 gap-2 group"
                    >
                      <Activity className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black">ابدأ الجلسة</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(selected.id, "completed")}
                      className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-slate-500/10 to-gray-500/5 hover:from-slate-500/20 hover:to-gray-500/10 border border-slate-500/20 hover:border-slate-500/40 transition-all text-slate-400 gap-2 group"
                    >
                      <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black">أنهِ الجلسة</span>
                    </button>
                    <button
                      onClick={() => {
                        if (selected.client.phone) {
                          window.open(`https://wa.me/${selected.client.phone.replace(/\+/g, "")}`, "_blank");
                        }
                      }}
                      className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 hover:from-green-500/20 hover:to-emerald-500/10 border border-green-500/20 hover:border-green-500/40 transition-all text-green-400 gap-2 group"
                    >
                      <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black">واتساب</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
