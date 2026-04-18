import type { FC } from "react";
import { motion } from "framer-motion";
import { useMeState, type BatteryState } from '@/modules/map/dawayirIndex';
const BATTERY_PCT: Record<BatteryState, number> = {
  drained: 25,
  okay: 65,
  charged: 100
};

const BAR_COLORS: Record<BatteryState, string> = {
  drained: "bg-rose-500",
  okay: "bg-amber-500",
  charged: "bg-emerald-500"
};

export const HealthBar: FC = () => {
  const battery = useMeState((s) => s.battery);
  const pct = BATTERY_PCT[battery];
  const barColor = BAR_COLORS[battery];

  return (
    <div className="w-full shrink-0" title="طاقة نفسية — عدّل من بطاقة أنا">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
          طاقتك النفسية
        </span>
        <span className={`text-[10px] font-bold ${battery === 'drained' ? 'text-rose-400' : 'text-teal-400'}`}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden border border-white/5 shadow-inner">
        <motion.div
          className={`h-full rounded-full ${barColor} shadow-[0_0_8px_rgba(45,212,191,0.3)]`}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />
      </div>
    </div>
  );
};
