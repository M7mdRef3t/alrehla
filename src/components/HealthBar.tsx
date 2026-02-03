import type { FC } from "react";
import { motion } from "framer-motion";
import { useMeState, type BatteryState } from "../state/meState";
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
    <div className="w-full px-1 mb-2 shrink-0" title="طاقة نفسية — عدّل من بطاقة أنا">
      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 text-right">
        طاقة نفسية
      </p>
      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />
      </div>
    </div>
  );
};
