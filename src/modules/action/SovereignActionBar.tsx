import type { FC } from "react";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BatteryCharging, BatteryWarning, Zap, ShieldAlert, HeartPulse, Activity, Trophy, X, TrendingUp, TrendingDown } from "lucide-react";
import { useMapState } from '@/modules/map/dawayirIndex';
import { filterNodesByContext } from '@/modules/map/mapUtils';
import { useParams } from 'next/navigation';

interface SovereignActionBarProps {
  viewingNodeId?: string | null;
  onOpenRecoveryPlan?: (nodeId: string) => void;
  className?: string;
  isFloatingMobile?: boolean;
  isSidebar?: boolean;
  goalIdFilter?: string | null;
}

export const SovereignActionBar: FC<SovereignActionBarProps> = ({ 
  viewingNodeId, 
  onOpenRecoveryPlan, 
  className = "",
  isFloatingMobile = false,
  isSidebar = false,
  goalIdFilter: propGoalIdFilter
}) => {
  const params = useParams();
  const goalIdFromUrl = params?.goalId as string;
  const goalIdFilter = propGoalIdFilter ?? goalIdFromUrl;

  const nodes = useMapState((s) => s.nodes);
  const addEnergyTransaction = useMapState((s) => s.addEnergyTransaction);
  
  const [showLogModal, setShowLogModal] = useState(false);
  const [logType, setLogType] = useState<"charge" | "drain">("charge");

  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('dawayir_energy_bar_dismissed') === 'true';
  });

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    localStorage.setItem('dawayir_energy_bar_dismissed', 'true');
  };

  const pnl = useMemo(() => {
    let charge = 0;
    let drain = 0;
    
    // Use shared utility to filter nodes by current context if applicable
    const filteredNodes = filterNodesByContext(nodes, goalIdFilter, null);
    
    filteredNodes.forEach(n => {
      if (n.energyBalance) {
        charge += n.energyBalance.totalCharge;
        drain += n.energyBalance.totalDrain;
      }
    });
    return {
      charge,
      drain,
      net: charge - drain,
    };
  }, [nodes, goalIdFilter]);

  const handleLogEnergy = (amount: number, note: string, targetNodeId: string) => {
    addEnergyTransaction(targetNodeId, amount, note);
    setShowLogModal(false);
  };

  const netPct = Math.max(0, Math.min(100, 50 + (pnl.net / Math.max(100, Math.abs(pnl.net) * 2)) * 50));
  
  // Decide styling based on P&L status
  const isHealthy = pnl.net >= 0;
  const barColor = isHealthy ? "bg-emerald-500" : "bg-rose-500";
  const glowColor = isHealthy ? "shadow-emerald-500/20" : "shadow-rose-500/20";
  
  const content = (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`w-full relative overflow-hidden transition-all duration-300 ${isSidebar ? "bg-transparent border-none p-0 shadow-none" : `rounded-2xl border border-white/20 backdrop-blur-xl bg-slate-900/60 p-4 shadow-xl ${glowColor}`} ${className}`}
        >
          {/* Background ambient glow */}
          {!isSidebar && <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-3xl opacity-20 ${isHealthy ? "bg-emerald-500" : "bg-rose-500"}`} />}
          
          {/* Close Button - Only show if NOT in sidebar mode */}
          {!isSidebar && (
            <button 
              onClick={handleDismiss}
              className="absolute top-2 left-2 z-20 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white transition-all"
              title="إخفاء الرصيد"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {!isSidebar && (
            <div className="flex items-center justify-between mb-3 relative z-10 pl-6">
              <div className="flex items-center gap-2">
                {isHealthy ? (
                  <Activity className="w-5 h-5 text-emerald-400" />
                ) : (
                  <HeartPulse className="w-5 h-5 text-rose-400" />
                )}
                <h3 className="text-sm font-bold text-white">رصيد طاقتك المعنوي</h3>
              </div>
              <div className="text-left font-mono">
                <span className={`text-lg font-black tracking-tighter ${isHealthy ? "text-emerald-400" : "text-rose-400"}`}>
                  {isHealthy ? "+" : ""}{pnl.net}
                </span>
                <span className="text-[10px] text-slate-400 ml-1">XP</span>
              </div>
            </div>
          )}

          {isSidebar && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">رصيد طاقتك المعنوي</span>
              <div className="flex items-baseline gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                <span className={`text-[11px] font-black ${isHealthy ? "text-emerald-400" : "text-rose-400"}`}>
                    {isHealthy ? "+" : ""}{pnl.net}
                </span>
                <span className="text-[8px] font-bold text-indigo-400/80">XP</span>
              </div>
            </div>
          )}

          {/* P&L Ledger Bar */}
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mb-4 flex">
            <motion.div
              className={`h-full ${barColor}`}
              initial={{ width: "50%" }}
              animate={{ width: `${netPct}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>

          {/* نص توضيحي للمستخدم */}
          <p className="text-[9px] text-slate-500 mb-3 leading-relaxed opacity-80">
            سجّل أي مواقف النهاردة شحنت طاقتك (+) أو استنزفتها (-) في دوائرك.
          </p>

          <div className="flex items-center justify-between gap-3 relative z-10">
            <button
              onClick={() => { setLogType("charge"); setShowLogModal(true); }}
              className="flex-1 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl py-2 px-2 text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 group"
            >
              <TrendingUp className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>شحن (+)</span>
            </button>
            <button
              onClick={() => { setLogType("drain"); setShowLogModal(true); }}
              className="flex-1 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl py-2 px-2 text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 group"
            >
              <TrendingDown className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>استنزاف (-)</span>
            </button>
            
            {viewingNodeId && onOpenRecoveryPlan && (
              <button
                onClick={() => onOpenRecoveryPlan(viewingNodeId)}
                className="w-10 h-10 flex shrink-0 items-center justify-center bg-teal-600 hover:bg-teal-500 text-white rounded-xl shadow-lg shadow-teal-900/30 transition-all"
                title="برامج الحماية الذاتية"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {showLogModal && (
              <LogEnergyModal
                type={logType}
                nodes={nodes}
                defaultNodeId={viewingNodeId}
                onClose={() => setShowLogModal(false)}
                onSubmit={handleLogEnergy}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isFloatingMobile) {
    return (
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-4 right-4 z-40 md:hidden">
        {content}
      </div>
    );
  }

  return content;
};

interface LogEnergyModalProps {
  type: "charge" | "drain";
  nodes: any[]; // MapNode array
  defaultNodeId?: string | null;
  onClose: () => void;
  onSubmit: (amount: number, note: string, targetNodeId: string) => void;
}

const LogEnergyModal: FC<LogEnergyModalProps> = ({ type, nodes, defaultNodeId, onClose, onSubmit }) => {
  const [amount, setAmount] = useState<number>(type === "charge" ? 15 : -15);
  const [note, setNote] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string>(defaultNodeId || (nodes[0]?.id || ""));

  const isCharge = type === "charge";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute inset-0 z-20 rounded-2xl bg-slate-900/95 backdrop-blur-3xl border border-white/10 p-4 flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className={`text-sm font-bold flex items-center gap-2 ${isCharge ? "text-emerald-400" : "text-rose-400"}`}>
          {isCharge ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {isCharge ? "تسجيل مكسب طاقة" : "تسجيل خسارة طاقة"}
        </h4>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1 block">مقدار التأثير</label>
          <div className="flex gap-2">
            {[10, 25, 50].map((val) => {
              const actualVal = isCharge ? val : -val;
              const isSelected = amount === actualVal;
              return (
                <button
                  key={val}
                  onClick={() => setAmount(actualVal)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                    isSelected 
                      ? isCharge ? "bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20" : "bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20"
                      : "bg-slate-800 text-slate-300 border-white/5 hover:bg-slate-700"
                  }`}
                >
                  {isCharge ? "+" : "-"}{val}
                </button>
              )
            })}
          </div>
        </div>

        {nodes.length > 0 && (
          <div>
            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1 block">مين الدائرة المستهدفة؟</label>
            <select 
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-teal-500"
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.label}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1 block">ملاحظة السر</label>
          <input 
            type="text" 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="إيه اللي حصل؟"
            className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-teal-500"
          />
        </div>
      </div>

      <button
        onClick={() => {
          if (selectedNodeId) {
            onSubmit(amount, note, selectedNodeId);
          }
        }}
        disabled={!selectedNodeId}
        className={`mt-2 w-full py-2.5 rounded-xl text-white text-sm font-bold transition-all shadow-lg ${
          isCharge ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40" : "bg-rose-600 hover:bg-rose-500 shadow-rose-900/40"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        حفظ السجل
      </button>
    </motion.div>
  );
};
