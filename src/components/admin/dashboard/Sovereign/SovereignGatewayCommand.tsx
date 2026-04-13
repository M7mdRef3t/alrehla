import type { FC } from "react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, Radio, Activity, Sparkles, Brain, Orbit, X, Target, Users, TrendingUp, ShieldAlert, Award, Zap,
  Navigation, MousePointer2, Thermometer, Info, MapPin, RefreshCw, Lock, Unlock, ZapOff, Check
} from "lucide-react";
import { growthEngine, type DiffusionMetrics } from "@/services/growthEngine";
import { getAuthToken } from "@/domains/auth/store/auth.store";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { useToastState } from '@/modules/map/dawayirIndex';

function getBearerToken(): string {
  return getAuthToken() ?? useAdminState.getState().adminCode ?? "";
}

export const AVAILABLE_GATEWAYS = [
  { id: 'meta', name: 'رحلة ميتا', icon: Orbit, sourceKeys: ['meta_instant_form', 'meta', 'facebook', 'instagram'] },
  { id: 'tiktok', name: 'رحلة تيك توك', icon: Activity, sourceKeys: ['tiktok'] },
  { id: 'google', name: 'رحلة جوجل / الموقع', icon: Globe, sourceKeys: ['google', 'website', 'google_ads', 'organic'] },
  { id: 'direct', name: 'الرحلة المباشرة', icon: Radio, sourceKeys: ['direct', 'whatsapp', 'manual_import', 'manual', 'referral', ''] }
];

function getLeadCount(leadsBySource: any, gatewayId: string): number {
  if (!leadsBySource) return 0;
  const gw = AVAILABLE_GATEWAYS.find(g => g.id === gatewayId);
  return Object.entries(leadsBySource).reduce((sum, [k, c]) => 
     gw?.sourceKeys.some(sk => k.toLowerCase().includes(sk)) ? sum + (c as number) : sum, 0);
}

const GatewayCard: FC<{ id: string, data: any, isActive: boolean, stats: any, diffusion: any, onClick: () => void }> = ({ id, data, isActive, stats, diffusion, onClick }) => {
  const gw = AVAILABLE_GATEWAYS.find(g => g.id === id)!;
  const health = diffusion?.gatewayHealth?.[id];
  const resonance = health?.resonance ? Math.round(health.resonance * 100) : 0;
  const pulse = health?.pulse || 0;
  const count = getLeadCount(stats?.leadsBySource, id);
  const isLocked = health?.status === 'locked';
  
  return (
    <motion.div 
      onClick={onClick} 
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className={`p-6 rounded-[2.5rem] border cursor-pointer transition-all flex flex-col justify-between h-[200px] relative overflow-hidden ${
        isActive 
          ? "bg-indigo-500/10 border-indigo-500/30 shadow-2xl shadow-indigo-500/10" 
          : isLocked ? "bg-rose-500/5 border-rose-500/20 grayscale" : "bg-white/[0.02] border-white/5 hover:border-white/10"
      }`}
    >
      <div className="flex justify-between items-center relative z-10">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isActive ? "bg-indigo-500/20 text-indigo-400" : isLocked ? "bg-rose-500/20 text-rose-400" : "bg-white/5 text-slate-500"}`}>
           {isLocked ? <Lock className="w-5 h-5" /> : <gw.icon className="w-5 h-5" />}
        </div>
        <div className="flex flex-col items-end">
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">الرنين (Resonance)</span>
           <span className={`text-xs font-black ${resonance > 30 ? 'text-emerald-400' : 'text-amber-400'}`}>{resonance}%</span>
        </div>
      </div>

      <div className="relative z-10">
        <h4 className="text-sm font-black text-white mb-1">{gw.name}</h4>
        <div className="flex items-end gap-2">
           <p className="text-3xl font-black text-white tabular-nums">{count}</p>
           <span className="text-[10px] text-slate-500 font-bold mb-1.5 uppercase">روح</span>
        </div>
      </div>

      {/* Pulse Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
         <motion.div 
           initial={{ width: 0 }}
           animate={{ width: `${pulse}%` }}
           className={`h-full ${isLocked ? 'bg-rose-500' : resonance > 30 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`}
         />
      </div>
    </motion.div>
  );
};

const LeadCard: FC<{ lead: any, onFilterSelect: any, onAward: (id: string) => void, onOpenWhatsapp: any, awarding: boolean }> = ({ lead: l, onFilterSelect, onAward, onOpenWhatsapp, awarding }) => {
  const isSpam = l.metadata?.oracle_is_spam || l.metadata?.oracle_grade === 'F';
  const grade = l.metadata?.oracle_grade;
  const intent = l.metadata?.oracle_intent;
  const reasoning = l.metadata?.oracle_reasoning;
  const action = l.metadata?.oracle_recommended_action;
  const phone = l.phone_normalized || l.metadata?.phone || l.metadata?.fb_phone || "";
  const campaign = l.metadata?.campaign || l.campaign;
  const source = l.metadata?.source || l.source || l.source_type;
  
  const points = l.metadata?.boarding_gamification?.awareness_points || 0;

  return (
    <div className={`p-6 rounded-[2rem] border transition-all ${
      isSpam 
        ? "bg-rose-950/20 border-rose-900/30 opacity-60" 
        : grade === 'S' || grade === 'A' 
          ? "bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.05)]" 
          : "bg-white/[0.01] border-white/5"
    }`}>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => onFilterSelect({ type: "source", value: l.source_type || l.source || "meta", expandedId: l.id })}>
             <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSpam ? 'bg-rose-500/10 text-rose-400' : grade === 'S' || grade === 'A' ? 'bg-indigo-400/20 text-indigo-400' : 'bg-white/5 text-slate-400'}`}>
                {isSpam ? <ShieldAlert className="w-5 h-5" /> : <Orbit className="w-5 h-5" />}
             </div>
             <div>
                <p className="text-base font-black text-white mb-1 flex items-center flex-wrap gap-2">
                   {l.name || "روح مستكشفة"}
                   {grade && (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] tracking-widest uppercase font-black ${
                      grade === 'S' || grade === 'A' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                      grade === 'B' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' : 'bg-slate-500/20 text-slate-400 border border-slate-500/20'
                    }`}>GRADE {grade}</span>
                   )}
                   {points > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] tracking-widest bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/20 flex items-center gap-1">
                        <Award className="w-3 h-3" /> {points} نقطة
                      </span>
                   )}
                </p>
                <p className="text-[11px] text-slate-500 font-mono tracking-tight">{l.email || phone}</p>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isSpam && (
              <button disabled={awarding} onClick={() => onAward(l.id)} className="p-2.5 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 rounded-xl transition-all disabled:opacity-50" title="Grant 50 Awareness Points">
                 <Zap className={`w-4 h-4 ${awarding ? 'animate-pulse' : ''}`} />
              </button>
            )}
            <button 
                onClick={(e) => { e.stopPropagation(); onOpenWhatsapp(l.id, phone, l.name, campaign, source); }} 
                className={`p-2.5 rounded-xl transition-all border ${l.metadata?.whatsapp_sent ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30' : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/10'}`}
                title={l.metadata?.whatsapp_sent ? "تم التواصل عبر واتساب" : "تواصل عبر واتساب"}
            >
               {l.metadata?.whatsapp_sent ? <Check className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {(intent || reasoning) && (
          <div className="mt-2 bg-black/40 p-5 rounded-2xl border border-white/5 space-y-3 relative">
             <div className="absolute top-4 left-4 opacity-10"><Brain className="w-8 h-8" /></div>
             {intent && (
                <div className="flex items-center gap-3 text-indigo-300">
                   <Target className="w-5 h-5 shrink-0" />
                   <p className="text-sm font-bold leading-normal">{intent}</p>
                </div>
             )}
             {reasoning && (
                <div className="flex items-start gap-3 text-slate-400">
                   <Info className="w-4 h-4 shrink-0 mt-1 opacity-70 text-indigo-400" />
                   <p className="text-xs leading-relaxed italic font-medium">{reasoning}</p>
                </div>
             )}
             {action && !isSpam && (
                <div className="flex items-center gap-3 pt-3 mt-3 border-t border-white/5 text-emerald-400">
                   <Sparkles className="w-4 h-4 shrink-0" />
                   <p className="text-[10px] font-black uppercase tracking-widest">{action}</p>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export const SovereignGatewayCommand: FC<{ 
  onFilterSelect: (f: any) => void, 
  onOpenWhatsapp: (id: string, phone: string, name: string, campaign?: string, source?: string) => void, 
  stats?: any 
}> = ({ onFilterSelect, onOpenWhatsapp, stats }) => {
  const [activeGateway, setActiveGateway] = useState<string | null>(null);
  const [oracleData, setOracleData] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [awardingPoints, setAwardingPoints] = useState<Record<string, boolean>>({});
  const [localMetaOverrides, setLocalMetaOverrides] = useState<Record<string, any>>({});
  const [autoIgnitionRunning, setAutoIgnitionRunning] = useState(false);

  const fetchOracle = async () => {
    try {
      const r = await fetch("/api/admin/intelligence/oracle-leads", {
        headers: { authorization: `Bearer ${getBearerToken()}` }
      });
      const d = await r.json();
      if (d.ok) setOracleData(d);
    } catch {
      // Sliently skip
    }
  };

  const updateGatewayConfig = async (id: string, updates: any) => {
    setUpdating(true);
    try {
      await fetch("/api/admin/marketing-ops/gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${getBearerToken()}` },
        body: JSON.stringify({ id, ...updates })
      });
      await fetchOracle();
      useToastState.getState().showToast("تم تحديث إعدادات المسار سيادياً", "success");
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const recalibrateGateway = async (id: string) => {
    setUpdating(true);
    try {
      await fetch("/api/admin/marketing-ops/gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${getBearerToken()}` },
        body: JSON.stringify({ id, action: 'recalibrate' })
      });
      await fetchOracle();
      useToastState.getState().showToast("تمت إعادة معايرة نبض المسار", "success");
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const runOracle = async () => {
    setAnalyzing(true);
    await fetch("/api/admin/intelligence/oracle-leads", { 
      method: "POST", 
      headers: { "Content-Type": "application/json", authorization: `Bearer ${getBearerToken()}` }, 
      body: JSON.stringify({ batchSize: 20 }) 
    });
    await fetchOracle();
    setAnalyzing(false);
  };

  const grantGamificationPoints = async (leadId: string) => {
    setAwardingPoints(p => ({ ...p, [leadId]: true }));
    try {
      const res = await fetch("/api/admin/marketing-ops/lead-gamify", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${getBearerToken()}` },
        body: JSON.stringify({ leadId, points: 50 })
      });
      const data = await res.json();
      if (data.ok) {
        setLocalMetaOverrides(prev => ({
          ...prev,
          [leadId]: { 
             ...prev[leadId], 
             boarding_gamification: { awareness_points: data.newTotal } 
          }
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAwardingPoints(p => ({ ...p, [leadId]: false }));
    }
  };

  useEffect(() => { fetchOracle(); }, []);

  const gatewayLeads = useMemo(() => {
    if (!activeGateway) return [];
    const gw = AVAILABLE_GATEWAYS.find(g => g.id === activeGateway);
    return (stats?.rawLeads || []).filter((l: any) => gw?.sourceKeys.includes(l.source_type?.toLowerCase())).slice(0, 50).map((l: any) => {
       if (localMetaOverrides[l.id]) {
         return { ...l, metadata: { ...(l.metadata || {}), ...localMetaOverrides[l.id] } };
       }
       return l;
    });
  }, [activeGateway, stats, localMetaOverrides]);

  const activeHealth = activeGateway ? oracleData?.diffusion?.gatewayHealth?.[activeGateway] : null;

  const syncPlatforms = async () => {
    setUpdating(true);
    try {
      await fetch("/api/admin/marketing-ops/gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${getBearerToken()}` },
        body: JSON.stringify({ action: 'sync' })
      });
      await fetchOracle();
      useToastState.getState().showToast("تمت مزامنة ميزانيات المنصات الحقيقية", "success");
    } catch (err) {
      console.error(err);
      useToastState.getState().showToast("فشلت المزامنة. تأكد من إعدادات API", "error");
    } finally {
      setUpdating(false);
    }
  };

  const syncMetaLeadsManually = async () => {
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/marketing-ops/leads-sync-manual", {
        method: "POST",
        headers: { authorization: `Bearer ${getBearerToken()}` }
      });
      const data = await res.json();
      if (data.ok) {
        useToastState.getState().showToast(`تم سحب ${data.count} ليد جديد من ميتا`, "success");
        await fetchOracle();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      useToastState.getState().showToast(err.message || "فشل سحب ليدز ميتا", "error");
    } finally {
      setUpdating(false);
    }
  };

  const toggleAutoIgnition = async (id: string, enabled: boolean) => {
    setUpdating(true);
    try {
      await fetch("/api/admin/marketing-ops/gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${getBearerToken()}` },
        body: JSON.stringify({ id, auto_ignition_enabled: enabled })
      });
      await fetchOracle();
      useToastState.getState().showToast(enabled ? "تم تفعيل الاشتعال الذاتي للمسار 🔥" : "تم إيقاف التحكم الآلي", "success");
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const triggerAutoIgnitionManual = async () => {
    setAutoIgnitionRunning(true);
    try {
      const res = await fetch("/api/admin/marketing-ops/auto-ignition", {
        method: "POST",
        headers: { authorization: `Bearer ${getBearerToken()}` }
      });
      const data = await res.json();
      if (data.ok) {
        useToastState.getState().showToast(`تم تشغيل دورة القرار: ${data.actionsCount} تدخل آلي`, "success");
        await fetchOracle();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAutoIgnitionRunning(false);
    }
  };

  return (
    <div className="space-y-10" dir="rtl">
      {/* 🚀 Pulse Dashboard (Velocity & kFactor) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="hud-glass p-8 rounded-[2.5rem] border-white/5 bg-white/[0.02] flex flex-col justify-between">
           <div>
             <div className="flex items-center gap-2 mb-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">نبض الأرواح (Velocity)</p>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             </div>
             <h3 className="text-4xl font-black text-white">{(oracleData?.diffusion?.velocity || 0).toFixed(1)} <span className="text-sm font-bold text-slate-500">روح/ساعة</span></h3>
           </div>
        </div>
        <div className="hud-glass p-8 rounded-[2.5rem] border-white/5 bg-white/[0.02]">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">معامل التجذر (k-Factor)</p>
           <h3 className="text-4xl font-black text-indigo-400">{(oracleData?.diffusion?.kFactor || 0.42).toFixed(2)}</h3>
        </div>
        <div className="hud-glass p-8 rounded-[2.5rem] border-white/5 bg-white/[0.02]">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">الزوار (٢٤ ساعة)</p>
           <h3 className="text-4xl font-black text-white">{(oracleData?.stats?.funnel?.visitors24h || 0).toLocaleString("en-US")}</h3>
        </div>
        <div className="hud-glass p-8 rounded-[2.5rem] border-indigo-500/10 bg-indigo-500/5">
           <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Auto-Ignition</p>
              <div className={`w-2 h-2 rounded-full ${autoIgnitionRunning ? 'bg-orange-500 animate-ping' : 'bg-indigo-400 opacity-20'}`} />
           </div>
           <button 
             onClick={triggerAutoIgnitionManual}
             disabled={autoIgnitionRunning}
             className="w-full py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 transition-all active:scale-95"
           >
             {autoIgnitionRunning ? "جاري المعالجة..." : "تشغيل دورة القرار"}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Gateway Selection Area */}
        <div className="xl:col-span-8 hud-glass p-10 rounded-[3.5rem] bg-slate-900/40 border-white/10">
          <div className="flex items-center justify-between mb-10">
             <h3 className="text-xl font-black text-white flex items-center gap-4"><Orbit className="w-6 h-6 text-indigo-400" /> مسارات الرحلات السيادية</h3>
             <button 
                onClick={syncPlatforms}
                disabled={updating}
                className="px-6 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
             >
                <RefreshCw className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} /> تزامن مع المنصات
             </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {AVAILABLE_GATEWAYS.map(gw => (
              <GatewayCard 
                key={gw.id} 
                id={gw.id} 
                stats={stats} 
                diffusion={oracleData?.diffusion} 
                isActive={activeGateway === gw.id} 
                onClick={() => setActiveGateway(gw.id)} 
                data={null} 
              />
            ))}
          </div>
        </div>

        {/* Oracle Verdict & Control Card */}
        <div className="xl:col-span-4 hud-glass p-10 rounded-[3.5rem] bg-indigo-500/[0.02] border-indigo-500/10 flex flex-col">
          <div className="flex-1">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-4"><Brain className="w-6 h-6 text-purple-400" /> قرار الأوراكل</h3>
            
            {activeGateway ? (
              <div className="space-y-6">
                <motion.div 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-purple-500/5 border border-purple-500/20 p-6 rounded-3xl"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                           <Thermometer className="w-4 h-4 text-purple-400" />
                           <span className="text-[10px] uppercase font-black tracking-widest text-purple-300">Resonance Diagnostics</span>
                        </div>
                        {activeHealth?.auto_ignition_enabled && (
                            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-[8px] font-black rounded-md uppercase tracking-tighter border border-orange-500/20 animate-pulse">AUTO-IGNITION ON</span>
                        )}
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                    {activeHealth?.oracleVerdict || "جاري استقراء ترددات الرحلة..."}
                    </p>
                    {activeHealth?.spend > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-2">
                        <div>
                            <p className="text-[9px] text-slate-500 uppercase font-black mb-1">ROI المقدر</p>
                            <p className="text-base font-black text-emerald-400">{Math.round(activeHealth.roi)}%</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 uppercase font-black mb-1">CPL</p>
                            <p className="text-base font-black text-indigo-400">${activeHealth.cpl?.toFixed(1) || "0"}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 uppercase font-black mb-1">{activeHealth?.actualSpend > 0 ? "الميزانية" : "الطاقة"}</p>
                            <p className="text-base font-black text-white">${Math.round(activeHealth.spend)}</p>
                        </div>
                    </div>
                    )}
                </motion.div>

                {/* Sovereign Control Box */}
                <div className="p-6 rounded-3xl bg-slate-900/50 border border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-slate-500 uppercase">حالة البوابة سيادياً</span>
                           <button 
                             onClick={() => toggleAutoIgnition(activeGateway, !activeHealth?.auto_ignition_enabled)}
                             className={`text-[9px] font-black uppercase tracking-widest mt-1 text-right ${activeHealth?.auto_ignition_enabled ? 'text-orange-400' : 'text-slate-600'}`}
                           >
                             {activeHealth?.auto_ignition_enabled ? "[ تفعيل الاشتعال الذاتي ]" : "[ تفعيل اليدوي فقط ]"}
                           </button>
                        </div>
                        <div className="flex gap-2">
                            {activeGateway === 'meta' && (
                                <button 
                                    disabled={updating}
                                    onClick={syncMetaLeadsManually}
                                    className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500/20 transition-all"
                                    title="سحب ليدز ميتا يدوياً"
                                >
                                    <Users className="w-4 h-4" />
                                </button>
                            )}
                            <button 
                                disabled={updating}
                                onClick={() => updateGatewayConfig(activeGateway, { status: activeHealth?.status === 'locked' ? 'open' : 'locked' })}
                                className={`p-2 rounded-xl transition-all ${activeHealth?.status === 'locked' ? 'bg-rose-500 text-white' : 'bg-emerald-500/10 text-emerald-400'}`}
                            >
                                {activeHealth?.status === 'locked' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
                            <span>تركيز الطاقة</span>
                            <span className="text-indigo-400">{activeHealth?.energyLevel || 50}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="100" step="10"
                            disabled={updating}
                            value={activeHealth?.energyLevel || 50}
                            onChange={(e) => updateGatewayConfig(activeGateway, { energy_level: parseInt(e.target.value) })}
                            className="w-full accent-indigo-500 h-1 bg-white/5 rounded-full appearance-none cursor-pointer"
                        />
                    </div>

                    <button 
                        disabled={updating}
                        onClick={() => recalibrateGateway(activeGateway)}
                        className="w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} /> إعادة معايرة النبض
                    </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/5 p-6 rounded-3xl text-center">
                 <p className="text-sm text-slate-500 font-bold">يرجى تحديد رحلة لمشاهدة تحليل الرنين وقرار الأوراكل.</p>
              </div>
            )}
          </div>
          <button 
             onClick={runOracle} 
             disabled={analyzing || (oracleData?.stats?.pending === 0)} 
             className="w-full mt-6 py-5 rounded-3xl bg-indigo-600 text-white font-black uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            <Brain className={`w-5 h-5 ${analyzing ? 'animate-pulse' : ''}`} /> {analyzing ? "جاري التحليل المعمق..." : "تنشيط الأوراكل"}
          </button>
        </div>
      </div>

      {/* 🗺️ Regional Diffusion Heatmap (Mini) */}
      {oracleData?.diffusion?.regionalDiffusion && (
        <div className="hud-glass p-8 rounded-[3.5rem] border-white/5 bg-slate-900/20 overflow-hidden relative">
           <div className="absolute right-0 top-0 opacity-5 pointer-events-none transition-transform group-hover:scale-110">
              <Navigation className="w-64 h-64 -mr-16 -mt-16" />
           </div>
           <h3 className="text-lg font-black text-white mb-8 flex items-center gap-3"><MapPin className="w-5 h-5 text-indigo-400" /> انتشار الرحلة عبر الأقاليم</h3>
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(oracleData.diffusion.regionalDiffusion).map(([region, score]: [string, any]) => (
                 <div key={region} className="relative p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-sm font-black text-white">{region}</span>
                       <span className="text-[10px] font-black text-indigo-400">{Math.round(score * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${score * 100}%` }}
                         className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                       />
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* 👤 Sample Leads Monitoring */}
      <AnimatePresence mode="wait">
        {activeGateway && (
          <motion.div 
            key={activeGateway}
            initial={{ opacity: 0, scale: 0.98, y: 30 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.98, y: 30 }} 
            className="hud-glass p-6 md:p-10 rounded-[3.5rem] bg-slate-950/60 border-white/10 shadow-2xl"
          >
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-6">
                   <h4 className="text-3xl font-black text-white italic tracking-tight">{AVAILABLE_GATEWAYS.find(g => g.id === activeGateway)?.name}</h4>
                   <button 
                     onClick={() => onFilterSelect({ type: "source", value: activeGateway })} 
                     className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 transition-all flex items-center gap-3 group"
                   >
                     سجلات الرحلة <TrendingUp className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
                <button onClick={() => setActiveGateway(null)} className="p-4 bg-white/5 hover:bg-rose-500/10 rounded-2xl text-slate-500 hover:text-rose-500 transition-all">
                  <X className="w-6 h-6" />
                </button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gatewayLeads.map((l: any) => (
                   <LeadCard 
                     key={l.id} 
                     lead={l} 
                     onFilterSelect={onFilterSelect} 
                     onAward={grantGamificationPoints}
                     onOpenWhatsapp={onOpenWhatsapp}
                     awarding={awardingPoints[l.id]} 
                   />
                ))}
                {gatewayLeads.length === 0 && (
                   <div className="col-span-full py-24 text-center">
                     <Users className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                     <p className="text-slate-500 font-bold">لا توجد أرواح تم رصدها من هذا المسار حالياً.</p>
                   </div>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
