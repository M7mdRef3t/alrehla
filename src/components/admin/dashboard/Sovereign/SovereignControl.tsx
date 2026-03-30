import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, Send, Zap, Wind, AlertCircle, Users, Activity, ShieldAlert, History } from "lucide-react";
import { supabase, isSupabaseReady } from "../../../../services/supabaseClient";
import { fetchOverviewStats, fetchAlertIncidents, fetchBroadcasts, type OverviewStats, type AlertIncident } from "../../../../services/adminApi";
import { useAdminState, type AdminBroadcast } from "../../../../state/adminState";

export const SovereignControl: FC = () => {
  const [harmonyOverride, setHarmonyOverride] = useState<number>(0.8);
  const [isSaving, setIsSaving] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Sanctuary Pulse State
  const [liveStats, setLiveStats] = useState<OverviewStats | null>(null);
  const [incidents, setIncidents] = useState<AlertIncident[] | null>(null);
  const [history, setHistory] = useState<AdminBroadcast[]>([]);
  const [isLoadingPulse, setIsLoadingPulse] = useState(true);

  useEffect(() => {
    if (!isSupabaseReady || !supabase) return;
    
    const refreshData = async () => {
      const adminClient = supabase;
      if (!adminClient) return;

      const [data, stats, alerts, historicalBroadcasts] = await Promise.all([
        adminClient.from("system_settings").select("value").eq("key", "global_harmony_override").maybeSingle(),
        fetchOverviewStats(),
        fetchAlertIncidents(),
        fetchBroadcasts()
      ]);

      if (data?.data && typeof data.data.value === "number") {
        setHarmonyOverride(data.data.value);
      }
      setLiveStats(stats);
      setIncidents(alerts);
      setHistory(historicalBroadcasts ?? []);
      setIsLoadingPulse(false);

      // Update global alert state for Sidebar pulse
      const hasCriticalAlert = !!alerts?.some(i => i.severity === 'critical' || i.severity === 'high');
      if (useAdminState.getState().hasSovereignAlert !== hasCriticalAlert) {
        useAdminState.getState().setHasSovereignAlert(hasCriticalAlert);
      }
    };

    refreshData();
    const interval = setInterval(refreshData, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateHarmony = async (val: number) => {
    setHarmonyOverride(val);
    if (!isSupabaseReady || !supabase) return;
    setIsSaving(true);
    await supabase.from("system_settings").upsert({
      key: "global_harmony_override",
      value: val
    });
    setIsSaving(false);
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim() || !isSupabaseReady || !supabase) return;
    setIsSaving(true);
    await supabase.from("system_settings").upsert({
      key: "sovereign_broadcast",
      value: {
        message: broadcastMessage,
        timestamp: Date.now(),
        id: Math.random().toString(36).substr(2, 9)
      }
    });
    setBroadcastMessage("");
    setIsSaving(false);
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-amber-500">
          <Shield className="w-6 h-6" />
          <h1 className="text-3xl font-black uppercase tracking-tighter">مركز السيادة الإدراكية</h1>
        </div>
        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">تحكم في طاقة الملاذ ورسائل الروح</p>
      </header>

      {/* Sanctuary Pulse - Real-time Snapshot */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-12 h-12 text-teal-400" />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">أرواح متصلة الآن</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white tabular-nums">
              {isLoadingPulse ? "..." : (liveStats?.activeNow ?? 0).toLocaleString("ar-EG")}
            </span>
            <span className="text-[10px] text-teal-500 font-bold animate-pulse">LIVE</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-12 h-12 text-amber-400" />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">مؤشر الصفاء الجماعي</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white tabular-nums">
              {isLoadingPulse ? "..." : (liveStats?.avgMood ?? 0).toFixed(1)}
            </span>
            <span className="text-[10px] text-amber-500 font-bold">HARMONY</span>
          </div>
        </div>

        <div className={`bg-slate-900/40 border p-5 rounded-2xl backdrop-blur-xl relative overflow-hidden group transition-colors ${incidents && incidents.length > 0 ? "border-rose-500/30 bg-rose-500/5" : "border-white/5"}`}>
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldAlert className={`w-12 h-12 ${incidents && incidents.length > 0 ? "text-rose-400" : "text-emerald-400"}`} />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">حالة استقرار الملاذ</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-black uppercase ${incidents && incidents.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {isLoadingPulse ? "..." : (incidents && incidents.length > 0 ? "تنبيه حرج" : "مستقر جداً")}
            </span>
          </div>
        </div>
      </section>

      {/* Sovereign Emergency Alert */}
      {incidents && incidents.some(i => i.severity === 'critical' || i.severity === 'high') && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-500/10 border-2 border-amber-500/30 p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6 shadow-[0_0_30px_rgba(245,158,11,0.1)]"
        >
          <div className="bg-amber-500/20 p-4 rounded-2xl">
            <ShieldAlert className="w-8 h-8 text-amber-500" />
          </div>
          <div className="flex-1 text-center md:text-right space-y-1">
            <h3 className="text-amber-500 font-black uppercase tracking-tight">نداء عاجل للسيادة</h3>
            <p className="text-amber-200/70 text-sm">تم رصد ضجيج معرفي مرتفع أو خلل في بعض المسارات. ننصح ببث "نداء الحاكم" لتهدئة الأرواح.</p>
          </div>
          <button 
            onClick={() => {
              const el = document.getElementById('broadcast-area');
              el?.scrollIntoView({ behavior: 'smooth' });
              const area = el?.querySelector('textarea');
              area?.focus();
            }}
            className="px-6 py-3 bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-amber-400 transition-colors"
          >
            استجابة فورية
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Harmony Control */}
        <section className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl space-y-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-white font-bold">
              <Wind className="w-5 h-5 text-teal-400" />
              توازن التناغم العالمي
            </h2>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${isSaving ? "bg-teal-500/20 text-teal-400 animate-pulse" : "bg-white/5 text-slate-500"}`}>
              {isSaving ? "Syncing..." : "Fixed State"}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest">
              <span>ضجيج (Noisy)</span>
              <span>سكينة (Zen)</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="1.0"
              step="0.05"
              value={harmonyOverride}
              onChange={(e) => handleUpdateHarmony(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
            <div className="flex items-center gap-2 p-4 bg-teal-400/5 rounded-2xl border border-teal-400/10">
              <Zap className="w-4 h-4 text-teal-400" />
              <p className="text-xs text-teal-300 leading-relaxed">
                هذا التحكم يغير **لون ونبض التنفس** لجميع المستخدمين في نفس اللحظة.
              </p>
            </div>
          </div>
        </section>

        {/* Global Broadcast */}
        <section id="broadcast-area" className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl space-y-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-white font-bold">
              <Sparkles className="w-5 h-5 text-purple-400" />
              نداء الحاكم
            </h2>
          </div>

          <div className="space-y-4">
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="اكتب رسالة نورانية تظهر للجميع..."
              className="w-full h-32 bg-slate-800/50 border border-white/5 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-500/50 transition-all resize-none"
            />
            <button
              onClick={handleSendBroadcast}
              disabled={!broadcastMessage.trim() || isSaving}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 py-3 rounded-2xl text-white font-bold text-sm shadow-lg shadow-purple-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              <Send className="w-4 h-4" />
              بث الرسالة للعالم
            </button>
            <AnimatePresence>
              {showConfirm && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 justify-center text-teal-400 text-[10px] font-black uppercase"
                >
                  <AlertCircle className="w-3 h-3" />
                  تم البث بنجاح
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>

      {/* Sovereign Chronicle (سجل السيادة) */}
      <section className="bg-slate-900/30 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="flex items-center gap-2 p-6 border-b border-white/5 bg-white/5">
          <History className="w-5 h-5 text-slate-400" />
          <h2 className="text-sm font-black text-white uppercase tracking-widest">سجل السيادة (آخر النداءات)</h2>
        </div>
        <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto custom-scrollbar">
          {history.length > 0 ? (
            history.slice(0, 5).map((item) => (
              <div key={item.id} className="p-5 hover:bg-white/5 transition-colors group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{item.title || "نداء السيادة"}</span>
                  <span className="text-[10px] text-slate-600 font-mono">{new Date(item.createdAt).toLocaleString("ar-EG")}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-200 transition-colors">{item.body}</p>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-slate-600 text-xs italic">لا توجد سجلات تاريخية بعد.</div>
          )}
        </div>
      </section>

      <footer className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl">
        <p className="text-xs text-amber-500/80 leading-relaxed text-center font-bold italic">
          "تذكر، هذه السلطة مصممة لنشر السكينة، استخدم نداء الحاكم بحكمة لتعزيز الرحلة المشتركة."
        </p>
      </footer>
    </div>
  );
};
