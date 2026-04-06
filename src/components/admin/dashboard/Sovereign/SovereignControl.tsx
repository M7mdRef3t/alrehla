import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, Send, Zap, Wind, AlertCircle, Users, Activity, ShieldAlert, History, Radio, TrendingUp, Target, Brain, Box, Eye } from "lucide-react";
import { AdminTooltip } from "../Overview/components/AdminTooltip";
import { supabase, isSupabaseReady } from "../../../../services/supabaseClient";
import { fetchOverviewStats, fetchAlertIncidents, fetchBroadcasts, type OverviewStats, type AlertIncident } from "../../../../services/adminApi";
import { useAdminState, type AdminBroadcast } from "../../../../state/adminState";
import { CollapsibleSection } from "../../ui/CollapsibleSection";
import { IllusionRadar } from "./IllusionRadar";
import { SovereignSpreadCommand } from "./SovereignSpreadCommand";
import { SovereignOracle } from "./SovereignOracle";

const TACTICAL_PRESETS = [
  { id: "peace", label: "بروتوكول السلام", message: "توقف للحظة.. خذ نفساً عميقاً، أنت لست وحدك في هذا الظلام.", icon: Wind, color: "text-emerald-400" },
  { id: "truth", label: "نداء الحق", message: "تذكر أن الأوهام هي حواجز من صنع عقلك. الحقيقة دائماً أبسط مما تتخيل.", icon: Shield, color: "text-amber-400" },
  { id: "grounding", label: "التأريض الفوري", message: "اشعر بقدميك على الأرض.. أنت هنا والآن. لا تسمح للأفكار بسحبك بعيداً.", icon: Zap, color: "text-rose-400" },
  { id: "focus", label: "موجة التركيز", message: "ركز طاقتك على ما تفعله الآن. السيادة تبدأ من امتلاك اللحظة الحالية.", icon: Target, color: "text-indigo-400" },
];

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
    // Guard flag: prevents React Strict Mode's double-invoke from firing removeChannel
    // on a subscription that hasn't been established yet (avoids "closed before established" warning).
    let subscribed = false;
    subscription = supabase.channel('sovereign_live_pulse')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
         if (subscribed) refreshData(true);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'journey_events' }, () => {
         if (subscribed) refreshData(true);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') subscribed = true;
      });

    return () => {
      subscribed = false;
      clearInterval(interval);
      if (subscription) {
        supabase?.removeChannel(subscription);
        subscription = null;
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
    <div className="space-y-12 max-w-[1600px] mx-auto px-4 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
        <div>
          <div className="flex items-center gap-3 text-amber-500">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <Shield className="w-8 h-8" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-4xl font-black uppercase tracking-tighter text-white">مقعد المعماري</h1>
              <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.3em]">Sovereign Command Center</p>
            </div>
            <AdminTooltip content="لوحة التحكم الفوقية (God Mode) للتواصل المباشر مع عقول كل الموجودين في الملاذ أو تعديل ترددات الوعي للمنصة بالكامل." position="bottom" />
          </div>
        </div>
        
        <div className="flex gap-2 bg-[#0B0F19]/60 backdrop-blur-xl border border-white/5 p-2 rounded-2xl shadow-xl">
           <div className="px-4 py-2 flex flex-col items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Status</span>
              <span className="text-xs font-black text-emerald-400 uppercase">Online / Active</span>
           </div>
           <div className="w-[1px] h-8 bg-white/5 self-center" />
           <div className="px-4 py-2 flex flex-col items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Uptime</span>
              <span className="text-xs font-black text-white font-mono">99.98%</span>
           </div>
        </div>
      </header>

      {/* Main Command Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Oracle & Presets */}
        <div className="lg:col-span-4 space-y-8 flex flex-col">
           <div className="flex-1 min-h-[400px]">
             <SovereignOracle />
           </div>

           {/* Tactical Presets */}
           <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-2xl">
              <div className="flex items-center gap-2 mb-6 text-rose-500">
                 <Target className="w-4 h-4" />
                 <h3 className="text-xs font-black uppercase tracking-widest">التدخلات التكتيكية (Tactical Presets)</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 {TACTICAL_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setBroadcastMessage(preset.message);
                        setBroadcastAudienceType("all");
                        const el = document.getElementById('broadcast-area');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group text-right flex flex-col items-start gap-2"
                    >
                       <preset.icon className={`w-5 h-5 ${preset.color} group-hover:scale-110 transition-transform`} />
                       <span className="text-[10px] font-black text-white uppercase tracking-wider">{preset.label}</span>
                    </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Right Column: Pulse & Controls */}
        <div className="lg:col-span-8 space-y-8">
          {/* Sovereign Emergency Alert */}
          {incidents && incidents.some(i => i.severity === 'critical' || i.severity === 'high') && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-amber-500/10 border-2 border-amber-500/30 p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6 shadow-[0_0_80px_rgba(245,158,11,0.15)] ring-4 ring-amber-500/10 animate-pulse"
            >
              <div className="bg-amber-500/20 p-4 rounded-2xl">
                <ShieldAlert className="w-10 h-10 text-amber-500" />
              </div>
              <div className="flex-1 text-center md:text-right space-y-1">
                <h3 className="text-amber-500 font-black uppercase tracking-tight text-xl">نداء عاجل للسيادة</h3>
                <p className="text-amber-200/70 text-sm font-bold">تم رصد ضجيج معرفي مرتفع أو خلل في بعض المسارات. ننصح ببث "نداء الحاكم" فوراً.</p>
              </div>
              <button 
                onClick={() => {
                  const el = document.getElementById('broadcast-area');
                  el?.scrollIntoView({ behavior: 'smooth' });
                  setTimeout(() => {
                    const area = el?.querySelector('textarea');
                    area?.focus();
                  }, 100);
                }}
                className="px-8 py-4 bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-amber-400 shadow-xl shadow-amber-900/40 transition-all hover:scale-[1.05]"
              >
                استجابة فورية
              </button>
            </motion.div>
          )}

          {/* Sanctuary Pulse - Real-time Snapshot */}
          <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/5 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
            
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl">
                     <Activity className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">نبض الملاذ LIVE</h2>
                    <p className="text-emerald-500/60 text-[10px] font-black uppercase tracking-widest">Sanctuary Pulse Analysis</p>
                  </div>
               </div>
               <button 
                 onClick={() => {
                   setIsLoadingPulse(true);
                   setTimeout(() => setIsLoadingPulse(false), 1500);
                 }}
                 className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 hover:text-white hover:bg-emerald-500/20 transition-all uppercase tracking-widest flex items-center gap-2"
               >
                 <Zap className={`w-3 h-3 ${isLoadingPulse ? 'animate-spin' : ''}`} />
                 Refresh Pulse
               </button>
            </div>

            <div className="flex flex-col md:flex-row gap-12 items-center">
              {/* Main Sovereign Orb */}
              <div className="flex flex-col items-center justify-center group relative">
                <div className="relative">
                  <motion.div 
                    animate={{ 
                      scale: isLoadingPulse ? 0.8 : [1, 1.2, 1],
                      opacity: isLoadingPulse ? 0.5 : [0.4, 0.7, 0.4]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className={`w-48 h-48 rounded-full blur-3xl absolute inset-0 -z-10 ${
                      incidents && incidents.length > 0 ? "bg-rose-500/40" : "bg-emerald-500/40"
                    }`}
                  />
                  <div className={`w-40 h-40 rounded-full border-2 flex items-center justify-center relative overflow-hidden backdrop-blur-xl shadow-[0_0_100px_rgba(16,185,129,0.1)] ${
                    incidents && incidents.length > 0 ? "border-rose-500/30" : "border-emerald-500/30"
                  }`}>
                    <div className={`absolute inset-0 animate-system-pulse ${
                      incidents && incidents.length > 0 ? "bg-gradient-to-t from-rose-600/30 to-transparent" : "bg-gradient-to-t from-emerald-600/30 to-transparent"
                    }`} />
                    <CirclePulseIcon className={`w-16 h-16 ${incidents && incidents.length > 0 ? "text-rose-400" : "text-emerald-400"}`} />
                  </div>
                </div>
                <div className="mt-6 text-center space-y-1">
                  <h3 className="text-xl font-black text-white uppercase tracking-widest italic tracking-tighter">تردد السيادة</h3>
                  <div className="flex items-center gap-2 justify-center">
                    <span className={`w-2 h-2 rounded-full animate-ping ${incidents && incidents.length > 0 ? "bg-rose-500" : "bg-emerald-500"}`} />
                    <p className={`text-[11px] font-black uppercase tracking-[0.3em] ${incidents && incidents.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                      {incidents && incidents.length > 0 ? "Critical Collision" : "Deep Harmony"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                <div className="bg-white/2 border border-white/5 p-6 rounded-3xl relative overflow-hidden group/card hover:bg-white/5 transition-all">
                  <Users className="w-12 h-12 text-teal-500 opacity-5 absolute -bottom-2 -left-2 group-hover/card:scale-110 transition-transform" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">أرواح متصلة</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                      {isLoadingPulse ? "..." : (liveStats?.activeNow ?? 0).toLocaleString("ar-EG")}
                    </span>
                    <span className="text-[10px] text-teal-500 font-black animate-pulse tracking-widest">LIVE</span>
                  </div>
                </div>

                <div className="bg-white/2 border border-white/5 p-6 rounded-3xl relative overflow-hidden group/card hover:bg-white/5 transition-all">
                  <Activity className="w-12 h-12 text-amber-500 opacity-5 absolute -bottom-2 -left-2 group-hover/card:scale-110 transition-transform" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">الصفاء الجماعي</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white tabular-nums">
                      {isLoadingPulse ? "..." : (liveStats?.avgMood ?? 0).toFixed(1)}
                    </span>
                    <span className="text-[10px] text-amber-500 font-black tracking-widest uppercase">Sync</span>
                  </div>
                </div>

                <div className={`bg-white/2 border p-6 rounded-3xl relative overflow-hidden group/card hover:bg-white/5 transition-all ${incidents && incidents.length > 0 ? "border-rose-500/20" : "border-white/5"}`}>
                  <ShieldAlert className={`w-12 h-12 ${incidents && incidents.length > 0 ? "text-rose-500" : "text-emerald-500"} opacity-5 absolute -bottom-2 -left-2 group-hover/card:scale-110 transition-transform`} />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">الاستقرار</p>
                  <span className={`text-lg font-black uppercase ${incidents && incidents.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {isLoadingPulse ? "..." : (incidents && incidents.length > 0 ? "Alert Level 3" : "Stable")}
                  </span>
                </div>

                <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-3xl relative overflow-hidden group/card hover:bg-indigo-500/10 transition-all">
                  <Sparkles className="w-12 h-12 text-indigo-500 opacity-5 absolute -bottom-2 -left-2 group-hover/card:scale-110 transition-transform" />
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">كفاءة الرنين</p>
                  <span className="text-lg font-black text-indigo-300 uppercase tracking-tighter">HD Resonance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Illusion Radar - Full Width Focus */}
      <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/5 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
        <header className="flex items-center gap-3 mb-8 text-amber-500">
           <Eye className="w-5 h-5 animate-pulse" />
           <h2 className="text-xl font-black uppercase tracking-widest">رادار الأوهام والدجل (Dajjal Collision Map)</h2>
        </header>
        <IllusionRadar scenarios={liveStats?.topScenarios ?? null} isLoading={isLoadingPulse} />
      </div>

      {/* Secondary Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Harmony Faders */}
          <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/5 p-8 rounded-[40px] shadow-2xl">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3 text-teal-400">
                  <Wind className="w-5 h-5 font-black uppercase" />
                  <h3 className="text-sm font-black uppercase tracking-widest">توازن التناغم (Universal Breath)</h3>
               </div>
               <span className="text-[10px] text-slate-500 font-mono tracking-widest">MOD: {harmonyOverride.toFixed(2)}</span>
            </div>
            
            <div className="space-y-6">
              <div className="relative h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                   className="absolute top-0 right-0 h-full bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.5)]"
                   animate={{ width: `${(1 - (harmonyOverride - 0.4) / 0.6) * 100}%` }}
                />
                <input
                  type="range"
                  min="0.4"
                  max="1.0"
                  step="0.05"
                  value={harmonyOverride}
                  onChange={(e) => handleUpdateHarmony(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                />
              </div>

              <div className="flex justify-between text-[9px] font-black text-slate-600 uppercase tracking-widest">
                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Chaos / Noisy</span>
                <span className="flex items-center gap-1">Zen / Stillness <Sparkles className="w-3 h-3 text-teal-400" /></span>
              </div>

              <div className="p-5 bg-teal-500/5 border border-teal-500/10 rounded-2xl flex items-start gap-4">
                <Zap className="w-5 h-5 text-teal-400 shrink-0" />
                <p className="text-xs text-teal-300 leading-relaxed italic">
                  يؤثر هذا المتحكم في **تردد الألوان وأنفس التنفس** لكل الأرواح المتصلة بالملاذ بشكل فوري وجماعي.
                </p>
              </div>
              
              {isSaving && (
                <div className="flex items-center gap-2 justify-end">
                   <Box className="w-3 h-3 text-teal-500 animate-spin" />
                   <span className="text-[10px] text-teal-500 font-black uppercase tracking-widest">Syncing with Cosmos...</span>
                </div>
              )}
            </div>
          </div>

          <SovereignSpreadCommand />
      </div>

      {/* Global Broadcast Console */}
      <div id="broadcast-area" className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/5 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        
        <div className="flex items-center gap-3 mb-8 text-purple-400">
           <Sparkles className="w-6 h-6" />
           <div>
             <h2 className="text-xl font-black uppercase tracking-widest">قنصلية البث الكوني (Sovereign Broadcast)</h2>
             <p className="text-[10px] text-purple-500/60 font-black uppercase tracking-[0.2em]">Quantum Diffusion Channel</p>
           </div>
        </div>

        <div className="space-y-6">
          <div className="relative group">
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="اكتب نداءً نورانياً يلمس أرواح الجميع..."
              className="w-full h-40 bg-slate-950/50 border border-white/10 rounded-3xl p-6 text-sm text-white placeholder:text-slate-700 outline-none focus:border-purple-500/50 focus:ring-4 ring-purple-500/5 transition-all resize-none font-bold leading-relaxed"
            />
            <div className="absolute bottom-4 left-4 p-2 opacity-10 group-focus-within:opacity-30 transition-opacity">
               <Send className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block ml-2 mb-1">Target Dimension</label>
              <select
                value={broadcastAudienceType}
                onChange={(e) => setBroadcastAudienceType(e.target.value as any)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:border-purple-500/50 appearance-none font-bold"
              >
                <option value="all">الأثير الكامل (Universal)</option>
                <option value="low_mood">حالات الطوارئ (Stabilize Mood)</option>
                <option value="scenario">توجيه مخصص لوهم معين (Specific Illusion)</option>
              </select>
            </div>

            {broadcastAudienceType === "scenario" && (
              <div className="flex-1 space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block ml-2 mb-1">Select Core Illusion</label>
                <select
                  value={broadcastScenarioValue}
                  onChange={(e) => setBroadcastScenarioValue(e.target.value)}
                  className="w-full bg-slate-950/80 border border-purple-500/30 rounded-2xl px-6 py-4 text-sm text-purple-200 outline-none focus:border-purple-500 appearance-none font-bold"
                >
                  <option value="" disabled>اختر التردد المستهدف...</option>
                  {liveStats?.topScenarios?.map(s => (
                    <option key={s.key} value={s.label}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              onClick={handleSendBroadcast}
              disabled={!broadcastMessage.trim() || isSaving || (broadcastAudienceType === "scenario" && !broadcastScenarioValue)}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 py-5 rounded-[24px] text-white font-black text-sm shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-shimmer" />
              <Send className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>بث النداء للعالم</span>
            </button>
            <AnimatePresence>
              {showConfirm && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 flex items-center gap-2 justify-center text-teal-400 text-[10px] font-black uppercase tracking-widest"
                >
                  <Shield className="w-3 h-3" />
                  Echo Received Successfully
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Sovereign Chronicle - Archive */}
      <CollapsibleSection
        title="أرشيف السيادة (Sovereign Chronicle)"
        icon={<History className="w-4 h-4" />}
        subtitle="تاريخ المراسلات الكونية"
        defaultExpanded={false}
        headerColors="border-slate-800 bg-slate-900/40 text-slate-400"
      >
        <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto px-4 custom-scrollbar">
          {history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} className="py-6 hover:bg-white/2 transition-colors group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                     <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{item.title || "Universal Outreach"}</span>
                  </div>
                  <span className="text-[10px] text-slate-600 font-mono">{new Date(item.createdAt).toLocaleString("ar-EG")}</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-bold group-hover:text-slate-200 transition-colors pr-3">{item.body}</p>
              </div>
            ))
          ) : (
            <div className="py-20 text-center text-slate-700 text-xs font-black uppercase tracking-widest italic">The Chronicle is Silent...</div>
          )}
        </div>
      </CollapsibleSection>

      <footer className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-[32px] text-center">
        <p className="text-xs text-amber-500/80 leading-relaxed font-black transition-all hover:scale-105 cursor-default italic">
          "سلطة السيادة هي مسؤولية تجاه السكينة العامة. استخدم المِرآة لتكشف النور، لا لتعمق الظلال."
        </p>
      </footer>
    </div>
  );
};
