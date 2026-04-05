import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GitMerge, 
  Share2, 
  Zap, 
  Layers, 
  TrendingUp, 
  Sparkles, 
  Network, 
  MapPin, 
  Cpu, 
  Activity,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react";
import { AdminTooltip } from "../Overview/components/AdminTooltip";
import { growthEngine, type DiffusionMetrics } from "../../../../services/growthEngine";
import { supabase, isSupabaseReady } from "../../../../services/supabaseClient";
import debounce from "lodash/debounce";

export const SovereignSpreadCommand: FC = () => {
  const [metrics, setMetrics] = useState<DiffusionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [catalystIntensity, setCatalystIntensity] = useState(0.6); // [0.4 - 1.0]
  const [inviteScarcity, setInviteScarcity] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      const data = await growthEngine.getDiffusionMetrics();
      setMetrics(data);
      setIsLoading(false);

      if (isSupabaseReady && supabase) {
        const { data: settings } = await supabase
          .from("system_settings")
          .select("key, value")
          .in("key", ["catalyst_intensity", "invite_scarcity"]);
        
        settings?.forEach(s => {
          if (s.key === "catalyst_intensity") setCatalystIntensity(Number(s.value));
          if (s.key === "invite_scarcity") setInviteScarcity(Boolean(s.value));
        });
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const saveSetting = async (key: string, value: any) => {
    if (!isSupabaseReady || !supabase) return;
    await supabase.from("system_settings").upsert({ key, value }, { onConflict: "key" });
  };

  const kFactor = metrics?.kFactor ?? 0.42;
  const velocity = metrics?.velocity ?? 18;

  const getKFactorColor = (val: number) => {
    if (val >= 1.0) return "text-amber-400"; // Viral growth!
    if (val >= 0.5) return "text-emerald-400";
    return "text-indigo-400";
  };

  return (
    <div className="space-y-6">
      {/* Spread Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <Network className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">مركز إدارة الانتشار</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Sovereign Diffusion Command (SDC)</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
          <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">تحليل الاتجاه اللحظي</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Viral Gauge Card */}
        <div className="lg:col-span-1 hud-glass p-6 rounded-3xl border-indigo-500/10 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="hud-edge-accent top-2 right-2" />
          <div className="hud-edge-accent bottom-2 left-2" />
          
          <div className="relative mb-6">
            <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-500/30"
            />
            <div className="w-32 h-32 rounded-full border-4 border-white/5 flex flex-col items-center justify-center relative bg-black/40 shadow-2xl">
               <span className={`text-4xl font-black ${getKFactorColor(kFactor)}`}>
                  {kFactor}
               </span>
               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">K-Factor</span>
               
               {/* Internal Glow Pulse */}
               <motion.div 
                 animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className={`absolute inset-0 rounded-full blur-xl -z-10 ${kFactor >= 0.5 ? "bg-emerald-500" : "bg-indigo-500"}`}
               />
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-sm font-black text-white mb-1 uppercase tracking-tight">معامل الانتشار الفيروسي</h3>
            <p className="text-xs text-slate-400">
              {kFactor >= 1.0 ? "نمو فيروسي متفجر (Viral Expansion)" : "نمو عضوي مستقر (Organic Growth)"}
            </p>
          </div>

          <div className="mt-6 w-full pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
            <div className="text-center">
               <p className="text-[9px] font-black text-slate-500 uppercase mb-1">الشرر القادم (Velocity)</p>
               <p className="text-lg font-black text-white">+{velocity}</p>
            </div>
            <div className="text-center border-r border-white/5">
               <p className="text-[9px] font-black text-slate-500 uppercase mb-1">الرنين الجغرافي</p>
               <p className="text-lg font-black text-amber-400">8.4</p>
            </div>
          </div>
        </div>

        {/* Catalyst Controls Card */}
        <div className="lg:col-span-2 hud-glass p-6 rounded-3xl border-amber-500/10 flex flex-col relative overflow-hidden bg-amber-500/[0.02]">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                 <Zap className="w-4 h-4 text-amber-400" />
                 <h3 className="text-sm font-black text-white uppercase tracking-tight">محفزات الانتشار (Viral Catalysts)</h3>
              </div>
              <AdminTooltip content="تحكم في مدي إلحاح وقوة النداءات التي تظهر للمستخدمين لمشاركة تجربتهم." position="bottom" />
           </div>

           <div className="space-y-8 flex-1">
              {/* Loop Intensity Slider */}
              <div className="space-y-3">
                 <div className="flex justify-between items-end">
                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest">كثافة المحفزات (Loop Intensity)</p>
                    <span className="text-xs font-mono text-amber-400">{(catalystIntensity * 100).toFixed(0)}%</span>
                 </div>
                 <input 
                    type="range" min="0.4" max="1.0" step="0.05"
                    value={catalystIntensity}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setCatalystIntensity(val);
                      saveSetting("catalyst_intensity", val);
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                 />
                 <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                    <span>صمت (Silent)</span>
                    <span>نداء صاخب (Amplified)</span>
                 </div>
              </div>

              {/* Scarcity Toggle */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group cursor-pointer hover:bg-white/[0.08] transition-all"
                   onClick={() => {
                     const next = !inviteScarcity;
                     setInviteScarcity(next);
                     saveSetting("invite_scarcity", next);
                   }}>
                 <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${inviteScarcity ? "bg-rose-500/20 border-rose-500/30 text-rose-400" : "bg-slate-500/10 border-slate-500/20 text-slate-400"}`}>
                       <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="text-xs font-black text-white">نظام الندرة (Invite Scarcity)</p>
                       <p className="text-[10px] text-slate-500">خلق حالة من الـ FOMO لزيادة رغبة الانضمام</p>
                    </div>
                 </div>
                 <div className={`w-12 h-6 rounded-full p-1 transition-all ${inviteScarcity ? "bg-rose-500" : "bg-slate-700"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-all ${inviteScarcity ? "translate-x-6" : "translate-x-0"}`} />
                 </div>
              </div>

              {/* Regional Pulse (Small bars) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                 {metrics && Object.entries(metrics.regionalDiffusion).map(([city, val]) => (
                   <div key={city} className="space-y-1">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                         <span>{city}</span>
                         <span>{Math.round(val * 100)}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                         <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${val * 100}%` }}
                            className="h-full bg-indigo-500/50"
                         />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Top Spreaders Chronicle */}
      <div className="hud-glass p-6 rounded-3xl border-white/5 relative overflow-hidden bg-indigo-500/[0.01]">
         <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
               <TrendingUp className="w-4 h-4 text-emerald-400" />
               <h3 className="text-sm font-black text-white uppercase tracking-tight">ناشرو النور (Top Spreaders)</h3>
            </div>
            <button className="text-[10px] font-black text-indigo-400 border border-indigo-400/20 px-3 py-1 rounded-lg hover:bg-indigo-400/10 transition-all">تصدير السجل</button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics?.topSpreaders.map((spreader, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/20 hover:bg-white/[0.05] transition-all group flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-xs font-black text-indigo-300">
                       {idx + 1}
                    </div>
                    <div>
                       <p className="text-xs font-black text-white">{spreader.name}</p>
                       <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">{spreader.count} نداء مكتمل</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <div className="text-[9px] font-black text-emerald-400 uppercase">resonance</div>
                    <div className="text-sm font-black text-white">{Math.round(spreader.resonance * 100)}%</div>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};
