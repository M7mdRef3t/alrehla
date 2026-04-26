import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, Wind, Eye, Brain, ShieldAlert, History, Activity, Compass, Zap, Cpu, Clock, Terminal, Radio } from "lucide-react";
import { AdminTooltip } from "../Overview/components/AdminTooltip";
import { supabase, isSupabaseReady } from "@/services/supabaseClient";
import { fetchOverviewStats } from "@/services/admin/adminAnalytics";
import { fetchAlertIncidents } from "@/services/admin/adminAlerts";
import { fetchBroadcasts } from "@/services/admin/adminBroadcasts";
import type { OverviewStats, AlertIncident } from "@/services/admin/adminTypes";
import { useAdminState, type AdminBroadcast } from "@/domains/admin/store/admin.store";
import { CollapsibleSection } from "../../ui/CollapsibleSection";
import { IllusionRadar } from "./IllusionRadar";
import { CommandOrchestrator } from "@/services/commandOrchestrator";
import { ProactiveResonanceFeed } from "./ProactiveResonanceFeed";
import { useLockdownState } from "@/domains/admin/store/lockdown.store";
import { useThemeState } from "@/domains/consciousness/store/theme.store";
import { CommandVisualizer } from "./CommandVisualizer";

/* --- HUD Components --- */
const PulseCard: FC<{ title: string, value: string | number, icon: React.ReactNode, trend?: string, status?: string, color?: string, description?: string }> = ({ title, value, icon, trend, status, color = "emerald", description }) => (
  <div className="p-6 bg-slate-900/40 rounded-3xl border border-white/5 relative group hover:bg-slate-900/60 transition-all duration-500">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity`} />
    <div className="flex justify-between items-start mb-4 relative z-20">
      <div className={`p-2.5 bg-white/5 rounded-xl group-hover:scale-110 transition-transform duration-500`}>
        {icon}
      </div>
      <div className="flex items-center gap-2">
        {description && <AdminTooltip content={description} position="bottom" />}
        {status && (
          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
            status === 'مستقر' || status === 'OPTIMAL' ? 'text-emerald-400 bg-emerald-400/10' : 
            status === 'خطر' || status === 'CRITICAL' ? 'text-rose-400 bg-rose-400/10' : 'text-amber-400 bg-amber-400/10'
          }`}>
            {status}
          </span>
        )}
      </div>
    </div>
    <div className="space-y-1 relative z-10 text-right">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{title}</span>
      <div className="flex items-baseline gap-3 justify-end">
        {trend && <span className="text-[10px] font-bold text-emerald-400/70">{trend}</span>}
        <span className="text-3xl font-black text-white tracking-tighter tabular-nums">{value}</span>
      </div>
    </div>
  </div>
);

const TACTICAL_PRESETS = [
  { id: "peace", label: "بروتوكول السلام", message: "توقف للحظة.. خذ نفساً عميقاً، أنت لست وحدك في هذا الظلام.", color: "bg-emerald-400" },
  { id: "truth", label: "نداء الحق", message: "تذكر أن الأوهام هي حواجز من صنع عقلك. الحقيقة دائماً أبسط مما تتخيل.", color: "bg-amber-400" },
  { id: "grounding", label: "التأريض الفوري", message: "اشعر بقدميك على الأرض.. أنت هنا والآن. لا تسمح للأفكار بسحبك بعيداً.", color: "bg-rose-400" },
];

interface CommandControlProps {
  isOpen?: boolean;
  onClose?: () => void;
}

/* --- HUD Decorations --- */
const HUDCornerBorders: FC = () => (
  <>
    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-500/30 rounded-tl-3xl pointer-events-none" />
    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-500/30 rounded-tr-3xl pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-500/30 rounded-bl-3xl pointer-events-none" />
    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-500/30 rounded-br-3xl pointer-events-none" />
  </>
);

const HUDScanlines: FC = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[3.5rem] opacity-20">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
  </div>
);

export const CommandControl: FC<CommandControlProps> = ({ onClose }) => {
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
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [resilience, setResilience] = useState({ insulated: 0, total: 10 });

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

      // Fetch telemetry + resilience with error guards (tables may be empty or missing)
      const [settings, stats, alerts, historicalBroadcasts, telemetryResult, resilienceResult] = await Promise.all([
        adminClient.from("system_settings").select("key, value").in("key", ["global_harmony_override", "compassion_protocol_active"]),
        fetchOverviewStats(),
        fetchAlertIncidents(),
        fetchBroadcasts(),
        Promise.resolve(adminClient.from('live_swarm_telemetry').select('*')).catch(() => ({ data: null, error: null })),
        Promise.resolve(adminClient.from('swarm_resilience_metrics').select('*').order('snapshot_at', { ascending: false }).limit(1).maybeSingle()).catch(() => ({ data: null, error: null }))
      ]);

      if (settings?.data) {
        settings.data.forEach(s => {
          if (s.key === "global_harmony_override") setHarmonyOverride(s.value ?? 0.8);
          if (s.key === "compassion_protocol_active") setCompassionProtocolActive(!!s.value);
        });
      }
      setLiveStats(stats);
      setIncidents(alerts);
      setHistory(historicalBroadcasts ?? []);
      // Guard: only update if data exists and no 404
      if (!telemetryResult?.error && Array.isArray(telemetryResult?.data)) {
        setTelemetry(telemetryResult.data);
      }
      if (!resilienceResult?.error && resilienceResult?.data) {
        setResilience({ 
          insulated: resilienceResult.data.insulated_count ?? 0, 
          total: resilienceResult.data.total_pioneers ?? 0
        });
      }
      setIsLoadingPulse(false);
    };

    refreshData();
    const interval = setInterval(() => refreshData(true), 30_000); // Tactical polling: 30s
    return () => clearInterval(interval);
  }, []);

  const handleUpdateHarmony = async (val: number) => {
    if (compassionProtocolActive) return; // Prevent manual override during compassion
    setHarmonyOverride(val);
    if (!isSupabaseReady || !supabase) return;
    setIsSaving(true);
    await supabase.from("system_settings").upsert({ key: "global_harmony_override", value: val });
    setIsSaving(false);
  };

  const handleToggleCompassion = async () => {
    const nextState = !compassionProtocolActive;
    setCompassionProtocolActive(nextState);
    if (!isSupabaseReady || !supabase) return;
    
    setIsSaving(true);
    try {
      // 1. Sync global flag
      await supabase.from("system_settings").upsert({ 
        key: "compassion_protocol_active", 
        value: nextState 
      });

      // 2. If activating, force stable tokens
      if (nextState) {
        await supabase.from("system_settings").upsert({ key: "global_harmony_override", value: 1.0 });
        setHarmonyOverride(1.0);
        updateTokens({ chromaticAberration: 0 });
        
        // 3. Dispatch global broadcast message
        await supabase.from("system_settings").upsert({
          key: "Command_broadcast",
          value: { 
            message: "◈ تفعيل بروتوكول الرحمة: الملاذ يرسل السكينة لجميع الأرواح الآن ◈", 
            timestamp: Date.now(), 
            id: `compassion-${Date.now()}`, 
            audience: { type: "all" },
            type: "compassion"
          }
        });
      }
    } catch (e) {
      console.error("Failed to toggle compassion protocol:", e);
    }
    setIsSaving(false);
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim() || !isSupabaseReady || !supabase) return;
    setIsSaving(true);
    await supabase.from("system_settings").upsert({
      key: "Command_broadcast",
      value: { message: broadcastMessage, timestamp: Date.now(), id: Math.random().toString(36).substr(2, 9), audience: { type: "all" } }
    });
    setBroadcastMessage("");
    setIsSaving(false);
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 3000);
  };
  
  const handleCommandTakeover = () => {
    triggerLockdown();
    CommandOrchestrator.executeIntervention("broadcast-all");
    setIsTakeoverModalOpen(true);
  };

  const criticalCount = incidents?.filter(i => i.severity === 'critical' || i.severity === 'high').length || 0;
  const isCritical = criticalCount > 0;
  const currentHour = new Date().getHours();
  const isLateNight = currentHour >= 22 || currentHour <= 5;

  const workerStats = telemetry.find(d => d.service_name === 'awareness-worker');
  const totalReqs = telemetry.reduce((acc, d) => acc + (d.total_calls || 0), 0);

  const hasHighPriorityIllusions = liveStats?.topScenarios?.some(s => {
    const percent = s.percent ?? s.percentage ?? s.share ?? 0;
    return percent > 30;
  }) || false;

  return (
    <div className="space-y-12 max-w-[1600px] mx-auto px-4 pb-24 relative" dir="rtl">
      {/* Background HUD Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <AnimatePresence>
        {isLateNight && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 relative z-10"
          >
            <div className="p-3 bg-indigo-500/10 rounded-full shrink-0">
              <Wind className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="flex-1 text-center md:text-right">
              <h3 className="text-xl font-black text-indigo-300 mb-1">الملاذ آمن الآن. لا توجد قرارات مصيرية تتطلب تدخلك.</h3>
              <p className="text-sm text-indigo-400/70 font-bold">الوقت متأخر. خذ نفساً عميقاً، المنظومة تحرس نفسها.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CollapsibleSection
        title="نبض القيادة"
        subtitle="المؤشرات الحيوية وحالة النظام الحالية"
        icon={<Activity className="w-4 h-4" />}
        defaultExpanded={false}
        headerColors="border-indigo-500/20 bg-indigo-500/5 text-indigo-400"
        needsAttention={isCritical}
      >
        <div className="space-y-12 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            <PulseCard 
              title="زمن الاستجابة (Edge)" 
              value={`${workerStats?.avg_latency.toFixed(0) || 0}ms`}
              icon={<Zap className="w-5 h-5 text-amber-400" />}
              status={workerStats?.avg_latency < 300 ? "مستقر" : "مضغوط"}
              color="amber"
              description="سرعة رد فعل النظام. يوضح الوقت الذي تستغرقه العمليات التقنية لضمان تجربة سلسة بدون تأخير."
            />
            <PulseCard 
              title="درع المرونة (Armored)" 
              value={`${resilience.insulated}/${resilience.total}`}
              icon={<Shield className="w-5 h-5 text-emerald-400" />}
              status={resilience.insulated > 0 ? "محصن" : "خامل"}
              color="emerald"
              description="مؤشر الحماية والتعافي. يوضح عدد الكيانات المحصنة والجاهزة لمواجهة التحديات التقنية."
            />
            <PulseCard 
              title="ضغط المنظومة (Load)" 
              value={`${totalReqs}/hr`}
              icon={<Cpu className="w-5 h-5 text-cyan-400" />}
              status="يتمدد"
              color="cyan"
              description="معدل العمليات الحيوية في الساعة. يقيس حجم النشاط الحالي لضمان توزيع الأحمال بشكل متزن."
            />
            <PulseCard 
              title="مستوى التناغم (Harmony)" 
              value={`${(harmonyOverride * 100).toFixed(0)}%`}
              icon={<Sparkles className="w-5 h-5 text-purple-400" />}
              status={harmonyOverride > 0.7 ? "مثالي" : "مضطرب"}
              color="purple"
              description="مؤشر الانسجام العام. يعبر عن مدى توافق مكونات النظام والهدوء النفسي للمسافرين."
            />
          </div>

          {/* CORE HUD: Oracle Narrative & Resonance Feed */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-[3.5rem] p-8 md:p-14 border transition-all duration-1000 z-10 ${compassionProtocolActive ? "ring-4 ring-amber-500/30 border-amber-500/50" : "bg-slate-950/40 backdrop-blur-3xl border-white/10"}`}
          >
            <HUDScanlines />
            <HUDCornerBorders />
            
            <div className="absolute top-6 left-12 flex items-center gap-2 opacity-30 select-none pointer-events-none">
              <span className="text-[10px] font-mono font-black text-emerald-500 tracking-[0.3em]">اتصال_آمن_مستقر</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="flex flex-col lg:flex-row gap-12 items-center relative z-10">
              {/* Oracle Human Narrative */}
              <div className="flex-1 space-y-6 text-center lg:text-right">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/40 border border-white/5 text-[10px] font-black tracking-widest uppercase">
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isCritical ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                  <span className="text-slate-400">بث الأوراكل اللحظي</span>
                </div>

                <h2 className="text-4xl md:text-6xl font-black text-white leading-[1.1] tracking-tight font-alexandria">
                  {isLoadingPulse ? "يتم مزامنة الوعي..." : 
                   isCritical ? `تنبيه: ${criticalCount} خروقات في التناغم.` :
                   `النبض متزن. ${liveStats?.activeConsciousnessNow || 0} مسافر الآن.`}
                </h2>

                <p className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed max-w-3xl font-tajawal">
                  {isLoadingPulse ? "الانتظار لاستقبال البيانات التكتيكية..." :
                   isCritical ? "رصدنا نزيفاً في طاقة المسارات. التدخل السريع عبر نداء الحق مطلوب لإعادة الاتزان." :
                   "البيئة المحيطة هادئة. الأرواح تتحرك بانسيابية في الملاذ. استمر في المراقبة أو عزز التناغم."}
                </p>

                {/* Tactical Actions */}
                <div className="flex flex-wrap gap-4 pt-8 justify-center lg:justify-start">
                  {TACTICAL_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        CommandOrchestrator.dispatchTacticalPreset(preset.id, preset.message);
                        setBroadcastMessage(preset.message);
                      }}
                      className="px-7 py-5 rounded-[2rem] bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-black text-white flex items-center gap-3 group shadow-xl"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${preset.color} group-hover:scale-125 transition-transform`} />
                      {preset.label}
                    </button>
                  ))}
                  
                  {isCritical && (
                    <button 
                      onClick={handleCommandTakeover}
                      className="px-7 py-5 rounded-[2rem] bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all text-sm font-black text-rose-400 flex items-center gap-3"
                    >
                      <ShieldAlert className="w-6 h-6" />
                      حظر تكتيكي
                    </button>
                  )}
                </div>
              </div>

              {/* Status Visualizer */}
              <div className="w-full lg:w-96 h-96 shrink-0 relative">
                <CommandVisualizer 
                  score={harmonyOverride * 100} 
                  status={isCritical ? 'distorted' : (harmonyOverride > 0.8 ? 'optimal' : 'stable')} 
                />
              </div>
            </div>

            <div className="mt-12">
               <ProactiveResonanceFeed stats={liveStats} />
            </div>
          </motion.div>

          {/* SECONDARY LAYER: The Tuning & Vitality Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
            
            {/* Sanctuary Vitality & Flow (Merged) */}
            <div className="bg-slate-900/40 border border-white/10 rounded-[3rem] p-10 backdrop-blur-3xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <Activity className="w-6 h-6 text-emerald-400" />
                  <h3 className="text-2xl font-black text-white font-alexandria">نبض الملاذ اللحظي</h3>
                </div>
                <div className="px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                  محرك الوعي
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Health Pulse */}
                <div className="space-y-6">
                  <div className="relative flex items-center justify-center h-48">
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl"
                    />
                    <div className="relative z-10 text-center">
                      <span className="block text-5xl font-black text-white tabular-nums tracking-tighter mb-2">{healthScore}%</span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">مؤشر الصحة</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 font-bold leading-relaxed text-right">
                    {healthScore > 90 ? "البنية التحتية في حالة مثالية. لا يوجد أي فاقد في البيانات أو تأخير في الاستجابة." : "تم رصد بعض التذبذبات الطفيفة في سرعة المعالجة المركزية."}
                  </p>
                </div>

                {/* AI Routing Metrics */}
                <div className="space-y-8 flex flex-col justify-center">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                      <span className="text-slate-500">تدخل الذكاء الاصطناعي</span>
                      <span className="text-cyan-400">{liveStats?.routingTelemetry?.interventionHealth?.interventionRatePct ?? 0}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${liveStats?.routingTelemetry?.interventionHealth?.interventionRatePct ?? 0}%` }}
                        className="h-full bg-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                      <span className="text-slate-500">معدل الاستكشاف</span>
                      <span className="text-indigo-400">{liveStats?.routingV2?.explorationRate ?? 0}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${liveStats?.routingV2?.explorationRate ?? 0}%` }}
                        className="h-full bg-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-slate-500 font-bold leading-normal text-right">
                      الخوارزمية تقوم الآن بتوزيع أحمال الوعي لضمان عدم حدوث احتراق نفسي للمسافرين.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Atmosphere Lab: The Tuning Console */}
            <div className="bg-slate-900/40 border border-white/10 rounded-[3rem] p-10 backdrop-blur-3xl">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <Wind className="w-6 h-6 text-amber-400" />
                  <h3 className="text-2xl font-black text-white font-alexandria">مختبر المناخ الأثيري</h3>
                </div>
                <Terminal className="w-5 h-5 text-slate-600" />
              </div>
              
              <div className="space-y-12">
                {/* Harmony Tuning */}
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div className="text-right">
                      <h4 className="text-sm font-black text-white mb-1">توازن التناغم (Global Harmony)</h4>
                      <p className="text-[10px] text-slate-500 font-bold">يتحكم في مستوى الهدوء النفسي العام داخل الملاذ</p>
                    </div>
                    <span className="text-3xl font-black text-teal-400 tabular-nums">{(harmonyOverride * 100).toFixed(0)}%</span>
                  </div>
                  
                  <div className="relative pt-2">
                    <input
                      type="range"
                      min="0.4" max="1.0" step="0.01"
                      value={harmonyOverride}
                      onChange={(e) => handleUpdateHarmony(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-teal-500 hover:accent-teal-400 transition-all"
                    />
                    <div className="flex justify-between mt-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                      <span>معامل الفوضى</span>
                      <span>اتزان السكون</span>
                    </div>
                  </div>
                </div>

                {/* Distortion Tuning */}
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div className="text-right">
                      <h4 className="text-sm font-black text-white mb-1">التموج البصري (Sensory Distortion)</h4>
                      <p className="text-[10px] text-slate-500 font-bold">يؤثر على حدة الإدراك البصري (Chromatic Aberration)</p>
                    </div>
                    <span className="text-3xl font-black text-rose-400 tabular-nums">{(customTokens.chromaticAberration * 100).toFixed(0)}%</span>
                  </div>
                  
                  <div className="relative pt-2">
                    <input
                      type="range"
                      min="0" max="1" step="0.01"
                      value={customTokens.chromaticAberration}
                      onChange={(e) => updateTokens({ chromaticAberration: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-rose-500 hover:accent-rose-400 transition-all"
                    />
                    <div className="flex justify-between mt-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                      <span>وضوح مطلق</span>
                      <span>توتر عميق</span>
                    </div>
                  </div>
                </div>

                {/* Compassion Toggle */}
                <button 
                  onClick={() => setCompassionProtocolActive(!compassionProtocolActive)}
                  className={`w-full p-5 rounded-[2rem] border transition-all duration-500 text-sm font-black flex items-center justify-center gap-4 ${
                    compassionProtocolActive 
                      ? "bg-amber-500 text-slate-900 border-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.2)]" 
                      : "bg-white/5 hover:bg-white/10 border-white/10 text-amber-500"
                  }`}
                >
                  <Shield className={`w-6 h-6 ${compassionProtocolActive ? "animate-pulse" : ""}`} />
                  {compassionProtocolActive ? "بروتوكول الرحمة نشط: عزل الأرواح عن التشتيت" : "تفعيل بروتوكول الرحمة (Compassion)"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Illusion Radar (Full Width) */}
      <CollapsibleSection
        title="رادار الأوهام والدجل"
        subtitle="خريطة رصد الاصطدامات"
        icon={<Eye className="w-4 h-4" />}
        defaultExpanded={false}
        needsAttention={hasHighPriorityIllusions}
      >
        <div className="mt-4">
          <IllusionRadar scenarios={liveStats?.topScenarios ?? null} isLoading={isLoadingPulse} />
        </div>
      </CollapsibleSection>

      {/* Command Chronicle - Archive */}
      <CollapsibleSection
        title="أرشيف القيادة (Command Chronicle)"
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
                     <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">تواصل كوني</span>
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
          "سلطة القيادة هي مسؤولية تجاه السكينة العامة. استخدم المِرآة لتكشف النور، لا لتعمق الظلال."
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
              <h2 className="text-3xl font-black text-rose-500 uppercase tracking-tighter mb-4">الاستيلاء على القيادة</h2>
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
};
