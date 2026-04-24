import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GitMerge, 
  Share2, 
  Zap, 
  Layers, 
  TrendingUp, 
  Zap as Sparkles, 
  Network, 
  MapPin, 
  Cpu, 
  Activity,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react";
import { AdminTooltip } from "../Overview/components/AdminTooltip";
import { growthEngine, type DiffusionMetrics } from "@/services/growthEngine";
import { supabase, isSupabaseReady } from "@/services/supabaseClient";
import debounce from "lodash/debounce";

interface SovereignSpreadCommandProps {
  minimal?: boolean;
}

export const SovereignSpreadCommand: FC<SovereignSpreadCommandProps> = ({ minimal }) => {
  const [metrics, setMetrics] = useState<DiffusionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [catalystIntensity, setCatalystIntensity] = useState(0.6);
  const [inviteScarcity, setInviteScarcity] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
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
            if (s.key === "invite_scarcity") setInviteScarcity(s.value === "true" || s.value === true);
          });
        }
      } catch (err) {
        // HMR or Network error
        console.warn("[SovereignSpreadCommand] fetchMetrics error", err);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 300000); // 5 minutes instead of 30s
    return () => clearInterval(interval);
  }, []);

  const saveSetting = async (key: string, value: any) => {
    if (!isSupabaseReady || !supabase) return;
    setIsSaving(true);
    await supabase.from("system_settings").upsert({ key, value: String(value) }, { onConflict: "key" });
    setTimeout(() => setIsSaving(false), 800);
  };

  const kFactor = metrics?.kFactor ?? 0.42;
  const velocity = metrics?.velocity ?? 18;

  return (
    <div className="space-y-6">
      {/* Spread Header */}
      {!minimal && (
        <div className="flex flex-col md:flex-row items-center justify-between flex-row-reverse gap-4 text-right">
          <div className="flex items-center gap-4 flex-row-reverse">
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 border border-dashed border-indigo-500/20 rounded-full"
              />
              <div className="p-4 bg-[#0B0F19]/80 rounded-2xl border border-white/10 shadow-2xl relative z-10">
                <Network className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Spread Command</h2>
              <div className="flex items-center gap-2 flex-row-reverse">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] text-right">Quantum Diffusion Active</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 flex-row-reverse">
             <AnimatePresence mode="wait">
               {isSaving && (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-3 py-1 text-[9px] font-black text-amber-400 uppercase tracking-widest"
                  >
                    Syncing...
                  </motion.div>
               )}
             </AnimatePresence>
             <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center gap-2 flex-row-reverse">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Real-time Pulse</span>
             </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Viral Gauge Card */}
        <div className="xl:col-span-4 hud-glass p-8 rounded-[2.5rem] border-indigo-500/10 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-indigo-500/[0.05] to-transparent group">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
            <Share2 className="w-32 h-32" />
          </div>
          
          <div className="relative mb-8">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
              <motion.circle 
                cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                strokeDasharray={552}
                initial={{ strokeDashoffset: 552 }}
                animate={{ strokeDashoffset: 552 - (Math.min(kFactor, 1.5) / 1.5) * 552 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className={`${kFactor >= 1.0 ? "text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)]" : "text-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"}`} 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <motion.span 
                 key={kFactor}
                 initial={{ scale: 0.8, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className={`text-6xl font-black italic ${kFactor >= 1.0 ? "text-amber-400" : "text-white"}`}
               >
                  {kFactor}
               </motion.span>
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">K-Factor Index</span>
            </div>
            
            {/* Background Glow */}
            <motion.div 
               animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
               transition={{ duration: 3, repeat: Infinity }}
               className={`absolute inset-4 rounded-full blur-[60px] -z-10 ${kFactor >= 1.0 ? "bg-amber-500" : "bg-indigo-500"}`}
            />
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">حالة الانتشار الفيروسي</h3>
            <p className="text-xs font-bold text-slate-500 max-w-[200px] mx-auto leading-relaxed">
              {kFactor >= 1.0 ? "النقطة الحرجة: النمو الفيروسي متفجر الآن!" : "النمو العضوي مستقر. يتطلب الأمر نداءً تكتيكياً للحفز."}
            </p>
          </div>

          <div className="mt-8 w-full pt-8 border-t border-white/5 flex items-center justify-around gap-4">
             <div className="text-center">
                <div className="flex items-center gap-1 justify-center text-emerald-400 mb-1">
                   <TrendingUp className="w-3 h-3" />
                   <span className="text-[10px] font-black uppercase">Velocity</span>
                </div>
                <p className="text-2xl font-black text-white font-mono">+{velocity}</p>
             </div>
             <div className="w-px h-10 bg-white/5" />
             <div className="text-center">
                <div className="flex items-center gap-1 justify-center text-indigo-400 mb-1">
                   <Cpu className="w-3 h-3" />
                   <span className="text-[10px] font-black uppercase">Channels</span>
                </div>
                <p className="text-2xl font-black text-white font-mono">4</p>
             </div>
          </div>
        </div>

        {/* Catalyst Controls Card */}
        <div className="xl:col-span-8 space-y-6">
           <div className="hud-glass p-8 rounded-[2.5rem] border-amber-500/10 bg-amber-500/[0.01] relative overflow-hidden">
              <div className="flex items-center justify-between mb-8 flex-row-reverse text-right">
                 <div className="flex items-center gap-4 flex-row-reverse">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                       <Zap className="w-6 h-6 text-amber-400 animate-pulse" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Viral Catalyst Engine</h3>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">معايرة محفزات الانتشار اللحظية</p>
                    </div>
                 </div>
                 <AdminTooltip content="تحكم في مدي إلحاح وقوة النداءات التي تظهر للمستخدمين لمشاركة تجربتهم." position="bottom" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 {/* Intensity Control */}
                 <div className="space-y-6">
                    <div className="flex justify-between items-end">
                       <div>
                          <p className="text-xs font-black text-slate-300 uppercase tracking-widest mb-1">كثافة المحفزات (Intensity)</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">قوة النداء لمشاركة الأرواح</p>
                       </div>
                       <span className="text-2xl font-black text-amber-400 font-mono">{(catalystIntensity * 100).toFixed(0)}%</span>
                    </div>
                    <div className="relative group p-2">
                       <input 
                          type="range" min="0.4" max="1.0" step="0.05"
                          value={catalystIntensity}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setCatalystIntensity(val);
                            saveSetting("catalyst_intensity", val);
                          }}
                          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                       />
                       <div className="absolute -inset-1 border border-white/5 rounded-2xl pointer-events-none group-hover:border-amber-500/20 transition-all" />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-600 font-black uppercase tracking-widest">
                       <span>صمت إدراكي (Silent)</span>
                       <span>نداء مباشر (Amplified)</span>
                    </div>
                 </div>

                 {/* Scarcity Toggle Grid */}
                 <div className="space-y-4">
                    <button 
                      onClick={() => {
                        const next = !inviteScarcity;
                        setInviteScarcity(next);
                        saveSetting("invite_scarcity", next);
                      }}
                      className={`w-full p-6 rounded-3xl border transition-all flex items-center justify-between flex-row-reverse group text-right ${
                        inviteScarcity 
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-400" 
                        : "bg-white/2 border-white/5 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-row-reverse">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                           inviteScarcity ? "bg-rose-500/20 border-rose-500/30" : "bg-black/20 border-white/10"
                         }`}>
                            <ShieldCheck className="w-5 h-5" />
                         </div>
                         <div className="text-right">
                            <p className={`text-sm font-black italic tracking-tighter uppercase ${inviteScarcity ? "text-rose-300" : "text-white"}`}>
                                Invite Scarcity Mode
                            </p>
                            <p className="text-[10px] font-bold opacity-60">نظام الندرة و الـ FOMO</p>
                         </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${inviteScarcity ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" : "bg-slate-700"}`} />
                    </button>

                    <div className="p-4 bg-white/5 rounded-2xl border border-dashed border-white/10">
                       <p className="text-[10px] text-slate-500 leading-relaxed font-bold italic text-right">
                          "نظام الندرة بيقفل العضويات الجديدة إلا بدعوة من شخص موجود.. وده بيزود رغبة الناس إنهم يدخلوا 'الملاذ' ويحسوا بتميزهم."
                       </p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Regional Grid */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metrics && Object.entries(metrics.regionalDiffusion).map(([city, val]) => (
                <div key={city} className="hud-glass p-5 rounded-3xl border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all">
                   <div className="flex justify-between items-center mb-3">
                      <span className="text-[11px] font-black text-white italic uppercase tracking-tighter">{city}</span>
                      <span className="text-[10px] font-black text-indigo-400 font-mono italic">{Math.round(val * 100)}%</span>
                   </div>
                   <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                      <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${val * 100}%` }}
                         className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                      />
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Top Spreaders Chronicle */}
      <div className="hud-glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden bg-indigo-500/[0.01] group">
         <div className="absolute -bottom-20 -right-20 p-20 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <TrendingUp className="w-64 h-64" />
         </div>
         
         <div className="flex items-center justify-between mb-8 relative z-10 flex-row-reverse text-right">
            <div className="flex items-center gap-4 flex-row-reverse">
               <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-emerald-400" />
               </div>
               <div>
                  <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">ناشرو النور (Top Spreaders)</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">الأرواح الأكثر تأثيراً في انتشار الملاذ</p>
               </div>
            </div>
            <button className="text-[10px] font-black text-white/50 border border-white/10 px-6 py-3 rounded-xl hover:bg-white/5 transition-all">تصدير تقرير الإمبراطورية</button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
            {metrics?.topSpreaders.map((spreader, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ scale: 1.02 }}
                className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/20 hover:bg-white/[0.05] transition-all flex items-center justify-between flex-row-reverse text-right"
              >
                 <div className="flex items-center gap-4 flex-row-reverse">
                    <div className="relative">
                       <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-black text-white shadow-lg">
                          {idx + 1}
                       </div>
                       <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#12141c]" />
                    </div>
                    <div>
                       <p className="text-sm font-black text-white italic tracking-tighter uppercase">{spreader.name}</p>
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{spreader.count} نداء ناجح</p>
                    </div>
                 </div>
                 <div className="text-left">
                    <p className="text-[9px] font-black text-emerald-400 italic uppercase mb-1">Resonance Score</p>
                    <p className="text-xl font-black text-white font-mono">{Math.round(spreader.resonance * 100)}%</p>
                 </div>
              </motion.div>
            ))}
         </div>
      </div>
    </div>
  );
};
