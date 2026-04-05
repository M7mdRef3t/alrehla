import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Globe, 
  ExternalLink, 
  Share2, 
  Radio, 
  Activity, 
  Sparkles, 
  BarChart3, 
  Brain, 
  Settings2,
  Lock,
  Unlock,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign
} from "lucide-react";
import { growthEngine, type DiffusionMetrics } from "../../../../services/growthEngine";
import { AdminTooltip } from "../Overview/components/AdminTooltip";

export const SovereignGatewayCommand: FC<{ onFilterSelect: (filter: { type: string, value: string }) => void }> = ({ onFilterSelect }) => {
  const [metrics, setMetrics] = useState<DiffusionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeGateway, setActiveGateway] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      const data = await growthEngine.getDiffusionMetrics();
      setMetrics(data);
      setIsLoading(false);
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const gateways = metrics?.gatewayHealth ?? {};

  return (
    <div className="space-y-6">
      {/* Oracle Guidance Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-6 rounded-3xl bg-gradient-to-r from-fuchsia-500/10 via-purple-500/5 to-transparent border border-fuchsia-500/20 overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-fuchsia-500/20 transition-all duration-1000" />
        
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 group-hover:scale-110 transition-transform">
             <Brain className="w-8 h-8" />
          </div>
          <div className="flex-1 text-right md:text-left">
             <h4 className="text-xs font-black text-fuchsia-400 uppercase tracking-widest mb-1">رؤية الأوراكل لـ بوابات العبور</h4>
             <p className="text-sm font-bold text-fuchsia-100 leading-relaxed italic">
                {activeGateway ? gateways[activeGateway]?.oracleVerdict : "اختر بوابة عبور لترى تحليل الرنين العميق ونبض الأرواح القادمة منها."}
             </p>
          </div>
          <div className="flex items-center gap-2">
             <div className="px-3 py-1 bg-fuchsia-500/20 rounded-full border border-fuchsia-500/30 text-[10px] font-black text-fuchsia-300 uppercase tracking-tighter animate-pulse">
                تحليل لحظي
             </div>
          </div>
        </div>
      </motion.div>

      {/* Gateway Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(gateways).map(([key, data]) => (
          <GatewayCard 
            key={key}
            id={key}
            data={data}
            isActive={activeGateway === key}
            onClick={() => setActiveGateway(key)}
            onFilter={() => onFilterSelect({ type: "source", value: key })}
          />
        ))}
      </div>

      {/* Traffic Pulse Stream Visualizer */}
      <div className="hud-glass p-6 rounded-3xl border-white/5 relative overflow-hidden bg-black/40">
          <div className="h-24 flex items-end gap-1 px-2">
            {Array.from({ length: 44 }).map((_, idx) => {
              const globalIntensity = (metrics?.velocity ?? 10) / 50; 
              const barIntensity = Math.random() * 0.8 + 0.2;
              const height = (barIntensity * globalIntensity * 80) + 10;
              
              return (
                <motion.div 
                  key={idx}
                  initial={{ height: 10 }}
                  animate={{ 
                    height: [
                      height * 0.8, 
                      height * 1.2, 
                      height
                    ] 
                  }}
                  transition={{ 
                    duration: 1.5 + Math.random(), 
                    repeat: Infinity, 
                    delay: idx * 0.03 
                  }}
                  className={`flex-1 rounded-t-sm transition-colors duration-500 ${
                    idx % 11 === 0 ? "bg-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.4)]" : 
                    idx % 7 === 0 ? "bg-fuchsia-500/40" : "bg-emerald-500/20"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const GatewayCard: FC<{ 
    id: string, 
    data: any, 
    isActive: boolean, 
    onClick: () => void,
    onFilter: () => void
  }> = ({ id, data, isActive, onClick, onFilter }) => {
    const getIcon = (key: string) => {
      switch (key) {
        case 'meta': return <div className="w-full h-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-black text-xs">META</div>;
        case 'tiktok': return <div className="w-full h-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-xs">TT</div>;
        case 'google': return <Globe className="w-5 h-5 text-emerald-400" />;
        default: return <Radio className="w-5 h-5 text-indigo-400" />;
      }
    };

    const getLabel = (key: string) => {
      switch (key) {
        case 'meta': return "بوابة ميتا (Meta Gateway)";
        case 'tiktok': return "جسر تيك توك (TikTok Bridge)";
        case 'google': return "أوراكل جوجل (Google Ads)";
        case 'direct': return "النداء المباشر (Direct)";
        default: return key;
      }
    };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      onClick={onClick}
      className={`relative p-5 rounded-3xl border transition-all duration-500 cursor-pointer overflow-hidden ${
        isActive ? "bg-white/10 border-white/30 shadow-2xl" : "bg-black/40 border-white/10 hover:border-white/20"
      }`}
    >
      {/* Background Pulse */}
      {isActive && (
        <motion.div 
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-blue-500 shadow-[inset_0_0_40px_rgba(59,130,246,0.2)]"
        />
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
           <div className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
              {getIcon(id)}
           </div>
           <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border tracking-tighter ${
             data.resonance >= 0.8 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"
           }`}>
              Resonance: {Math.round(data.resonance * 100)}%
           </div>
        </div>

        <h4 className="text-sm font-black text-white uppercase tracking-tight mb-2">{getLabel(id)}</h4>
        
        {/* Pulse Gauge */}
        <div className="space-y-1 mb-4">
           <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase">
              <span>Traffic Intensity</span>
              <span>{data.pulse}%</span>
           </div>
           <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${data.pulse}%` }}
                className={`h-full ${data.pulse > 80 ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" : "bg-indigo-500"}`}
              />
           </div>
        </div>

        {/* ROI & Spend HUD */}
        <div className="grid grid-cols-2 gap-2 mb-4">
           <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-[7px] font-black uppercase text-slate-500 tracking-widest mb-1">CMA Spend</p>
              <div className="flex items-center gap-1">
                 <DollarSign className="w-2.5 h-2.5 text-slate-400" />
                 <span className="text-[10px] font-black text-white">${Math.round(data.spend || 0)}</span>
              </div>
           </div>
           <div className={`p-2 rounded-xl border ${
             (data.roi || 0) > 0 ? "bg-emerald-500/5 border-emerald-500/10" : "bg-rose-500/5 border-rose-500/10"
           }`}>
              <p className="text-[7px] font-black uppercase text-slate-500 tracking-widest mb-1">Gateway ROI</p>
              <div className="flex items-center gap-1">
                 {(data.roi || 0) > 0 ? <TrendingUp className="w-2.5 h-2.5 text-emerald-400" /> : <TrendingDown className="w-2.5 h-2.5 text-rose-400" />}
                 <span className={`text-[10px] font-black ${
                   (data.roi || 0) > 0 ? "text-emerald-400" : "text-rose-400"
                 }`}>{Math.round(data.roi || 0)}%</span>
              </div>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
           <button 
             onClick={(e) => { e.stopPropagation(); onFilter(); }}
             className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-black text-slate-300 uppercase tracking-widest transition-all"
           >
              الارتباطات
           </button>
           <button className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-all">
              <Settings2 className="w-3.5 h-3.5" />
           </button>
           <button className={`p-1.5 border rounded-lg transition-all ${data.status === 'open' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/20 border-rose-500/30 text-rose-400'}`}>
              {data.status === 'open' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
           </button>
        </div>
      </div>
    </motion.div>
  );
};
