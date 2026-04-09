import type { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Heart, Zap, AlertTriangle } from "lucide-react";
import { useAdminState } from "@/state/adminState";
import { useLockdownState } from "@/state/lockdownState";

export const SovereignHUD: FC = () => {
  const resonanceScore = useAdminState((s) => s.resonanceScore);
  const latestFriction = useAdminState((s) => s.latestFriction);
  const isLockdownActive = useLockdownState((s) => s.checkLockdownStatus());

  const getStatusColor = () => {
    if (isLockdownActive) return "text-rose-500 border-rose-500/30 bg-rose-500/10";
    if (resonanceScore < 40) return "text-amber-500 border-amber-500/30 bg-amber-500/10";
    if (resonanceScore < 70) return "text-teal-400 border-teal-500/30 bg-teal-500/10";
    return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
  };

  const getStatusIcon = () => {
    if (isLockdownActive) return <Zap className="w-3.5 h-3.5 animate-pulse" />;
    if (resonanceScore < 40) return <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />;
    return <Activity className="w-3.5 h-3.5" />;
  };

  const getStatusLabel = () => {
    if (isLockdownActive) return "النظام مجمد";
    if (resonanceScore < 40) return "اضطراب طاقة";
    if (resonanceScore < 70) return "استقرار نسبي";
    return "تناغم كامل";
  };

  return (
    <div className="flex items-center gap-3" dir="rtl">
      {/* Resonance Pill */}
      <motion.div 
        layout
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border backdrop-blur-md transition-colors duration-500 ${getStatusColor()}`}
      >
        <div className="relative">
          {getStatusIcon()}
          {resonanceScore > 70 && !isLockdownActive && (
             <motion.div 
               animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute inset-0 rounded-full bg-current opacity-20 blur-sm"
             />
          )}
        </div>
        
        <div className="flex flex-col leading-none">
          <span className="text-[10px] uppercase font-black tracking-wider opacity-70">
            Resonance
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold">{resonanceScore}%</span>
            <span className="text-[9px] font-medium opacity-60 border-r border-current/20 pr-1.5 mr-1.5">
              {getStatusLabel()}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Latest Friction Snippet (Desktop Only) */}
      <AnimatePresence>
        {latestFriction && !isLockdownActive && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 text-slate-600 dark:text-slate-400"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[10px] font-bold truncate max-w-[150px]">
              {latestFriction}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
