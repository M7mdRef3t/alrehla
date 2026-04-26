import type { FC } from "react";
import { motion } from "framer-motion";

interface MissionCardProps {
  missionLabel: string;
  missionGoal: string;
}

export const MissionCard: FC<MissionCardProps> = ({
  missionLabel,
  missionGoal
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.5 }}
      className="px-8 py-8 rounded-[2.5rem] bg-[var(--page-surface-2)] border border-teal-500/20 relative overflow-hidden group text-right shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
    >
      <div className="absolute top-0 right-0 w-1 bg-teal-500 h-full shadow-[0_0_15px_rgba(45,212,191,0.5)]" />
      <span className="text-[10px] font-black text-[var(--consciousness-text-muted)] flex items-center justify-end gap-2 mb-3 font-tajawal">
         <span className="text-zinc-400">{missionLabel}</span>
         <span>•</span>
         <span className="text-teal-400">الهدف الحالي</span>
      </span>
      <p className="text-2xl font-black text-[var(--consciousness-text)]">{missionGoal}</p>
    </motion.div>
  );
};
