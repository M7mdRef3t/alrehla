import type { FC } from "react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, Radio, Activity, Sparkles, Brain, Orbit, X, Target, Users, TrendingUp, ShieldAlert, Award, Zap
} from "lucide-react";
import { growthEngine, type DiffusionMetrics } from "@/services/growthEngine";
import { supabase, isSupabaseReady } from "@/services/supabaseClient";
import { getAuthToken } from "@/state/authState";
import { useAdminState } from "@/state/adminState";

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

const GatewayCard: FC<{ id: string, data: any, isActive: boolean, stats: any, onClick: () => void }> = ({ id, data, isActive, stats, onClick }) => {
  const gw = AVAILABLE_GATEWAYS.find(g => g.id === id)!;
  const count = getLeadCount(stats?.leadsBySource, id);
  const res = getLeadCount(stats?.conversionsBySource, id);
  const rate = count > 0 ? Math.round((res/count)*100) : 0;
  return (
    <motion.div onClick={onClick} className={`p-6 rounded-3xl border cursor-pointer transition-all flex flex-col justify-between ${isActive ? "bg-indigo-500/10 border-indigo-500/30 shadow-xl" : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"}`}>
      <div className="flex justify-between items-center mb-4">
        <gw.icon className={`w-6 h-6 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
        <span className="text-[10px] font-black text-slate-500 uppercase">{rate}% تحويل</span>
      </div>
      <div>
        <h4 className="text-sm font-black text-white mb-1">{gw.name}</h4>
        <p className="text-2xl font-black text-white tabular-nums">{count}</p>
      </div>
    </motion.div>
  );
};

const LeadCard: FC<{ lead: any, onFilterSelect: any, onAward: (id: string) => void, awarding: boolean }> = ({ lead: l, onFilterSelect, onAward, awarding }) => {
  const isSpam = l.metadata?.oracle_is_spam || l.metadata?.oracle_grade === 'F';
  const grade = l.metadata?.oracle_grade;
  const intent = l.metadata?.oracle_intent;
  const reasoning = l.metadata?.oracle_reasoning;
  const action = l.metadata?.oracle_recommended_action;
  
  const points = l.metadata?.boarding_gamification?.awareness_points || 0;

  const bgStyles = isSpam 
    ? "bg-rose-950/20 border-rose-900/30 opacity-60" 
    : grade === 'S' || grade === 'A' 
      ? "bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.05)]" 
      : "bg-white/[0.02] border-white/5";

  return (
    <div className={`p-6 rounded-[2rem] border transition-all ${bgStyles}`}>
      <div className="flex flex-col gap-4">
        {/* Header (Info + Actions) */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => onFilterSelect({ type: "source", value: l.source_type, query: l.email || l.name || l.phone_normalized })}>
             <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSpam ? 'bg-rose-500/10 text-rose-400' : grade === 'S' || grade === 'A' ? 'bg-indigo-400/20 text-indigo-400' : 'bg-white/5 text-slate-400'}`}>
                {isSpam ? <ShieldAlert className="w-5 h-5" /> : <Orbit className="w-5 h-5" />}
             </div>
             <div>
                <p className="text-base font-black text-white mb-1 flex items-center flex-wrap gap-2">
                  {l.name || "روح جديدة"}
                  {grade && (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] tracking-widest uppercase ${
                      grade === 'S' || grade === 'A' ? 'bg-emerald-500/20 text-emerald-400' :
                      grade === 'B' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'
                    }`}>درجة {grade}</span>
                  )}
                  {points > 0 && (
                     <span className="px-2 py-0.5 rounded-md text-[10px] tracking-widest bg-fuchsia-500/20 text-fuchsia-400 flex items-center gap-1">
                       <Award className="w-3 h-3" /> {points} نقطة وعي
                     </span>
                  )}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">{l.email || l.phone_normalized}</p>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isSpam && (
              <button disabled={awarding} onClick={() => onAward(l.id)} className="p-2.5 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 rounded-xl transition-all disabled:opacity-50" title="Grant 50 Awareness Points">
                 <Zap className={`w-4 h-4 ${awarding ? 'animate-pulse' : ''}`} />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${l.phone?.replace(/\D/g, '')}`) }} className="p-2.5 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-all">
               <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            </button>
          </div>
        </div>

        {/* AI Analysis Summary */}
        {(intent || reasoning) && (
          <div className="mt-2 bg-black/20 p-5 rounded-2xl border border-white/5 space-y-3">
             {intent && (
                <div className="flex items-center gap-3 text-indigo-300">
                   <Target className="w-5 h-5 shrink-0" />
                   <p className="text-sm font-bold leading-normal">{intent}</p>
                </div>
             )}
             {reasoning && (
                <div className="flex items-start gap-3 text-slate-400">
                   <Brain className="w-4 h-4 shrink-0 mt-1 opacity-70" />
                   <p className="text-xs leading-relaxed italic">{reasoning}</p>
                </div>
             )}
             {action && !isSpam && (
                <div className="flex items-center gap-3 pt-3 mt-3 border-t border-white/5 text-amber-400">
                   <Sparkles className="w-4 h-4 shrink-0" />
                   <p className="text-[11px] font-black uppercase tracking-widest">{action}</p>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export const SovereignGatewayCommand: FC<{ onFilterSelect: (f: any) => void, stats?: any }> = ({ onFilterSelect, stats }) => {
  const [activeGateway, setActiveGateway] = useState<string | null>(null);
  const [oracleStats, setOracleStats] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [awardingPoints, setAwardingPoints] = useState<Record<string, boolean>>({});
  const [localMetaOverrides, setLocalMetaOverrides] = useState<Record<string, any>>({});

  const fetchOracle = async () => {
    try {
      const r = await fetch("/api/admin/intelligence/oracle-leads", {
        headers: { authorization: `Bearer ${getBearerToken()}` }
      });
      const d = await r.json();
      if (d.ok) setOracleStats(d);
    } catch {
      // Sliently skip if oracle fetch fails
    }
  };

  const runOracle = async () => {
    setAnalyzing(true);
    await fetch("/api/admin/intelligence/oracle-leads", { method: "POST", headers: { "Content-Type": "application/json", authorization: `Bearer ${getBearerToken()}` }, body: JSON.stringify({ batchSize: 20 }) });
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
        // Optimistic update
        setLocalMetaOverrides(prev => ({
          ...prev,
          [leadId]: { 
             ...prev[leadId], 
             boarding_gamification: { awareness_points: data.newTotal } 
          }
        }));
      }
    } catch (err) {
      console.error("Failed to grant points", err);
    } finally {
      setAwardingPoints(p => ({ ...p, [leadId]: false }));
    }
  };

  useEffect(() => { fetchOracle(); }, []);

  const gatewayLeads = useMemo(() => {
    if (!activeGateway) return [];
    const gw = AVAILABLE_GATEWAYS.find(g => g.id === activeGateway);
    return (stats?.rawLeads || []).filter((l: any) => gw?.sourceKeys.includes(l.source_type?.toLowerCase())).slice(0, 50).map((l: any) => {
       // Apply local optimisic overrides
       if (localMetaOverrides[l.id]) {
         return {
           ...l,
           metadata: { ...(l.metadata || {}), ...localMetaOverrides[l.id] }
         };
       }
       return l;
    });
  }, [activeGateway, stats, localMetaOverrides]);

  return (
    <div className="space-y-10" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="hud-glass p-8 rounded-[2.5rem] border-white/5 bg-white/[0.02]">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">إجمالي الأرواح</p>
          <h3 className="text-5xl font-black text-white">{(stats?.totalDatabaseLeads || 0).toLocaleString("ar-EG")}</h3>
        </div>
        <div className="hud-glass p-8 rounded-[2.5rem] border-white/5 bg-white/[0.02]">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">الزوار (٢٤ ساعة)</p>
          <h3 className="text-5xl font-black text-white">{(oracleStats?.stats?.funnel?.visitors24h || 0).toLocaleString("ar-EG")}</h3>
        </div>
        <div className="hud-glass p-8 rounded-[2.5rem] border-indigo-500/10 bg-indigo-500/5">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">معدل التحويل</p>
          <h3 className="text-5xl font-black text-white">{(oracleStats?.stats?.funnel?.conversionRate || 0).toFixed(1)}%</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 hud-glass p-10 rounded-[3.5rem] bg-slate-900/40 border-white/10">
          <h3 className="text-xl font-black text-white mb-10 flex items-center gap-4"><Orbit className="w-6 h-6 text-indigo-400" /> مسارات الرحلات السيادية</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {AVAILABLE_GATEWAYS.map(gw => (
              <GatewayCard key={gw.id} id={gw.id} stats={stats} isActive={activeGateway === gw.id} onClick={() => setActiveGateway(gw.id)} data={null} />
            ))}
          </div>
        </div>
        <div className="xl:col-span-4 hud-glass p-10 rounded-[3.5rem] bg-indigo-500/[0.02] border-indigo-500/10 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-black text-white mb-8 flex items-center gap-4"><Sparkles className="w-6 h-6 text-indigo-400" /> ذكاء الأوراكل</h3>
            <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 mb-6">
               <p className="text-[10px] font-black text-slate-500 uppercase mb-2">قيد الانتظار</p>
               <p className="text-2xl font-black text-white">{oracleStats?.stats?.pending || 0} <span className="text-sm font-bold text-slate-400">روح لم تُحلل</span></p>
            </div>
          </div>
          <button onClick={runOracle} disabled={analyzing} className="w-full py-5 rounded-3xl bg-indigo-600 text-white font-black uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 flex items-center justify-center gap-3">
            <Brain className={`w-5 h-5 ${analyzing ? 'animate-pulse' : ''}`} /> {analyzing ? "جاري التحليل المعمق..." : "تشغيل الأوراكل"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {activeGateway && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="hud-glass p-6 md:p-10 rounded-[3.5rem] bg-slate-950/60 border-white/5">
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                   <h4 className="text-2xl font-black text-white italic">{AVAILABLE_GATEWAYS.find(g => g.id === activeGateway)?.name}</h4>
                   <button onClick={() => onFilterSelect({ type: "source", value: activeGateway })} className="px-4 py-2 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md hidden sm:block">فتح سجلات الرحلة بالكامل</button>
                </div>
                <button onClick={() => setActiveGateway(null)} className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><X className="w-6 h-6" /></button>
             </div>
             
             <div className="space-y-4">
                {gatewayLeads.map((l: any) => (
                   <LeadCard 
                     key={l.id} 
                     lead={l} 
                     onFilterSelect={onFilterSelect} 
                     onAward={grantGamificationPoints}
                     awarding={awardingPoints[l.id]} 
                   />
                ))}
                {gatewayLeads.length === 0 && (
                   <div className="py-20 text-center text-slate-500">
                     لا توجد أرواح تم رصدها من هذه الرحلة في العينة الحالية.
                   </div>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
