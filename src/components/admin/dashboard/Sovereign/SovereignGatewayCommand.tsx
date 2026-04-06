import type { FC } from "react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, Radio, Activity, Sparkles, Brain, Orbit, X, Target, Users, TrendingUp 
} from "lucide-react";
import { growthEngine, type DiffusionMetrics } from "../../../../services/growthEngine";
import { supabase, isSupabaseReady } from "../../../../services/supabaseClient";
import { getAuthToken } from "../../../../state/authState";
import { useAdminState } from "../../../../state/adminState";

function getBearerToken(): string {
  return getAuthToken() ?? useAdminState.getState().adminCode ?? "";
}

export const AVAILABLE_GATEWAYS = [
  { id: 'meta', name: 'بوابة Meta', icon: Orbit, sourceKeys: ['meta_instant_form', 'meta', 'facebook', 'instagram'] },
  { id: 'tiktok', name: 'تيك توك', icon: Activity, sourceKeys: ['tiktok'] },
  { id: 'google', name: 'جوجل / الموقع', icon: Globe, sourceKeys: ['google', 'website', 'google_ads', 'organic'] },
  { id: 'direct', name: 'نداء مباشر', icon: Radio, sourceKeys: ['direct', 'whatsapp', 'manual_import', 'manual', 'referral', ''] }
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
    <motion.div onClick={onClick} className={`p-6 rounded-3xl border cursor-pointer transition-all ${isActive ? "bg-indigo-500/10 border-indigo-500/30 shadow-xl" : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"}`}>
      <div className="flex justify-between items-center mb-4">
        <gw.icon className={`w-6 h-6 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
        <span className="text-[10px] font-black text-slate-500 uppercase">{rate}% Res</span>
      </div>
      <h4 className="text-sm font-black text-white mb-1">{gw.name}</h4>
      <p className="text-2xl font-black text-white tabular-nums">{count}</p>
    </motion.div>
  );
};

export const SovereignGatewayCommand: FC<{ onFilterSelect: (f: any) => void, stats?: any }> = ({ onFilterSelect, stats }) => {
  const [activeGateway, setActiveGateway] = useState<string | null>(null);
  const [oracleStats, setOracleStats] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

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

  useEffect(() => { fetchOracle(); }, []);

  const gatewayLeads = useMemo(() => {
    if (!activeGateway) return [];
    const gw = AVAILABLE_GATEWAYS.find(g => g.id === activeGateway);
    return (stats?.rawLeads || []).filter((l: any) => gw?.sourceKeys.includes(l.source_type?.toLowerCase())).slice(0, 10);
  }, [activeGateway, stats]);

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
          <h3 className="text-xl font-black text-white mb-10 flex items-center gap-4"><Orbit className="w-6 h-6 text-indigo-400" /> البوابات السيادية</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {AVAILABLE_GATEWAYS.map(gw => (
              <GatewayCard key={gw.id} id={gw.id} stats={stats} isActive={activeGateway === gw.id} onClick={() => setActiveGateway(gw.id)} data={null} />
            ))}
          </div>
        </div>
        <div className="xl:col-span-4 hud-glass p-10 rounded-[3.5rem] bg-indigo-500/[0.02] border-indigo-500/10">
          <h3 className="text-xl font-black text-white mb-10 flex items-center gap-4"><Sparkles className="w-6 h-6 text-indigo-400" /> Oracle Intelligence</h3>
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
               <p className="text-[10px] font-black text-slate-500 uppercase mb-2">الحالة</p>
               <p className="text-sm font-bold text-white">{oracleStats?.stats?.pending || 0} روح تحتاج تحليل.</p>
            </div>
            <button onClick={runOracle} disabled={analyzing} className="w-full py-5 rounded-3xl bg-indigo-600 text-white font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center justify-center gap-3">
              <Brain className="w-5 h-5" /> {analyzing ? "جاري التحليل..." : "تشغيل الأوراكل"}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeGateway && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="hud-glass p-10 rounded-[3.5rem] bg-slate-950/60 border-white/5">
             <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                   <h4 className="text-2xl font-black text-white italic">{AVAILABLE_GATEWAYS.find(g => g.id === activeGateway)?.name}</h4>
                   <button onClick={() => onFilterSelect({ type: "source", value: activeGateway })} className="px-4 py-2 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">فتح كل الأرواح</button>
                </div>
                <button onClick={() => setActiveGateway(null)} className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
             </div>
             <div className="space-y-4">
                {gatewayLeads.map((l: any) => (
                   <div 
                      key={l.id} 
                      onClick={() => onFilterSelect({ type: "source", value: activeGateway, query: l.email || l.name || l.phone_normalized })}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex justify-between items-center cursor-pointer hover:bg-white/[0.05] transition-all"
                   >
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                            <Activity className="w-4 h-4 text-slate-400" />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-white mb-1">{l.name || "SOUL"}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{l.email || l.phone_normalized}</p>
                         </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${l.phone?.replace(/\D/g, '')}`) }} className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg"><Activity className="w-5 h-5" /></button>
                   </div>
                ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
