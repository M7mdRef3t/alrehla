"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Clock, CheckCircle2, AlertCircle, Plus, Brain,
  User, Calendar, ChevronRight, X, Activity, Target, FileText,
  Sparkles, TrendingUp, Timer
} from "lucide-react";
import { isSupabaseReady, supabase } from "@/services/supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────────

type SessionStatus = "pending" | "active" | "done" | "cancelled";

interface Session {
  id: string;
  client_name: string;
  client_phone?: string;
  session_type: "assessment" | "followup" | "crisis" | "coaching";
  status: SessionStatus;
  scheduled_at: string | null;
  notes: string;
  ai_summary?: string;
  goals?: string;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:   { label: "مستني", color: "text-amber-400",  bg: "bg-amber-400/10 border-amber-400/20",  icon: <Clock className="w-3.5 h-3.5" /> },
  active:    { label: "شغال دلوقتي",  color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", icon: <Activity className="w-3.5 h-3.5" /> },
  done:      { label: "خلصت خلاص", color: "text-slate-400",   bg: "bg-slate-400/10 border-slate-400/20",   icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  cancelled: { label: "اتلغت",  color: "text-rose-400",   bg: "bg-rose-400/10 border-rose-400/20",    icon: <X className="w-3.5 h-3.5" /> }
};

const TYPE_CONFIG: Record<Session["session_type"], { label: string; color: string }> = {
  assessment: { label: "تقييم أولي",       color: "text-indigo-400" },
  followup:   { label: "متابعة",      color: "text-cyan-400" },
  crisis:     { label: "طوارئ",       color: "text-rose-400" },
  coaching:   { label: "كوتشينج",     color: "text-purple-400" }
};

const EMPTY_SESSION: Omit<Session, "id" | "created_at"> = {
  client_name: "",
  client_phone: "",
  session_type: "assessment",
  status: "pending",
  scheduled_at: null,
  notes: "",
  ai_summary: "",
  goals: ""
};

// ─── SessionOSPanel ───────────────────────────────────────────────────────────────────

export const SessionOSPanel: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selected, setSelected] = useState<Session | null>(null);
  const [form, setForm] = useState(EMPTY_SESSION);
  const [filter, setFilter] = useState<SessionStatus | "all">("all");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isMasaratRunning, setIsMasaratRunning] = useState(false);

  // ─── Load sessions ────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    if (isSupabaseReady && supabase) {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setSessions(data as Session[]);
      } else {
        // fallback to localStorage for offline capability
        loadFromLocalStorage();
      }
    } else {
      loadFromLocalStorage();
    }
    setIsLoading(false);
  };

  const loadFromLocalStorage = () => {
    try {
      const stored = window.localStorage.getItem("session-os-data");
      if (stored) setSessions(JSON.parse(stored));
    } catch { /* ignore */ }
  };

  const saveToLocalStorage = (data: Session[]) => {
    try {
      window.localStorage.setItem("session-os-data", JSON.stringify(data));
    } catch { /* ignore */ }
  };

  // ─── CRUD ────────────────────────────────────────────────────────────────────────────
  const createSession = async () => {
    if (!form.client_name.trim()) return;
    
    const newSession: Session = {
      ...form,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };

    // Try Supabase first
    if (isSupabaseReady && supabase) {
      const { data, error } = await supabase
        .from("sessions")
        .insert([newSession])
        .select()
        .single();
      if (!error && data) {
        setSessions(prev => [data as Session, ...prev]);
        setIsCreating(false);
        setForm(EMPTY_SESSION);
        return;
      }
    }

    // fallback
    const updated = [newSession, ...sessions];
    setSessions(updated);
    saveToLocalStorage(updated);
    setIsCreating(false);
    setForm(EMPTY_SESSION);
  };

  const updateStatus = async (id: string, newStatus: SessionStatus) => {
    const updated = sessions.map(s => s.id === id ? { ...s, status: newStatus } : s);
    setSessions(updated);
    saveToLocalStorage(updated);
    
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: newStatus } : null);

    if (isSupabaseReady && supabase) {
      await supabase.from("sessions").update({ status: newStatus }).eq("id", id);
    }
  };

  const updateNotes = async (id: string, notes: string) => {
    const updated = sessions.map(s => s.id === id ? { ...s, notes } : s);
    setSessions(updated);
    saveToLocalStorage(updated);
    setSelected(prev => prev ? { ...prev, notes } : null);

    if (isSupabaseReady && supabase) {
      await supabase.from("sessions").update({ notes }).eq("id", id);
    }
  };

  const generateAISummary = async (session: Session) => {
    setIsGeneratingAI(true);
    // Simulate AI generation (replace with real Gemini call if needed)
    await new Promise(r => setTimeout(r, 1500));
    const summary = `📝 ملخص الجلسة لـ ${session.client_name}: نوع الجلسة "${TYPE_CONFIG[session.session_type].label}". المحاور: ${session.goals || "مش متحدد"}. تقييم سريع بناءً على ملاحظاتك.`;
    
    const updated = sessions.map(s => s.id === session.id ? { ...s, ai_summary: summary } : s);
    setSessions(updated);
    saveToLocalStorage(updated);
    if (selected?.id === session.id) setSelected(prev => prev ? { ...prev, ai_summary: summary } : null);

    if (isSupabaseReady && supabase) {
      await supabase.from("sessions").update({ ai_summary: summary }).eq("id", session.id);
    }
    setIsGeneratingAI(false);
  };

  const triggerWhatsApp = async (session: Session) => {
    if (!session.ai_summary) {
      alert("لازم تولد خلاصة الأول (AI Summary) عشان نبعتها للعميل!");
      return;
    }
    setIsSendingWhatsApp(true);
    try {
      const res = await fetch("/api/admin/sovereign/whatsapp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert("✅ تم دفع الرسالة للواتساب بنجاح!");
    } catch (e: any) {
      alert("❌ حصل مشكلة: " + e.message);
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const triggerMasarat = async (session: Session) => {
    setIsMasaratRunning(true);
    try {
      const res = await fetch("/api/admin/sovereign/masarat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const summary = data.ai_summary;
      const updated = sessions.map(s => s.id === session.id ? { ...s, ai_summary: summary, status: "active" as SessionStatus } : s);
      setSessions(updated);
      saveToLocalStorage(updated);
      if (selected?.id === session.id) setSelected(prev => prev ? { ...prev, ai_summary: summary, status: "active" as SessionStatus } : null);
      
      alert("✅ محرك مسارات خلص التحليل!");
    } catch (e: any) {
      alert("❌ حصل مشكلة في المحرك: " + e.message);
    } finally {
      setIsMasaratRunning(false);
    }
  };

  // ─── Computed ─────────────────────────────────────────────────────────────────────
  const filtered = filter === "all" ? sessions : sessions.filter(s => s.status === filter);
  const counts = {
    pending: sessions.filter(s => s.status === "pending").length,
    active: sessions.filter(s => s.status === "active").length,
    done: sessions.filter(s => s.status === "done").length,
    cancelled: sessions.filter(s => s.status === "cancelled").length
  };

  // ─── Render ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-teal-400" />
            </div>
            Session OS — غرفة التحكم والسيطرة
          </h2>
          <p className="text-slate-400 text-sm font-medium">
            نظام تتبع الرحلة - من أول الطلب لحد ما نبني الصخرة اللي جواك
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm rounded-2xl transition-all shadow-lg shadow-teal-500/20 hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          افتح جلسة جديدة
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["pending", "active", "done", "cancelled"] as SessionStatus[]).map(s => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setFilter(filter === s ? "all" : s)}
              className={`p-4 rounded-2xl border transition-all text-right space-y-2 ${
                filter === s ? cfg.bg + " " + cfg.color : "bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/5"
              } ${cfg.bg}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-black ${filter === s ? cfg.color : "text-white"}`}>
                  {counts[s]}
                </span>
                <span className={filter === s ? cfg.color : "text-slate-600"}>{cfg.icon}</span>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className={`grid gap-6 ${selected ? "md:grid-cols-2" : "grid-cols-1"}`}>

        {/* Sessions List */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {filter === "all" ? `كل الناس (${sessions.length})` : `${STATUS_CONFIG[filter].label} (${filtered.length})`}
            </h3>
            {filter !== "all" && (
              <button onClick={() => setFilter("all")} className="text-[10px] text-slate-500 hover:text-white transition-colors">
                ورينا الكل
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center mx-auto">
                <MessageSquare className="w-8 h-8 text-slate-700" />
              </div>
              <p className="text-slate-500 font-bold">مفيش جلسات لسه هنا</p>
              <button
                onClick={() => setIsCreating(true)}
                className="text-teal-400 text-sm font-black hover:text-teal-300 transition-colors"
              >
                + ضيف أول مسافر
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
              {filtered.map((session) => {
                const cfg = STATUS_CONFIG[session.status];
                const typeCfg = TYPE_CONFIG[session.session_type];
                const isSelected = selected?.id === session.id;
                return (
                  <motion.button
                    key={session.id}
                    onClick={() => setSelected(isSelected ? null : session)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`w-full text-right p-4 rounded-2xl border transition-all flex items-start gap-4 group ${
                      isSelected
                        ? "bg-teal-500/10 border-teal-500/30"
                        : "bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-slate-500" />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-black text-white text-sm truncate">{session.client_name}</p>
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className={`text-[10px] font-black ${typeCfg.color}`}>{typeCfg.label}</span>
                        {session.scheduled_at && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(session.scheduled_at).toLocaleDateString("ar-EG")}
                          </span>
                        )}
                      </div>
                      {session.notes && (
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{session.notes}</p>
                      )}
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-700 shrink-0 mt-3 transition-transform group-hover:text-white ${isSelected ? "rotate-90 text-teal-400" : ""}`} />
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Session Detail Panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-6"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white">{selected.client_name}</h3>
                  <p className={`text-sm font-bold ${TYPE_CONFIG[selected.session_type].color}`}>
                    {TYPE_CONFIG[selected.session_type].label}
                  </p>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Progression */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">غير حالته دلوقتي</p>
                <div className="flex gap-2 flex-wrap">
                  {(["pending", "active", "done", "cancelled"] as SessionStatus[]).map(s => {
                    const cfg = STATUS_CONFIG[s];
                    return (
                      <button
                        key={s}
                        onClick={() => updateStatus(selected.id, s)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black border transition-all ${
                          selected.status === s ? `${cfg.bg} ${cfg.color}` : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10"
                        }`}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Goals */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" />
                  ناوي على إيه؟ (الأهداف)
                </p>
                <p className={`text-sm ${selected.goals ? "text-slate-300" : "text-slate-600 italic"}`}>
                  {selected.goals || "لسه مفيش أهداف واضحة."}
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  كواليس الجلسة (ملاحظات)
                </p>
                <textarea
                  value={selected.notes}
                  onChange={(e) => updateNotes(selected.id, e.target.value)}
                  placeholder="سجل اللي حصل في الرحلة..."
                  rows={4}
                  className="w-full text-sm text-slate-300 bg-white/[0.03] border border-white/10 rounded-2xl p-4 resize-none outline-none focus:border-teal-500/40 transition-colors placeholder:text-slate-600"
                />
              </div>

              {/* AI Summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5" />
                    تحليل عين الصقر (AI Summary)
                  </p>
                  <button
                    onClick={() => generateAISummary(selected)}
                    disabled={isGeneratingAI}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl hover:bg-purple-500/20 transition-all disabled:opacity-50"
                  >
                    {isGeneratingAI ? (
                      <span className="animate-pulse">بنحلل الدماغ...</span>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        هات الخلاصة
                      </>
                    )}
                  </button>
                </div>
                {selected.ai_summary ? (
                  <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl text-sm text-slate-300 leading-relaxed">
                    {selected.ai_summary}
                  </div>
                ) : (
                  <p className="text-slate-600 text-sm italic">
                    لسه مفيش خلاصة.. دوس "هات الخلاصة" وشوف الأوركل هيقولك إيه.
                  </p>
                )}
              </div>

              {/* ── Sovereign Action Bar ── */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" />
                  أدوات القيادة السيادية
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button 
                    disabled={isSendingWhatsApp}
                    onClick={() => triggerWhatsApp(selected)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 hover:from-emerald-500/20 hover:to-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all text-emerald-400 gap-2 group disabled:opacity-50"
                  >
                    {isSendingWhatsApp ? <Activity className="w-5 h-5 animate-spin" /> : <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                    <span className="text-[10px] font-black">{isSendingWhatsApp ? "جاري الإرسال.." : "أتمتة الواتساب"}</span>
                  </button>
                  <button 
                    disabled={isMasaratRunning}
                    onClick={() => triggerMasarat(selected)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/5 hover:from-cyan-500/20 hover:to-blue-500/10 border border-cyan-500/20 hover:border-cyan-500/40 transition-all text-cyan-400 gap-2 group disabled:opacity-50"
                  >
                    {isMasaratRunning ? <Sparkles className="w-5 h-5 animate-pulse" /> : <Target className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                    <span className="text-[10px] font-black">{isMasaratRunning ? "المحرك شغال.." : "تحليل مسارات"}</span>
                  </button>
                  <button 
                    onClick={() => alert("سيتم عرض عائد الطاقة والأموال الخاص بهذه الجلسة.")}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 hover:from-amber-500/20 hover:to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all text-amber-400 gap-2 group"
                  >
                    <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black">Psychological P&amp;L</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Session Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setIsCreating(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#0B0F19] border border-white/10 rounded-3xl p-8 space-y-6"
              dir="rtl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Timer className="w-5 h-5 text-teal-400" />
                  افتح جلسة جديدة
                </h3>
                <button onClick={() => setIsCreating(false)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">اسم المسافر *</label>
                  <input
                    type="text"
                    value={form.client_name}
                    onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                    placeholder="بيانات المسافر..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-teal-500/50 transition-colors placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">رقم الواتساب</label>
                  <input
                    type="text"
                    value={form.client_phone}
                    onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))}
                    placeholder="01xxxxxxxxx"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-teal-500/50 transition-colors placeholder:text-slate-600"
                    dir="ltr"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">نوع الجلسة</label>
                    <select
                      value={form.session_type}
                      onChange={e => setForm(f => ({ ...f, session_type: e.target.value as Session["session_type"] }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-teal-500/50 transition-colors"
                    >
                      <option value="assessment">تقييم مبدئي</option>
                      <option value="followup">متابعة</option>
                      <option value="crisis">طوارئ</option>
                      <option value="coaching">كوتشينج</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">ميعادنا إمتى؟</label>
                    <input
                      type="datetime-local"
                      value={form.scheduled_at || ""}
                      onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-teal-500/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">ناوي على إيه؟ (الأهداف)</label>
                  <textarea
                    value={form.goals}
                    onChange={e => setForm(f => ({ ...f, goals: e.target.value }))}
                    placeholder="أهداف الجلسة بوضوح..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-teal-500/50 transition-colors resize-none placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={createSession}
                  disabled={!form.client_name.trim()}
                  className="flex-1 py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  ثبّت الجلسة الآن
                </button>
                <button
                  onClick={() => { setIsCreating(false); setForm(EMPTY_SESSION); }}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-400 font-black rounded-2xl transition-all border border-white/10"
                >
                  تراجع
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SessionOSPanel;
