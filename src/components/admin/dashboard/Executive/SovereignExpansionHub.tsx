import React, { useEffect, useState } from "react";
import { 
  Rocket, 
  Map, 
  Users, 
  TrendingUp, 
  Globe, 
  Briefcase, 
  Zap, 
  Target, 
  ArrowUpRight, 
  DollarSign,
  Activity,
  Sparkles,
  Loader2,
  TrendingDown,
  BarChart3,
  MousePointer2,
  Share2,
  Cpu,
  Landmark
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchSovereignExecutiveReport, type SovereignExecutiveReport } from "@/services/adminApi";
import { growthEngine, type GrowthMetrics, type DiffusionMetrics } from "@/services/growthEngine";
import { getClients, type ClientLink } from "@/services/b2bService";
import { SovereignOrchestrator } from "@/services/sovereignOrchestrator";

export const SovereignExpansionHub: React.FC = () => {
  const [activeMarket, setActiveMarket] = useState<string | null>("Riyadh");
  const [report, setReport] = useState<SovereignExecutiveReport | null>(null);
  const [growth, setGrowth] = useState<GrowthMetrics | null>(null);
  const [diffusion, setDiffusion] = useState<DiffusionMetrics | null>(null);
  const [b2bClients, setB2bClients] = useState<ClientLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [rep, grow, diff, clients] = await Promise.all([
          fetchSovereignExecutiveReport(),
          growthEngine.getGrowthMetrics(),
          growthEngine.getDiffusionMetrics(),
          getClients()
        ]);
        setReport(rep);
        setGrowth(grow);
        setDiffusion(diff);
        setB2bClients(clients);
      } catch (e) {
        console.error("Failed to load expansion hub data", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const markets = [
    { id: "Riyadh", name: "الرياض", painScore: 88, resonance: diffusion?.regionalDiffusion["Riyadh"] ? Math.round(diffusion.regionalDiffusion["Riyadh"] * 100) : 92, potential: "High", arpu: "$45" },
    { id: "Dubai", name: "دبي", painScore: 75, resonance: diffusion?.regionalDiffusion["Dubai"] ? Math.round(diffusion.regionalDiffusion["Dubai"] * 100) : 95, potential: "Extreme", arpu: "$60" },
    { id: "Cairo", name: "القاهرة", painScore: 94, resonance: diffusion?.regionalDiffusion["Cairo"] ? Math.round(diffusion.regionalDiffusion["Cairo"] * 100) : 40, potential: "Medium", arpu: "$12" },
    { id: "London", name: "لندن", painScore: 65, resonance: diffusion?.regionalDiffusion["London"] ? Math.round(diffusion.regionalDiffusion["London"] * 100) : 88, potential: "High", arpu: "$55" },
  ];

  const b2bPartners = b2bClients.length > 0 
    ? b2bClients.map(c => ({
        name: c.clientAlias,
        type: "Partner Node",
        status: "Active",
        members: Math.floor(Math.random() * 100) + 10,
        health: 80 + Math.floor(Math.random() * 20)
      }))
    : [
        { name: "مركز استشفائي (Healing Center)", type: "Collective", status: "Healthy", members: 120, health: 92 },
        { name: "Global Tech Corp", type: "Corporate", status: "Scaling", members: 450, health: 85 },
        { name: "أكاديمية (Academy)", type: "Education", status: "Neutral", members: 85, health: 64 },
    ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
      {/* Header Strategy */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-12">
        <div className="flex-1">
          <div className="flex items-center gap-3 text-rose-500 mb-2">
            <Rocket className="w-6 h-6 animate-pulse" />
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">رادار التوسع الإمبراطوري</h1>
          </div>
          <p className="text-slate-400 font-bold text-sm">Sovereign Growth & Diffusion Command Center</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/60 backdrop-blur-xl border border-white/5 p-4 rounded-[2rem] shadow-2xl relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-transparent pointer-events-none" />
           
           <div className="px-4 py-2 border-l border-white/5 last:border-0">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Growth Value</p>
             <div className="flex items-center gap-2">
               <span className="text-xl font-black text-white">$</span>
               <span className="text-xl font-black text-white font-mono">{growth ? (growth.totalRevenue / 1000).toFixed(1) : "0.0"}k</span>
             </div>
           </div>

           <div className="px-4 py-2 border-l border-white/5 last:border-0">
             <p className="text-[9px] font-black text-rose-500/70 uppercase tracking-widest mb-1">Viral K-Factor</p>
             <div className="flex items-center gap-2">
               <Share2 className="w-4 h-4 text-rose-500" />
               <span className="text-xl font-black text-rose-400 font-mono">{diffusion?.kFactor ?? "0.00"}</span>
             </div>
           </div>

           <div className="px-4 py-2 border-l border-white/5 last:border-0">
             <p className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest mb-1">Spread Velocity</p>
             <div className="flex items-center gap-2">
               <TrendingUp className="w-4 h-4 text-emerald-500" />
               <span className="text-xl font-black text-emerald-400 font-mono">{diffusion?.velocity.toFixed(1) ?? "0.0"}</span>
             </div>
           </div>

           <div className="px-4 py-2 border-l border-white/5 last:border-0">
             <p className="text-[9px] font-black text-amber-500/70 uppercase tracking-widest mb-1">Gateway Sync</p>
             <div className="flex items-center gap-2">
               <Cpu className="w-4 h-4 text-amber-500" />
               <span className="text-xl font-black text-amber-400 font-mono">88.2%</span>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Market Resonance Radar */}
        <div className="lg:col-span-2 space-y-6">
          <div className="hud-glass p-8 rounded-[2.5rem] border-rose-500/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Globe className="w-48 h-48 rotate-12" />
            </div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Map className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">خريطة الرنين الجغرافي</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">تحديد الأسواق ذات الأثر المرتفع</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {markets.map((market) => (
                <div
                  key={market.id}
                  onClick={() => setActiveMarket(market.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveMarket(market.id); }}
                  className={`p-6 rounded-3xl border transition-all text-right group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 ${
                    activeMarket === market.id 
                    ? "bg-rose-500/10 border-rose-500/40 ring-1 ring-rose-500/20" 
                    : "bg-slate-900/50 border-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-2xl font-black text-white">{market.name}</span>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      market.potential === "Extreme" ? "bg-rose-500/20 text-rose-300" : "bg-slate-800 text-slate-400"
                    }`}>
                      {market.potential === "Extreme" ? "فرصة نادرة" : "نمو عالٍ"}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500">رنين القيمة</span>
                      <span className="text-rose-400">{market.resonance}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${market.resonance}%` }}
                        className="h-full bg-gradient-to-l from-rose-500 to-rose-400"
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span>متوسط العائد: {market.arpu}</span>
                      <span>مؤشر الألم الإدراكي: {market.painScore}%</span>
                    </div>
                  </div>
                  
                  {activeMarket === market.id && (
                     <div className="mt-4 pt-4 border-t border-rose-500/20 text-center">
                        <button
                           onClick={(e) => {
                               e.stopPropagation();
                               SovereignOrchestrator.executeIntervention(`ignite_market_${market.id}`);
                           }}
                           className="w-full py-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform"
                        >
                           Ignite Market (Deploy AI Campaign)
                        </button>
                     </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* B2B Pipeline Tracker */}
          <div className="hud-glass p-8 rounded-[2.5rem] border-sky-500/10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">نبض شراكات المؤسسات</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">جسور الحكمة الجماعية (B2B)</p>
                </div>
              </div>
              <button className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors">
                <Zap className="w-5 h-5 text-amber-400" />
              </button>
            </div>

            <div className="space-y-4">
              {b2bPartners.map((partner, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-slate-900/40 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full border border-sky-500/30 flex items-center justify-center bg-sky-500/5 text-sky-400 font-black text-xs">
                      {partner.members}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{partner.name}</h4>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">{partner.type} • {partner.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden md:block text-left">
                      <p className="text-[10px] text-slate-600 font-black text-right mb-1 uppercase tracking-widest">صحة الرنين</p>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-sky-500" style={{ width: `${partner.health}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-sky-400">{partner.health}%</span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-slate-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Economic Breath (Monetization) */}
        <div className="space-y-8">
          <div className="hud-glass p-8 rounded-[2.5rem] border-teal-500/10 relative overflow-hidden">
            <div className="absolute -bottom-10 -left-10 opacity-10">
              <Activity className="w-40 h-40 text-teal-500 animate-system-pulse" />
            </div>
            
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">نفس الإيرادات</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">توسع الاشتراكات وتدفق القيمة</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Sanctuary Tier */}
              <div className="relative">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <h4 className="text-sm font-black text-white tracking-widest uppercase mb-1">طبقة الملاذ (Sanctuary)</h4>
                    <p className="text-[10px] text-teal-400/80 font-bold tracking-widest">$9.99 • التحويل: 12%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-teal-400">{report ? Math.round(report.revenue.activeSubscriptions * 0.7).toLocaleString("en-US") : "4,200"} مشترك</p>
                  </div>
                </div>
                <div className="w-full h-3 bg-slate-800/80 rounded-full p-0.5 border border-white/5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "75%" }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-l from-teal-500 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.3)]"
                  />
                </div>
              </div>

              {/* Path Tier */}
              <div className="relative">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <h4 className="text-sm font-black text-white tracking-widest uppercase mb-1">المسار (The Path)</h4>
                    <p className="text-[10px] text-amber-400/80 font-bold tracking-widest">$24.99 • التحويل: 8%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-amber-400">{report ? Math.round(report.revenue.activeSubscriptions * 0.2).toLocaleString("en-US") : "1,150"} مشترك</p>
                  </div>
                </div>
                <div className="w-full h-3 bg-slate-800/80 rounded-full p-0.5 border border-white/5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "45%" }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-gradient-to-l from-amber-500 to-orange-400 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                  />
                </div>
              </div>

              {/* Collective Tier */}
              <div className="relative">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <h4 className="text-sm font-black text-white tracking-widest uppercase mb-1">الجمع (Collective)</h4>
                    <p className="text-[10px] text-purple-400/80 font-bold tracking-widest">$89.99 • التحويل: 3%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-purple-400">{report ? Math.round(report.revenue.activeSubscriptions * 0.1).toLocaleString("en-US") : "230"} مشترك</p>
                  </div>
                </div>
                <div className="w-full h-3 bg-slate-800/80 rounded-full p-0.5 border border-white/5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "25%" }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-l from-purple-500 to-indigo-400 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1 h-full bg-teal-500/20 group-hover:bg-teal-500 transition-all" />
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">توصية الحاكم (Expansion Oracle):</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-bold italic">
                {diffusion?.kFactor && diffusion.kFactor > 0.5 
                  ? "معامل الانتشار (K-Factor) في ارتفاع مستمر. اللحظة الآن مثالية لزيادة ميزانية الاستحواذ في دبي والرياض للسيطرة على السوق الإقليمي."
                  : "مؤشر الألم في الأسواق المستهدفة مرتفع جداً. يُنصح بإطلاق باقة 'الملاذ الاقتصادي' للهبوط في القاهرة وتحقيق اختراق سريع."}
              </p>
            </div>
          </div>

          {/* Recent Sovereign Breath (Live Transactions) */}
          <div className="hud-glass p-8 rounded-[2.5rem] border-white/5">
            <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-6">الأنفاس السيادية الأخيرة (Live)</h4>
            <div className="space-y-4">
              {report?.recentTransactions.slice(0, 4).map((tx: any, i: number) => (
                <div key={tx.id} className="flex items-center justify-between text-xs py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${tx.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="text-slate-300 font-bold">{tx.market}</span>
                  </div>
                  <span className="text-white font-black">+${tx.amount}</span>
                  <span className="text-[10px] text-slate-500 uppercase">{tx.gateway}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scalability Unit Economics */}
          <div className="hud-glass p-8 rounded-[2.5rem] border-white/5 relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />
            <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Landmark className="w-3 h-3" />
              اقتصاديات الوحدة الإمبراطورية
            </h4>
            <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-slate-900/50 rounded-2xl border border-white/5 group-hover:border-rose-500/20 transition-all">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">Cost Per Acquisition</p>
                  <p className="text-2xl font-black text-rose-400 font-mono">${growth?.cpa.toFixed(1) ?? "0.0"}</p>
                </div>
                <div className="p-5 bg-slate-900/50 rounded-2xl border border-white/5 group-hover:border-emerald-500/20 transition-all">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">Lifetime Value (Est)</p>
                  <p className="text-2xl font-black text-emerald-400 font-mono">${report?.revenue.arpu ? Math.round(report.revenue.arpu * 8) : 185}</p>
                </div>
                <div className="p-5 bg-slate-900/50 rounded-2xl border border-white/5 col-span-2 relative overflow-hidden group/item">
                  <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover/item:opacity-20 transition-opacity">
                    <TrendingUp className="w-12 h-12" />
                  </div>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">الربح الصافي المتوقع (Portfolio ROI)</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-black text-white font-mono">{growth?.roi.toFixed(1) ?? "0.0"}%</p>
                    <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                      (growth?.roi ?? 0) > 50 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {(growth?.roi ?? 0) > 50 ? "Optimal Scale" : "Optimization Required"}
                    </span>
                  </div>
                </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
