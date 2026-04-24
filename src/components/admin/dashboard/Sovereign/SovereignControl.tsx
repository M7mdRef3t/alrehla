import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, Wind, Eye, Brain, ShieldAlert, History, Activity, Compass } from "lucide-react";
import { AdminTooltip } from "../Overview/components/AdminTooltip";
import { supabase, isSupabaseReady } from "@/services/supabaseClient";
import { fetchOverviewStats } from "@/services/admin/adminAnalytics";
import { fetchAlertIncidents } from "@/services/admin/adminAlerts";
import { fetchBroadcasts } from "@/services/admin/adminBroadcasts";
import type { OverviewStats, AlertIncident } from "@/services/admin/adminTypes";
import { useAdminState, type AdminBroadcast } from "@/domains/admin/store/admin.store";
import { CollapsibleSection } from "../../ui/CollapsibleSection";
import { IllusionRadar } from "./IllusionRadar";
import { SovereignOrchestrator } from "@/services/sovereignOrchestrator";
import { ProactiveResonanceFeed } from "./ProactiveResonanceFeed";
import { useLockdownState } from "@/domains/admin/store/lockdown.store";
import { useThemeState } from "@/domains/consciousness/store/theme.store";

const TACTICAL_PRESETS = [
  { id: "peace", label: "بروتوكول السلام", message: "توقف للحظة.. خذ نفساً عميقاً، أنت لست وحدك في هذا الظلام.", color: "text-emerald-400" },
  { id: "truth", label: "نداء الحق", message: "تذكر أن الأوهام هي حواجز من صنع عقلك. الحقيقة دائماً أبسط مما تتخيل.", color: "text-amber-400" },
  { id: "grounding", label: "التأريض الفوري", message: "اشعر بقدميك على الأرض.. أنت هنا والآن. لا تسمح للأفكار بسحبك بعيداً.", color: "text-rose-400" },
];

interface SovereignControlProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const SovereignControl: FC<SovereignControlProps> = ({ onClose }) => {
  const [harmonyOverride, setHarmonyOverride] = useState<number>(0.8);
  const [isSaving, setIsSaving] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isTakeoverModalOpen, setIsTakeoverModalOpen] = useState(false);
  const [compassionProtocolActive, setCompassionProtocolActive] = useState(false);
  const { isLockedDown, triggerLockdown } = useLockdownState();
  const { customTokens, updateTokens } = useThemeState();
  
  // Sanctuary Pulse State
  const [liveStats, setLiveStats] = useState<OverviewStats | null>(null);
  const [incidents, setIncidents] = useState<AlertIncident[] | null>(null);
  const [history, setHistory] = useState<AdminBroadcast[]>([]);
  const [healthScore, setHealthScore] = useState<number>(100);
  const [isLoadingPulse, setIsLoadingPulse] = useState(true);

  useEffect(() => {
    if (!isSupabaseReady || !supabase) return;

    const refreshData = async (force = false) => {
      const adminClient = supabase;
      if (!adminClient) return;

      const state = useAdminState.getState();
      const cache = state.liveStatsCache;
      const now = Date.now();
      
      if (!force && cache && now - cache.timestamp < 30_000) {
        if (cache.data.harmonyOverride !== undefined) setHarmonyOverride(cache.data.harmonyOverride);
        setLiveStats(cache.data.stats);
        setIncidents(cache.data.alerts);
        setHistory(cache.data.historicalBroadcasts);
        setIsLoadingPulse(false);
        return;
      }

      try {
        const healthData = JSON.parse(localStorage.getItem("dawayir-health-history") || "[]");
        if (healthData.length > 0) {
          setHealthScore(healthData[healthData.length - 1].score);
        }
      } catch (e) {}

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
    };

    refreshData();
    const interval = setInterval(() => refreshData(true), 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateHarmony = async (val: number) => {
    setHarmonyOverride(val);
    if (!isSupabaseReady || !supabase) return;
    setIsSaving(true);
    await supabase.from("system_settings").upsert({ key: "global_harmony_override", value: val });
    setIsSaving(false);
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim() || !isSupabaseReady || !supabase) return;
    setIsSaving(true);
    await supabase.from("system_settings").upsert({
      key: "sovereign_broadcast",
      value: { message: broadcastMessage, timestamp: Date.now(), id: Math.random().toString(36).substr(2, 9), audience: { type: "all" } }
    });
    setBroadcastMessage("");
    setIsSaving(false);
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 3000);
  };
  
  const handleSovereignTakeover = () => {
    triggerLockdown();
    SovereignOrchestrator.executeIntervention("broadcast-all");
    setIsTakeoverModalOpen(true);
  };

  const criticalCount = incidents?.filter(i => i.severity === 'critical' || i.severity === 'high').length || 0;
  const isCritical = criticalCount > 0;
  
  const currentHour = new Date().getHours();
  const isLateNight = currentHour >= 22 || currentHour <= 5;

  return (
    <div className="space-y-12 max-w-[1600px] mx-auto px-4 pb-24" dir="rtl">
      
      <AnimatePresence>
        {isLateNight && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6"
          >
            <div className="p-3 bg-indigo-500/10 rounded-full shrink-0">
              <Wind className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="flex-1 text-center md:text-right">
              <h3 className="text-xl font-black text-indigo-300 mb-1">الملاذ آمن الآن. لا توجد قرارات مصيرية تتطلب تدخلك.</h3>
              <p className="text-sm text-indigo-400/70 font-bold">الوقت متأخر. خذ نفساً عميقاً، المنظومة تحرس نفسها. يفضل عدم تعديل تناغم الأثير حتى شروق الشمس.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 
        HERO SECTION: Proactive Resonance Oracle 
        We strip out the rigid grid stats and present the admin with a human-readable AI analysis.
      */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-[3rem] p-10 md:p-16 border transition-all duration-1000 ${compassionProtocolActive ? "ring-4 ring-amber-500/50" : ""}`}
        style={{
          background: compassionProtocolActive ? "rgba(245, 158, 11, 0.05)" : isCritical ? "rgba(225, 29, 72, 0.05)" : "rgba(15, 23, 42, 0.6)",
          borderColor: compassionProtocolActive ? "rgba(245, 158, 11, 0.4)" : isCritical ? "rgba(225, 29, 72, 0.2)" : "rgba(51, 65, 85, 0.5)",
          boxShadow: compassionProtocolActive ? "0 0 150px rgba(245, 158, 11, 0.15) inset" : isCritical ? "0 0 100px rgba(225, 29, 72, 0.1) inset" : "none"
        }}
      >
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent ${compassionProtocolActive ? "via-amber-400" : "via-amber-500/50"} to-transparent opacity-50`} />
        
        <div className="flex flex-col md:flex-row gap-12 items-center relative z-10">
          
          {/* Oracle Status Icon */}
          <div className="w-48 h-48 rounded-full relative flex items-center justify-center shrink-0">
            <motion.div 
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className={`absolute inset-0 rounded-full blur-3xl ${isCritical ? "bg-rose-500" : "bg-teal-500"}`}
            />
            <div className={`relative z-10 w-32 h-32 rounded-full border-4 flex items-center justify-center backdrop-blur-md ${isCritical ? "border-rose-500/50 bg-rose-500/10" : "border-teal-500/50 bg-teal-500/10"}`}>
              {isCritical ? <ShieldAlert className="w-12 h-12 text-rose-400" /> : <Brain className="w-12 h-12 text-teal-400" />}
            </div>
          </div>

          {/* Oracle Human Narrative */}
          <div className="flex-1 space-y-6 text-center md:text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-black tracking-widest uppercase">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span className="text-slate-400">صوت الأوراكل</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
              {isLoadingPulse ? "يجري تحليل الوعي الجماعي..." : 
               isCritical ? `تنبيه عاجل: تم رصد ${criticalCount} نقاط اختناق في المسارات.` :
               `المنظومة في حالة اتزان تام. ${liveStats?.activeConsciousnessNow || 0} مسافراً يختبرون الصفاء الآن.`}
            </h2>

            <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed max-w-3xl">
              {isLoadingPulse ? "نجمع النبضات العصبية من كافة أنحاء الملاذ..." :
               isCritical ? "مستوى الضجيج المعرفي مرتفع. العديد من المسافرين يواجهون وهم الخوف. أنصح بإطلاق نداء الحق فوراً أو تفعيل التتبع العصبي." :
               "متوسط الحالة المزاجية مستقر. لا يوجد تدخل طارئ مطلوب، ولكن يمكنك إرسال نفحة طمأنينة عبر الأثير لتعزيز التجربة."}
            </p>

            {/* Contextual Quick Actions directly inside the narrative */}
            <div className="flex flex-wrap gap-4 pt-6 justify-center md:justify-start">
              {TACTICAL_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => {
                    SovereignOrchestrator.dispatchTacticalPreset(preset.id, preset.message);
                    setBroadcastMessage(preset.message);
                  }}
                  className="px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-black text-white flex items-center gap-3 group"
                >
                  <span className={`w-2 h-2 rounded-full ${preset.color} group-hover:scale-150 transition-transform`} />
                  إطلاق {preset.label}
                </button>
              ))}
              
              {isCritical && (
                <button 
                  onClick={handleSovereignTakeover}
                  className="px-6 py-4 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 transition-all text-sm font-black text-rose-400 flex items-center gap-3"
                >
                  <ShieldAlert className="w-5 h-5" />
                  حظر شامل (Lockdown)
                </button>
              )}
              
              <button 
                onClick={() => setCompassionProtocolActive(!compassionProtocolActive)}
                className={`px-6 py-4 rounded-2xl border transition-all text-sm font-black flex items-center gap-3 ${
                  compassionProtocolActive 
                    ? "bg-amber-500 text-slate-900 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:bg-amber-400" 
                    : "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-500"
                }`}
              >
                <Shield className="w-5 h-5" />
                {compassionProtocolActive ? "بروتوكول الرحمة مفعل (عزل تسويقي)" : "تفعيل بروتوكول الرحمة"}
              </button>
            </div>
          </div>
        </div>

        <ProactiveResonanceFeed stats={liveStats} />
      </motion.div>

      {/* 
        SECONDARY LAYER: The Vitality Core & Flow Aurora
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sanctuary Vitality Core (Replaces HealthMonitorPanel) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-10 backdrop-blur-xl relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-[300px] h-[300px] blur-[100px] rounded-full pointer-events-none transition-all duration-1000 ${
            healthScore < 70 ? "bg-rose-500/10" : healthScore < 90 ? "bg-amber-500/10" : "bg-emerald-500/10"
          }`} />
          
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <Activity className={`w-6 h-6 ${healthScore < 70 ? "text-rose-400" : "text-emerald-400"}`} />
            <h3 className="text-xl font-black text-white">نبض الملاذ</h3>
          </div>
          
          <div className="relative z-10 flex flex-col items-center justify-center py-4">
            <div className="relative flex items-center justify-center">
              <motion.div 
                animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: healthScore < 70 ? 1 : 3, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute inset-0 rounded-full blur-xl ${healthScore < 70 ? "bg-rose-500/30" : "bg-emerald-500/20"}`}
              />
              <div className={`w-32 h-32 rounded-full border-2 flex items-center justify-center text-4xl font-black ${
                healthScore < 70 ? "border-rose-500/50 text-rose-400" : "border-emerald-500/30 text-emerald-400"
              }`}>
                {healthScore}%
              </div>
            </div>
            <p className="text-slate-400 font-bold text-sm mt-6 text-center leading-relaxed">
              {healthScore < 70 ? "هناك جروح في البنية التحتية تتطلب انتباهك. راجع السجلات التقنية." : 
               healthScore < 90 ? "الملاذ مستقر، ولكن هناك بعض التموجات في الأداء." : 
               "البنية التحتية تتنفس بانتظام. لا توجد اختناقات برمجية."}
            </p>
          </div>
        </div>

        {/* AI Routing Aurora (Replaces FlowDynamicsDashboard) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-10 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none transition-all duration-1000" />
          
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <Compass className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-black text-white">توجيه الأرواح (AI Routing)</h3>
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <span className="text-slate-400 font-bold text-sm">التدخلات لإنقاذ المسار</span>
              <span className="text-xl font-black text-cyan-400">
                {liveStats?.routingTelemetry?.interventionHealth?.interventionRatePct ?? 0}%
              </span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <span className="text-slate-400 font-bold text-sm">معدل الخروج عن المألوف</span>
              <span className="text-xl font-black text-indigo-400">
                {liveStats?.routingV2?.explorationRate ?? 0}%
              </span>
            </div>
            <p className="text-xs text-slate-500 font-bold leading-relaxed pt-2">
              الذكاء الاصطناعي يتولى توجيه المسافرين بناءً على حمولتهم المعرفية. الأرقام المرتفعة للتدخل تعني أن النظام يستشعر إحباطاً جماعياً ويقوم بتخفيف العبء تلقائياً.
            </p>
          </div>
        </div>
        
        {/* Atmosphere Lab */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-10 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-8">
            <Wind className="w-6 h-6 text-indigo-400" />
            <h3 className="text-xl font-black text-white">المناخ الأثيري</h3>
          </div>
          
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-bold text-slate-300">
                <span>توازن التناغم (Harmony)</span>
                <span className="font-mono text-teal-400">{harmonyOverride.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.4" max="1.0" step="0.05"
                value={harmonyOverride}
                onChange={(e) => handleUpdateHarmony(parseFloat(e.target.value))}
                className="w-full accent-teal-500"
              />
              <div className="flex flex-col gap-2">
                <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase text-left">Chaos ⟷ Zen</p>
                <motion.p 
                  key={harmonyOverride}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-xs font-bold leading-relaxed pr-2 border-r-2 ${
                    harmonyOverride < 0.6 ? "text-amber-400 border-amber-500" :
                    harmonyOverride > 0.85 ? "text-emerald-400 border-emerald-500" :
                    "text-indigo-400 border-indigo-500"
                  }`}
                >
                  {harmonyOverride < 0.6 ? "تأثير الفراشة: ضغط نفسي محتمل، تسارع في التدفق." :
                   harmonyOverride > 0.85 ? "تأثير الفراشة: صفاء عميق، استقرار في اتخاذ القرار، هدوء حسي." :
                   "تأثير الفراشة: توازن بين التحفيز والطمأنينة."}
                </motion.p>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex justify-between items-center text-sm font-bold text-slate-300">
                  <span>التموج العصبي (Distortion)</span>
                  <span className="font-mono text-rose-400">{Math.round(customTokens.chromaticAberration * 100)}%</span>
               </div>
               <input
                 type="range"
                 min="0" max="1" step="0.05"
                 value={customTokens.chromaticAberration}
                 onChange={(e) => updateTokens({ chromaticAberration: parseFloat(e.target.value) })}
                 className="w-full accent-rose-500"
               />
               <p className="text-[10px] text-slate-500 font-black tracking-widest uppercase text-left">Clarity ⟷ Tension</p>
            </div>
          </div>
        </div>
      </div>

      {/* Illusion Radar (Full Width) */}
      <CollapsibleSection
        title="رادار الأوهام والدجل"
        subtitle="Dajjal Collision Map"
        icon={<Eye className="w-4 h-4" />}
        defaultExpanded={false}
      >
        <div className="mt-4">
          <IllusionRadar scenarios={liveStats?.topScenarios ?? null} isLoading={isLoadingPulse} />
        </div>
      </CollapsibleSection>

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
                  <span className="text-[10px] text-slate-600 font-mono">{new Date(item.createdAt).toLocaleString("en-US")}</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-bold group-hover:text-slate-200 transition-colors pr-3">{item.body}</p>
              </div>
            ))
          ) : (
            <div className="py-20 text-center text-slate-700 text-xs font-black uppercase tracking-widest italic">The Chronicle is Silent...</div>
          )}
        </div>
      </CollapsibleSection>

      <footer className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-[32px] text-center mt-12">
        <p className="text-xs text-amber-500/80 leading-relaxed font-black transition-all hover:scale-105 cursor-default italic">
          "سلطة السيادة هي مسؤولية تجاه السكينة العامة. استخدم المِرآة لتكشف النور، لا لتعمق الظلال."
        </p>
      </footer>

      <AnimatePresence>
        {isTakeoverModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-xl w-full bg-[#0B0F19] border border-rose-500/30 rounded-[2.5rem] p-12 text-center shadow-[0_0_100px_rgba(244,63,94,0.2)]"
            >
              <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-rose-500/20">
                <ShieldAlert className="w-12 h-12 text-rose-500 animate-pulse" />
              </div>
              <h2 className="text-3xl font-black text-rose-500 uppercase tracking-tighter mb-4">SOVEREIGN TAKEOVER ENGAGED</h2>
              <p className="text-rose-400/80 text-sm font-bold">تم تطبيق بروتوكول الحظر الشامل.</p>
              <button 
                onClick={() => setIsTakeoverModalOpen(false)}
                className="mt-8 px-8 py-3 bg-rose-500/20 border border-rose-500/50 rounded-xl text-rose-400 font-bold"
              >
                تأكيد ومتابعة المراقبة
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
