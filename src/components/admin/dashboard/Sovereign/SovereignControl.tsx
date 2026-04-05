import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, Send, Zap, Wind, AlertCircle, Users, Activity, ShieldAlert, History, Radio, TrendingUp } from "lucide-react";
import { AdminTooltip } from "../Overview/components/AdminTooltip";
import { supabase, isSupabaseReady } from "../../../../services/supabaseClient";
import { fetchOverviewStats, fetchAlertIncidents, fetchBroadcasts, type OverviewStats, type AlertIncident } from "../../../../services/adminApi";
import { useAdminState, type AdminBroadcast } from "../../../../state/adminState";
import { CollapsibleSection } from "../../ui/CollapsibleSection";
import { IllusionRadar } from "./IllusionRadar";
import { SovereignSpreadCommand } from "./SovereignSpreadCommand";

const CirclePulseIcon: FC<{ className?: string }> = ({ className }) => (
  <div className={`relative ${className}`}>
    <motion.div
      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="absolute inset-0 bg-current rounded-full blur-md opacity-20"
    />
    <Radio className="relative z-10 w-full h-full" />
  </div>
);

export const SovereignControl: FC = () => {
  const [harmonyOverride, setHarmonyOverride] = useState<number>(0.8);
  const [isSaving, setIsSaving] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastAudienceType, setBroadcastAudienceType] = useState<"all" | "low_mood" | "scenario">("all");
  const [broadcastScenarioValue, setBroadcastScenarioValue] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Sanctuary Pulse State
  const [liveStats, setLiveStats] = useState<OverviewStats | null>(null);
  const [incidents, setIncidents] = useState<AlertIncident[] | null>(null);
  const [history, setHistory] = useState<AdminBroadcast[]>([]);
  const [isLoadingPulse, setIsLoadingPulse] = useState(true);

  useEffect(() => {
    if (!isSupabaseReady || !supabase) return;
    
    let subscription: ReturnType<typeof supabase.channel> | null = null;

    const refreshData = async (force = false) => {
      const adminClient = supabase;
      if (!adminClient) return;

      const state = useAdminState.getState();
      const cache = state.liveStatsCache;
      const now = Date.now();
      
      if (!force && cache && now - cache.timestamp < 30_000) {
        if (cache.data.harmonyOverride !== undefined) {
          setHarmonyOverride(cache.data.harmonyOverride);
        }
        setLiveStats(cache.data.stats);
        setIncidents(cache.data.alerts);
        setHistory(cache.data.historicalBroadcasts);
        setIsLoadingPulse(false);
        const hasAlerts = !!cache.data.alerts?.some((i: any) => i.severity === 'critical' || i.severity === 'high');
        if (state.hasSovereignAlert !== hasAlerts) {
          state.setHasSovereignAlert(hasAlerts);
        }
        return;
      }

      const [data, stats, alerts, historicalBroadcasts] = await Promise.all([
        adminClient.from("system_settings").select("value").eq("key", "global_harmony_override").maybeSingle(),
        fetchOverviewStats(),
        fetchAlertIncidents(),
        fetchBroadcasts()
      ]);

      const newHarmony = data?.data?.value ?? 0.8;
      setHarmonyOverride(newHarmony);
      setLiveStats(stats);
      setIncidents(alerts);
      setHistory(historicalBroadcasts ?? []);
      setIsLoadingPulse(false);

      const hasCriticalAlert = !!alerts?.some(i => i.severity === 'critical' || i.severity === 'high');
      if (state.hasSovereignAlert !== hasCriticalAlert) {
        state.setHasSovereignAlert(hasCriticalAlert);
      }

      // ⚡ Automated Tactical Intervention (Rules Engine)
      const currentHistory = historicalBroadcasts ?? [];
      const timeSinceLastBroadcast = currentHistory.length > 0 
        ? Date.now() - currentHistory[0].createdAt 
        : Infinity;
        
      // إذا انهار التناغم أسفل 0.35 ولم يتم إرسال أي بث لتهدئة الأوضاع خلال 15 دقيقة
      if (adminClient && newHarmony < 0.35 && timeSinceLastBroadcast > 15 * 60 * 1000) {
        console.warn("⚡ [Rules Engine] التناغم الحرج تم رصده! يتم إطلاق نداء حاكم تلقائي لتهدئة الاستقرار...");
        
        await adminClient.from("system_settings").upsert({
          key: "sovereign_broadcast",
          value: {
            message: "يبدو أن الكثير منا يشعر بالفوضى الآن. توقف للحظة.. خذ نفساً عميقاً، أنت لست وحدك في هذا الظلام.",
            timestamp: Date.now(),
            id: 'auto-' + Math.random().toString(36).substr(2, 9),
            audience: {
              type: "low_mood"
            }
          }
        });
        
        // أضف سجل محلي لتنبيه مدير النظام
        setBroadcastMessage("تم تدشين تدخل علاجي آلي عبر Rules Engine نظراً لانهيار التناغم.");
        setTimeout(() => setBroadcastMessage(""), 10000);
      }

      state.setLiveStatsCache({
        harmonyOverride: newHarmony,
        stats,
        alerts,
        historicalBroadcasts: historicalBroadcasts ?? []
      });
    };

    refreshData();
    const interval = setInterval(() => refreshData(true), 60_000);

    // Setup Supabase Real-time Channels
    subscription = supabase.channel('sovereign_live_pulse')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
         refreshData(true);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'journey_events' }, () => {
         // Optionally, add a slight debounce if journey_events are heavily spammed, 
         // but for owner panel we want it live.
         refreshData(true);
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      if (subscription) {
        supabase?.removeChannel(subscription);
      }
    };
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
        id: Math.random().toString(36).substr(2, 9),
        audience: {
          type: broadcastAudienceType,
          value: broadcastAudienceType === "scenario" ? broadcastScenarioValue : undefined
        }
      }
    });
    setBroadcastMessage("");
    setBroadcastScenarioValue("");
    setIsSaving(false);
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="flex flex-col gap-2 mb-8">
        <div className="flex items-center gap-3 text-amber-500">
          <Shield className="w-6 h-6" />
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black uppercase tracking-tighter">مركز السيادة الإدراكية</h1>
            <AdminTooltip content="لوحة التحكم الفوقية (God Mode) للتواصل المباشر مع عقول كل الموجودين في الملاذ أو تعديل ترددات الوعي للمنصة بالكامل." position="bottom" />
          </div>
        </div>
        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">تحكم في طاقة الملاذ ورسائل الروح</p>
      </header>

      {/* Sovereign Emergency Alert */}
      {incidents && incidents.some(i => i.severity === 'critical' || i.severity === 'high') && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-500/10 border-2 border-amber-500/30 p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6 shadow-[0_0_30px_rgba(245,158,11,0.1)] mb-6"
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
              // Small timeout to allow expand if collapsed
              setTimeout(() => {
                const area = el?.querySelector('textarea');
                area?.focus();
              }, 100);
            }}
            className="px-6 py-3 bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-amber-400 transition-colors"
          >
            استجابة فورية
          </button>
        </motion.div>
      )}

      {/* Sanctuary Pulse - Real-time Snapshot */}
      <CollapsibleSection
        title="نبض الملاذ (Sanctuary Pulse)"
        icon={<Activity className="w-4 h-4" />}
        subtitle="حالة المجتمع وتدفق الزوار المباشر"
        defaultExpanded={true}
        headerColors="border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
      >
        <div className="flex flex-col lg:flex-row gap-8 pt-2">
          {/* Main Sovereign Orb */}
          <div className="lg:w-1/3 flex flex-col items-center justify-center p-8 hud-glass rounded-3xl border-emerald-500/20 transition-all group relative">
            <div className="hud-edge-accent top-2 right-2" />
            <div className="hud-edge-accent bottom-2 left-2" />
            
            <div className="relative mb-6">
              <motion.div 
                animate={{ 
                  scale: isLoadingPulse ? 0.8 : [1, 1.1, 1],
                  opacity: isLoadingPulse ? 0.5 : [0.8, 1, 0.8]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className={`w-32 h-32 rounded-full blur-2xl absolute inset-0 -z-10 ${
                  incidents && incidents.length > 0 ? "bg-rose-500/40" : "bg-emerald-500/40"
                }`}
              />
              <div className={`w-32 h-32 rounded-full border-2 flex items-center justify-center relative overflow-hidden backdrop-blur-sm shadow-2xl ${
                incidents && incidents.length > 0 ? "border-rose-500/50" : "border-emerald-500/50"
              }`}>
                <div className={`absolute inset-0 animate-system-pulse ${
                  incidents && incidents.length > 0 ? "bg-gradient-to-t from-rose-600/20 to-transparent" : "bg-gradient-to-t from-emerald-600/20 to-transparent"
                }`} />
                <CirclePulseIcon className={`w-12 h-12 ${incidents && incidents.length > 0 ? "text-rose-400" : "text-emerald-400"}`} />
              </div>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">تردد السيادة</h3>
              <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${incidents && incidents.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                {incidents && incidents.length > 0 ? "تداخل حرج (Critical)" : "متناغم (Harmonious)"}
              </p>
            </div>

            <button 
              onClick={() => {
                setIsLoadingPulse(true);
                setTimeout(() => setIsLoadingPulse(false), 1500);
              }}
              disabled={isLoadingPulse}
              className="mt-6 w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 hover:text-white hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all uppercase tracking-widest flex items-center justify-center gap-2 group/btn"
            >
              <Zap className="w-3 h-3 group-hover/btn:animate-bounce" />
              فحص نبض الاستقرار
            </button>
          </div>

          {/* Stats Grid */}
          <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="hud-glass p-5 rounded-2xl relative overflow-hidden group border-white/5">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-12 h-12 text-teal-400" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">أرواح متصلة الآن</p>
                <AdminTooltip content="عدد كل الزوار والمستخدمين النشطين داخل الملاذ في اللحظة دي." position="bottom" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tabular-nums">
                  {isLoadingPulse ? "..." : (liveStats?.activeNow ?? 0).toLocaleString("ar-EG")}
                </span>
                <span className="text-[10px] text-teal-500 font-bold animate-pulse">LIVE</span>
              </div>
            </div>

            <div className="hud-glass p-5 rounded-2xl relative overflow-hidden group border-white/5">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity className="w-12 h-12 text-amber-400" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">مؤشر الصفاء الجماعي</p>
                <AdminTooltip content="متوسط تقييم المزاج لكل المستخدمين دلوقتي. مؤشر حي على صحة المجتمع ككل." position="bottom" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white tabular-nums">
                  {isLoadingPulse ? "..." : (liveStats?.avgMood ?? 0).toFixed(1)}
                </span>
                <span className="text-[10px] text-amber-500 font-bold">HARMONY</span>
              </div>
            </div>

            <div className={`hud-glass p-5 rounded-2xl relative overflow-hidden group transition-colors border-white/5 ${incidents && incidents.length > 0 ? "border-rose-500/30" : "border-emerald-500/20"}`}>
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldAlert className={`w-12 h-12 ${incidents && incidents.length > 0 ? "text-rose-400" : "text-emerald-400"}`} />
              </div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">حالة استقرار الملاذ</p>
                <AdminTooltip content="لو تم الكشف عن طفرات سلبية حادة أو محاولات تخريب للمجتمع، هتتحول لإنذار أحمر طارئ هنا فوراً." position="bottom" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-black uppercase ${incidents && incidents.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {isLoadingPulse ? "..." : (incidents && incidents.length > 0 ? "تنبيه حرج" : "مستقر جداً")}
                </span>
              </div>
            </div>

            <div className="hud-glass p-5 rounded-2xl relative overflow-hidden group border-white/5 bg-indigo-500/5">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles className="w-12 h-12 text-indigo-400" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">كفاءة الرنين</p>
                <AdminTooltip content="مدى اتساق تفاعل المستخدمين مع محتوى الرحلة." position="bottom" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-indigo-300 uppercase tracking-tighter">عالي الوضوح</span>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Illusion & Dissonance Radar */}
      <IllusionRadar scenarios={liveStats?.topScenarios ?? null} isLoading={isLoadingPulse} />

      {/* Sovereign Spread & Diffusion Control */}
      <CollapsibleSection
        title="إدارة الانتشار والنمو (Spread & Diffusion)"
        icon={<TrendingUp className="w-4 h-4 text-indigo-400" />}
        subtitle="مراقبة السرعة الفيروسية وحوافز النمو"
        defaultExpanded={false}
        headerColors="border-indigo-500/20 bg-indigo-500/5 text-indigo-400"
      >
        <SovereignSpreadCommand />
      </CollapsibleSection>

      {/* Harmony Control */}
      <CollapsibleSection
        title="توازن التناغم العالمي"
        icon={<Wind className="w-4 h-4" />}
        subtitle="تعديل مباشر على تردد أنفاس المنصة ككل"
        defaultExpanded={false}
        headerColors="border-teal-500/20 bg-teal-500/5 text-teal-400"
      >
        <div className="space-y-4 pt-2">
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
          <div className="flex items-center gap-2 p-4 bg-teal-400/5 rounded-2xl border border-teal-400/10 mt-4">
            <Zap className="w-4 h-4 text-teal-400" />
            <p className="text-xs text-teal-300 leading-relaxed">
              هذا التحكم يغير **لون ونبض التنفس** لجميع المستخدمين في نفس اللحظة.
            </p>
          </div>
          {isSaving && (
            <p className="text-[10px] text-teal-500 animate-pulse mt-2 flex justify-end">جاري المزامنة...</p>
          )}
        </div>
      </CollapsibleSection>

      {/* Global Broadcast */}
      <div id="broadcast-area">
        <CollapsibleSection
          title="نداء الحاكم (Global Broadcast)"
          icon={<Sparkles className="w-4 h-4" />}
          subtitle="بث رسالة توجيهية تظهر فوراً لكل الأرواح في الملاذ"
          defaultExpanded={true}
          headerColors="border-purple-500/20 bg-purple-500/5 text-purple-400"
        >
          <div className="space-y-4 pt-2">
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="اكتب رسالة نورانية تظهر للجميع..."
              className="w-full h-32 bg-slate-800/50 border border-white/5 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-500/50 transition-all resize-none"
            />
            
            <div className="flex flex-col md:flex-row gap-3">
              <select
                value={broadcastAudienceType}
                onChange={(e) => setBroadcastAudienceType(e.target.value as any)}
                className="bg-slate-800/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50 flex-1"
              >
                <option value="all">الأثير الكامل (لكل الأرواح)</option>
                <option value="low_mood">حالة الطوارئ (الصفاء أقل من 3.0)</option>
                <option value="scenario">توجيه مخصص لوهم معين (Illusion Specific)</option>
              </select>

              {broadcastAudienceType === "scenario" && (
                <select
                  value={broadcastScenarioValue}
                  onChange={(e) => setBroadcastScenarioValue(e.target.value)}
                  className="bg-slate-800/50 border border-purple-500/30 rounded-xl px-4 py-3 text-sm text-purple-200 outline-none focus:border-purple-500/70 flex-1"
                >
                  <option value="" disabled>اختر الوهم المستهدف...</option>
                  {liveStats?.topScenarios?.map(s => (
                    <option key={s.key} value={s.label}>{s.label}</option>
                  ))}
                </select>
              )}
            </div>

            <button
              onClick={handleSendBroadcast}
              disabled={!broadcastMessage.trim() || isSaving || (broadcastAudienceType === "scenario" && !broadcastScenarioValue)}
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
        </CollapsibleSection>
      </div>

      {/* Sovereign Chronicle (سجل السيادة) */}
      <CollapsibleSection
        title="سجل السيادة (آخر النداءات)"
        icon={<History className="w-4 h-4" />}
        subtitle="أرشيف بكل المراسلات التاريخية"
        defaultExpanded={false}
        headerColors="border-slate-500/20 bg-slate-500/5 text-slate-300"
      >
        <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto custom-scrollbar pt-2">
          {history.length > 0 ? (
            history.slice(0, 5).map((item) => (
              <div key={item.id} className="py-4 hover:bg-white/5 transition-colors group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{item.title || "نداء السيادة"}</span>
                  <span className="text-[10px] text-slate-600 font-mono">{new Date(item.createdAt).toLocaleString("ar-EG")}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-200 transition-colors">{item.body}</p>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-600 text-xs italic">لا توجد سجلات تاريخية بعد.</div>
          )}
        </div>
      </CollapsibleSection>

      <footer className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl">
        <p className="text-xs text-amber-500/80 leading-relaxed text-center font-bold italic">
          "تذكر، هذه السلطة مصممة لنشر السكينة، استخدم نداء الحاكم بحكمة لتعزيز الرحلة المشتركة."
        </p>
      </footer>
    </div>
  );
};
