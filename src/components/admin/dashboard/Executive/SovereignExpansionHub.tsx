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
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { fetchSovereignExecutiveReport, type SovereignExecutiveReport } from "../../../../services/adminApi";

export const SovereignExpansionHub: React.FC = () => {
  const [activeMarket, setActiveMarket] = useState<string | null>("Riyadh");
  const [report, setReport] = useState<SovereignExecutiveReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSovereignExecutiveReport().then(data => {
      setReport(data);
      setLoading(false);
    });
  }, []);

  const markets = [
    { id: "Riyadh", name: "الرياض", painScore: 88, resonance: report?.revenue.regionalResonance["Riyadh"] ? Math.round(report.revenue.regionalResonance["Riyadh"] * 100) : 92, potential: "High", arpu: "$45" },
    { id: "Dubai", name: "دبي", painScore: 75, resonance: report?.revenue.regionalResonance["Dubai"] ? Math.round(report.revenue.regionalResonance["Dubai"] * 100) : 95, potential: "Extreme", arpu: "$60" },
    { id: "Cairo", name: "القاهرة", painScore: 94, resonance: report?.revenue.regionalResonance["Cairo"] ? Math.round(report.revenue.regionalResonance["Cairo"] * 100) : 40, potential: "Medium", arpu: "$12" },
    { id: "London", name: "لندن", painScore: 65, resonance: report?.revenue.regionalResonance["London"] ? Math.round(report.revenue.regionalResonance["London"] * 100) : 88, potential: "High", arpu: "$55" },
  ];

  const b2bPartners = [
    { name: "مركز استشفائي (Healing Center)", type: "Collective", status: "Healthy", members: 120, health: 92 },
    { name: "Global Tech Corp", type: "Corporate", status: "Scaling", members: 450, health: 85 },
    { name: "أكاديمية (Academy)", type: "Education", status: "Neutral", members: 85, health: 64 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700" dir="rtl">
      {/* Header Strategy */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">رادار التوسع التجاري</h1>
          <p className="text-slate-400 font-bold">قيادة التوسع العالمي من خلال رنين القيمة</p>
        </div>
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <p className="text-[10px] text-rose-300 font-black uppercase tracking-widest leading-none">جاهزية التوسع</p>
            <p className="text-xl font-black text-white">88%</p>
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
                <button
                  key={market.id}
                  onClick={() => setActiveMarket(market.id)}
                  className={`p-6 rounded-3xl border transition-all text-right group ${
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
                </button>
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
                    <p className="text-xs font-black text-teal-400">{report ? Math.round(report.revenue.activeSubscriptions * 0.7).toLocaleString() : "4,200"} مشترك</p>
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
                    <p className="text-xs font-black text-amber-400">{report ? Math.round(report.revenue.activeSubscriptions * 0.2).toLocaleString() : "1,150"} مشترك</p>
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
                    <p className="text-xs font-black text-purple-400">{report ? Math.round(report.revenue.activeSubscriptions * 0.1).toLocaleString() : "230"} مشترك</p>
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

            <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-slate-300">توصية القيمة القادمة:</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-bold">
                * مؤشر الألم في "القاهرة" مرتفع جداً (94%). يُنصح بإطلاق باقة "الملاذ الاقتصادي" بدعم محلي لتوسيع القاعدة الجماهيرية بسرعة قبل المنافسين.
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
          <div className="hud-glass p-8 rounded-[2.5rem] border-white/5">
            <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-6">اقتصاديات الوحدة الإمبراطورية</h4>
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-slate-500 font-bold mb-1">تكلفة الاستحواذ (CAC)</p>
                  <p className="text-xl font-black text-rose-400">$4.2</p>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-slate-500 font-bold mb-1">القيمة الحيوية (LTV)</p>
                  <p className="text-xl font-black text-emerald-400">${report?.revenue.arpu ? Math.round(report.revenue.arpu * 8) : 185}</p>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 col-span-2">
                  <p className="text-[10px] text-slate-500 font-bold mb-2">نسبة الصبر (Payback Period)</p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-black text-white">45 يوم</p>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-black">ممتاز</span>
                  </div>
                </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
