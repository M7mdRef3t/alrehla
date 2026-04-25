import React, { FC, useEffect, useState } from "react";
import { Activity, BarChart, SplitSquareHorizontal, ArrowUpRight, Target, Zap } from "lucide-react";
import { supabase } from "@/services/supabaseClient";

interface VariantStats {
  views: number;
  clicks: number;
  ctr: number;
}

export const CommandABTestRadar: FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ A: VariantStats; B: VariantStats } | null>(null);

  const fetchABTestStats = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: viewsData, error: viewErr } = await supabase
        .from("analytics_events")
        .select("properties")
        .eq("event_name", "conversion_offer_view");

      const { data: clicksData, error: clickErr } = await supabase
        .from("analytics_events")
        .select("properties")
        .eq("event_name", "conversion_offer_clicked");

      if (viewErr || clickErr) throw new Error("Failed to fetch analytics");

      const rawStats = {
        A: { views: 0, clicks: 0, ctr: 0 },
        B: { views: 0, clicks: 0, ctr: 0 },
      };

      viewsData?.forEach((event: any) => {
        const variant = event.properties?.variant;
        if (variant === "A" || variant === "B") {
          rawStats[variant as 'A' | 'B'].views++;
        }
      });

      clicksData?.forEach((event: any) => {
        const variant = event.properties?.button_variant;
        if (variant === "A" || variant === "B") {
          rawStats[variant as 'A' | 'B'].clicks++;
        }
      });

      rawStats.A.ctr = rawStats.A.views > 0 ? (rawStats.A.clicks / rawStats.A.views) * 100 : 0;
      rawStats.B.ctr = rawStats.B.views > 0 ? (rawStats.B.clicks / rawStats.B.views) * 100 : 0;

      setStats(rawStats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchABTestStats();
    const interval = setInterval(fetchABTestStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0B0F19]/60 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      
      <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 rounded-2xl">
               <SplitSquareHorizontal className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight">رادار التجارب الحيوية (A/B Tests)</h2>
              <p className="text-indigo-400/60 text-[10px] font-black uppercase tracking-widest">Sovereign Conversion Lab</p>
            </div>
         </div>
         <button 
           onClick={fetchABTestStats}
           className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 hover:text-white hover:bg-indigo-500/20 transition-all uppercase tracking-widest flex items-center gap-2"
         >
           <Zap className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
           Refresh Signals
         </button>
      </div>

      <div className="space-y-6">
         <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2 px-2 border-b border-white/5 pb-2">
            <span>النسخة (Variant)</span>
            <span className="flex-1 text-center">المشاهدات (Views)</span>
            <span className="flex-1 text-center">النقرات (Clicks)</span>
            <span className="text-right w-24">معدل التحويل (CTR)</span>
         </div>

         {/* Variant A */}
         <div className="flex items-center justify-between bg-slate-900/50 border border-slate-700 p-4 rounded-2xl relative overflow-hidden">
            <div className="w-1/4 flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <span className="text-amber-500 font-black">A</span>
               </div>
               <div>
                  <h4 className="text-sm font-bold text-slate-200">الأساسي</h4>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest">Control</p>
               </div>
            </div>
            
            <div className="flex-1 text-center font-mono text-xl font-black text-white">
               {stats?.A.views ?? 0}
            </div>
            <div className="flex-1 text-center font-mono text-xl font-black text-white flex items-center justify-center gap-2">
               {stats?.A.clicks ?? 0}
               <Target className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="w-24 text-right">
               <span className={`text-xl font-black ${stats && stats.A.ctr > (stats.B.ctr || 0) ? 'text-emerald-400' : 'text-slate-400'}`}>
                 {stats?.A.ctr.toFixed(1)}%
               </span>
            </div>
         </div>

         {/* Variant B */}
         <div className="flex items-center justify-between bg-slate-900/50 border border-slate-700 p-4 rounded-2xl relative overflow-hidden">
             {stats && stats.B.ctr > stats.A.ctr && (
                 <div className="absolute top-0 right-0 h-full w-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
             )}
            <div className="w-1/4 flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <span className="text-indigo-400 font-black">B</span>
               </div>
               <div>
                  <h4 className="text-sm font-bold text-slate-200">الجديد (Challenger)</h4>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest">Variant</p>
               </div>
            </div>
            
            <div className="flex-1 text-center font-mono text-xl font-black text-white">
               {stats?.B.views ?? 0}
            </div>
            <div className="flex-1 text-center font-mono text-xl font-black text-white flex items-center justify-center gap-2">
               {stats?.B.clicks ?? 0}
               <Target className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="w-24 text-right">
               <span className={`text-xl font-black ${stats && stats.B.ctr > stats.A.ctr ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'text-slate-400'}`}>
                 {stats?.B.ctr.toFixed(1)}%
               </span>
            </div>
         </div>

         {/* Insights */}
         {stats && stats.A.views > 0 && stats.B.views > 0 && (
             <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-transparent border-l-2 border-emerald-500">
               <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                 <Activity className="w-3 h-3" /> Autonomous Insight
               </h5>
               <p className="text-sm text-slate-300 font-bold leading-relaxed">
                 النسخة <strong className={stats.B.ctr > stats.A.ctr ? 'text-indigo-400' : 'text-amber-500'}>
                   {stats.B.ctr > stats.A.ctr ? "B" : "A"}
                 </strong> تتفوق حالياً بنسبة أداء أعلى. 
                 {stats.B.ctr > stats.A.ctr 
                   ? " الزر الأزرق الجديد بيكسر حاجز التردد ويحقق نقرات أعلى بشكل ملحوظ." 
                   : " النسخة الأساسية لازالت تتصدر."}
               </p>
             </div>
         )}
      </div>
    </div>
  );
};
