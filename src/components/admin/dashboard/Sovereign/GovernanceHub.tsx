import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminTooltip } from "../Overview/components/AdminTooltip";
import {
  Gavel,
  ShieldCheck,
  Brain,
  Zap,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  Cpu,
  Lock,
  Eye,
  BarChart3
} from "lucide-react";
import { decisionEngine } from "@/ai/decision-framework";
import type { AIDecision, DecisionType } from "@/ai/decision-framework";

/**
 * GovernanceHub — "مركز إدارة العقل السيادي"
 * ==========================================
 * واجهة متقدمة للتحكم في استقلالية الذكاء الاصطناعي ومراقبة جودة قراراته.
 */
export const GovernanceHub: FC = () => {
  const [decisions, setDecisions] = useState<AIDecision[]>([]);
  const [selectedDecision, setSelectedDecision] = useState<AIDecision | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "pending_approval" | "executed" | "rejected">("all");
  const [governanceStats, setGovernanceStats] = useState({
    autonomyScore: 0,
    approvalRate: 0,
    totalInterventions: 0,
    confidencePulse: 0
  });

  const [aiAutonomyEnabled, setAiAutonomyEnabled] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    const recent = decisionEngine.getRecentDecisions(100);
    setDecisions(recent);

    // Calculate Stats
    const total = recent.length || 1;
    const autonomous = recent.filter(d => d.approvedBy === "system" || !d.approvedBy).length;
    const pending = recent.filter(d => d.outcome === "pending_approval").length;
    const rejected = recent.filter(d => d.outcome === "rejected").length;
    const executed = recent.filter(d => d.outcome === "executed").length;

    setGovernanceStats({
      autonomyScore: Math.round((autonomous / total) * 100),
      approvalRate: Math.round((executed / (executed + rejected || 1)) * 100),
      totalInterventions: total,
      confidencePulse: 85 + Math.floor(Math.random() * 10) // Mocking confidence for UI pulse
    });
  };

  const filteredDecisions = decisions.filter(d => {
    if (activeFilter === "all") return true;
    return d.outcome === activeFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* ── Governance Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-[#0B0F19] border border-white/5 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center shadow-[0_0_40px_rgba(20,184,166,0.2)] border border-white/10 ring-4 ring-white/5">
            <Gavel className="w-10 h-10 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
               <h1 className="text-3xl font-black text-white tracking-widest uppercase">سجل الحوكمة</h1>
               <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/30 rounded-full text-[10px] font-black text-teal-400 uppercase tracking-widest">Sovereign Alpha</span>
            </div>
            <p className="text-slate-400 font-medium tracking-wide">
               مراقبة العقل الاصطناعي والمصادقة على التحركات الاستراتيجية
            </p>
          </div>
        </div>

        <div className="flex gap-3 relative z-10">
           <button 
             onClick={loadData}
             className="organic-tap p-4 rounded-2xl bg-slate-900 border border-slate-800 text-teal-400 hover:text-white hover:bg-teal-500/20 transition-all shadow-lg"
           >
             <Zap className="w-5 h-5" />
           </button>
           <button className="organic-tap px-6 py-4 rounded-2xl bg-teal-500 text-white font-black uppercase tracking-wider shadow-[0_0_30px_rgba(20,184,166,0.4)] border border-teal-400/50">
             تحميل تقرير كامل
           </button>
        </div>
      </div>

      {/* ── Metrics Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard 
          label="استقلالية الـ AI" 
          value={`${governanceStats.autonomyScore}%`} 
          desc="نسبة القرارات المؤتمتة" 
          icon={<Cpu className="w-5 h-5 text-teal-400" />}
          trend="+5%"
          color="teal"
        />
        <MetricCard 
          label="دقة التصديق" 
          value={`${governanceStats.approvalRate}%`} 
          desc="توافق قراراتك مع الـ AI" 
          icon={<ShieldCheck className="w-5 h-5 text-indigo-400" />}
          trend="-2%"
          color="indigo"
        />
        <MetricCard 
          label="نبض التوقع" 
          value={`${governanceStats.confidencePulse}%`} 
          desc="مستوى اليقين اللحظي" 
          icon={<Brain className="w-5 h-5 text-purple-400" />}
          pulse
          color="purple"
        />
        <MetricCard 
          label="إجمالي التدخلات" 
          value={governanceStats.totalInterventions} 
          desc="مجموع التحركات المرصودة" 
          icon={<Activity className="w-5 h-5 text-amber-400" />}
          color="amber"
        />
      </div>

      {/* ── Main Content Area ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar Filters */}
        <div className="lg:col-span-3 space-y-4">
           <div className="p-6 rounded-3xl bg-[#0B0F19] border border-white/5 space-y-6 shadow-xl">
             <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-2 mb-4">تصفية السجلات</h3>
             <div className="space-y-2">
                <FilterButton 
                  active={activeFilter === "all"} 
                  onClick={() => setActiveFilter("all")}
                  label="جميع المحاضر" 
                  count={decisions.length}
                  icon={<BarChart3 className="w-4 h-4" />}
                />
                <FilterButton 
                  active={activeFilter === "pending_approval"} 
                  onClick={() => setActiveFilter("pending_approval")}
                  label="ينتظر التصديق" 
                  count={decisions.filter(d => d.outcome === "pending_approval").length}
                  icon={<Clock className="w-4 h-4 text-amber-400" />}
                  highlight="amber"
                />
                <FilterButton 
                  active={activeFilter === "executed"} 
                  onClick={() => setActiveFilter("executed")}
                  label="أحكام نافذة" 
                  count={decisions.filter(d => d.outcome === "executed").length}
                  icon={<CheckCircle className="w-4 h-4 text-teal-400" />}
                />
                <FilterButton 
                  active={activeFilter === "rejected"} 
                  onClick={() => setActiveFilter("rejected")}
                  label="قرارات منقوضة" 
                  count={decisions.filter(d => d.outcome === "rejected").length}
                  icon={<XCircle className="w-4 h-4 text-rose-400" />}
                />
             </div>
           </div>

           <div className={`p-8 rounded-3xl ${aiAutonomyEnabled ? 'bg-gradient-to-br from-teal-900/40 to-slate-900 border-teal-500/20' : 'bg-gradient-to-br from-indigo-900/40 to-slate-900 border-indigo-500/20'} shadow-inner relative overflow-hidden group transition-colors duration-500`}>
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                 {aiAutonomyEnabled ? <Zap className="w-16 h-16 text-teal-400" /> : <Lock className="w-16 h-16 text-indigo-400" />}
              </div>
              <h4 className="text-lg font-black text-white mb-2 relative z-10">{aiAutonomyEnabled ? "استقلالية كاملة للـ AI" : "وضع الحكم الآمن"}</h4>
              <p className={`text-xs ${aiAutonomyEnabled ? 'text-teal-300' : 'text-indigo-300'} font-bold tracking-wide leading-relaxed relative z-10 mb-6`}>
                {aiAutonomyEnabled 
                  ? "السحابة الذكية تدير القرارات الاستراتيجية وتقوم بتنفيذ التكتيكات آلياً دون انتظار."
                  : "النظام الآن يعمل تحت السيادة البشرية. القرارات المالية والاستراتيجية تتطلب موافقتك."}
              </p>
              
              <button
                onClick={() => setAiAutonomyEnabled(!aiAutonomyEnabled)}
                className={`relative z-10 w-full py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
                  aiAutonomyEnabled 
                  ? "bg-slate-900 text-teal-400 hover:bg-slate-800" 
                  : "bg-indigo-500 text-white hover:bg-indigo-400"
                }`}
              >
                {aiAutonomyEnabled ? "تعليق الاستقلالية" : "تمكين السيادة المطلقة"}
              </button>
           </div>
        </div>

        {/* Decisions Feed */}
        <div className="lg:col-span-9 space-y-4">
           {filteredDecisions.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-32 rounded-[2.5rem] bg-slate-900/20 border border-dashed border-slate-800">
               <Eye className="w-12 h-12 text-slate-700 mb-4 animate-pulse" />
               <p className="text-slate-500 font-bold uppercase tracking-widest">لا توجد سجلات تطابق البحث</p>
             </div>
           ) : (
             <div className="space-y-4">
               {filteredDecisions.map((decision, idx) => (
                 <DecisionRow 
                   key={decision.id || idx}
                   decision={decision}
                   isExpanded={selectedDecision?.id === decision.id}
                   onToggle={() => setSelectedDecision(selectedDecision?.id === decision.id ? null : decision)}
                   onResolve={(approved) => {
                     if (decision.id) {
                       decisionEngine.resolveApproval(decision.id, approved);
                       loadData();
                     }
                   }}
                 />
               ))}
             </div>
           )}
        </div>
      </div>

       {/* ── Strategic Forecast: Future Pulse ── */}
       <div className="bg-gradient-to-r from-slate-900 via-[#0B0F19] to-slate-900 border border-white/5 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group mt-8">
         <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-64 h-64 text-teal-500" />
         </div>
         
         <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6 text-right">
               <div className="flex items-center justify-end gap-4">
                  <h3 className="text-2xl font-black text-white uppercase tracking-widest">محرك التنبؤ الاستراتيجي</h3>
                  <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20">
                     <TrendingUp className="w-6 h-6 text-teal-400" />
                  </div>
               </div>
               <p className="text-slate-400 font-medium leading-relaxed max-w-xl mr-auto">
                  بناءً على النبض الحالي لـ **{governanceStats.autonomyScore}%** من القرارات الذاتية، يتوقع النظام تحسناً في معدلات "السكينة الرقمية" بنسبة **12%** خلال الـ 72 ساعة القادمة.
               </p>
               <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                  <div className="space-y-1">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confidence LTV</span>
                     <div className="text-xl font-black text-white">$142.50</div>
                  </div>
                  <div className="space-y-1">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Churn Probability</span>
                     <div className="text-xl font-black text-rose-500">0.04%</div>
                  </div>
                  <div className="space-y-1">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Next Milestone</span>
                     <div className="text-xl font-black text-teal-400">14h 20m</div>
                  </div>
               </div>
            </div>

            <div className="w-full lg:w-72 h-40 bg-slate-950/50 rounded-3xl border border-white/5 flex items-center justify-center relative shadow-inner overflow-hidden">
                <div className="flex items-end gap-2 h-20 w-full px-6">
                   {[40, 60, 45, 80, 55, 90, 75, 95].map((h, i) => (
                     <div 
                        key={i}
                        style={{ height: `${h}%` }}
                        className="flex-1 bg-gradient-to-t from-teal-500/10 to-teal-500/50 rounded-t-sm" 
                     />
                   ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <span className="text-[10px] font-black text-teal-500/50 uppercase tracking-[0.4em] rotate-90">Forecast Matrix</span>
                </div>
            </div>
         </div>
       </div>
    </div>
  );
};

const MetricCard: FC<{ label: string; value: string | number; desc: string; icon: any; trend?: string; color: string; pulse?: boolean }> = ({ 
  label, value, desc, icon, trend, color, pulse 
}) => {
  const colorMap: Record<string, string> = {
     teal: "from-teal-500/10 to-teal-500/5 border-teal-500/20 text-teal-400",
     indigo: "from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 text-indigo-400",
     purple: "from-purple-500/10 to-purple-500/5 border-purple-500/20 text-purple-400",
     amber: "from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-400",
  };

  return (
    <div className={`p-8 rounded-3xl bg-gradient-to-br ${colorMap[color]} border shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-500`}>
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="flex items-center justify-between mb-4">
         <div className="p-3 bg-black/30 rounded-2xl border border-white/5">{icon}</div>
         {trend && (
           <span className={`text-[10px] font-black uppercase tracking-widest ${trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
             {trend}
           </span>
         )}
      </div>
      <div className="space-y-1">
         <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</h4>
         <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black text-white tracking-tighter ${pulse ? 'animate-pulse' : ''}`}>{value}</span>
         </div>
         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{desc}</p>
      </div>
    </div>
  );
};

const FilterButton: FC<{ active: boolean; label: string; count: number; icon: any; onClick: () => void; highlight?: string }> = ({ 
  active, label, count, icon, onClick, highlight 
}) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group ${
      active 
        ? "bg-white/5 border border-white/10 text-white shadow-lg" 
        : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
    }`}
  >
    <div className="flex items-center gap-3">
       <div className={`${active ? (highlight === 'amber' ? 'text-amber-400' : 'text-teal-400') : 'text-slate-600'} transition-colors`}>{icon}</div>
       <span className="text-xs font-black uppercase tracking-wider">{label}</span>
    </div>
    <span className={`text-[10px] font-mono font-black ${active ? 'opacity-100' : 'opacity-20 transition-opacity group-hover:opacity-50'}`}>
      {count}
    </span>
  </button>
);

const DecisionRow: FC<{ decision: AIDecision; isExpanded: boolean; onToggle: () => void; onResolve: (ok: boolean) => void }> = ({ 
  decision, isExpanded, onToggle, onResolve 
}) => {
  const getStatusConfig = (outcome?: string) => {
    switch(outcome) {
      case 'executed': return { color: 'text-teal-400', label: 'تم التنفيذ', bg: 'bg-teal-500/10' };
      case 'rejected': return { color: 'text-rose-400', label: 'مرفوض', bg: 'bg-rose-500/10' };
      case 'pending_approval': return { color: 'text-amber-400', label: 'مطلوب تصديق', bg: 'bg-amber-500/10' };
      default: return { color: 'text-slate-400', label: 'غامض', bg: 'bg-slate-500/10' };
    }
  };

  const status = getStatusConfig(decision.outcome);

  return (
    <div className={`rounded-3xl border transition-all duration-500 overflow-hidden ${
      isExpanded ? 'bg-slate-900/80 border-white/10 shadow-3xl' : 'bg-[#0B0F19] border-white/5 hover:border-white/10'
    }`}>
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 organic-tap"
      >
        <div className="flex items-center gap-6 text-right">
           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${status.bg} border-white/5`}>
              <Brain className={`w-6 h-6 ${status.color}`} />
           </div>
           <div>
              <div className="flex items-center gap-3 mb-1">
                 <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                   {status.label}
                 </span>
                 <span className="text-xs font-black text-white uppercase tracking-wider">{decision.type.replace(/_/g, ' ')}</span>
              </div>
              <p className="text-sm text-slate-400 font-medium truncate max-w-md">{decision.reasoning}</p>
           </div>
        </div>

        <div className="flex items-center gap-8">
           <div className="text-left hidden md:block">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">توقيت القرار</p>
              <p className="text-xs font-bold text-slate-400 tracking-tighter">{new Date(decision.timestamp).toLocaleTimeString('ar-EG')}</p>
           </div>
           <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown className="w-5 h-5 text-slate-600" />
           </div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5"
          >
            <div className="p-8 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em]">تحليل الحجة (Neural Logic)</h5>
                    <div className="p-6 rounded-2xl bg-black/40 border border-white/5 text-slate-300 text-sm leading-relaxed font-medium">
                       {decision.reasoning}
                    </div>
                 </div>
                 <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">بيانات التنفيذ (Payload)</h5>
                    <pre className="p-6 rounded-2xl bg-black/60 border border-white/5 text-indigo-200 text-[10px] font-mono overflow-auto max-h-40 custom-scrollbar">
                       {JSON.stringify(decision.payload, null, 2)}
                    </pre>
                 </div>
               </div>

               {decision.outcome === 'pending_approval' && (
                 <div className="flex gap-4 pt-4 border-t border-white/5">
                    <button 
                      onClick={() => onResolve(true)}
                      className="flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl bg-teal-500 text-white font-black uppercase tracking-widest hover:bg-teal-400 transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)]"
                    >
                      <CheckCircle className="w-5 h-5" />
                      تصديق الحكم
                    </button>
                    <button 
                      onClick={() => onResolve(false)}
                      className="flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-400 font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all"
                    >
                      <XCircle className="w-5 h-5" />
                      نقض القرار
                    </button>
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
