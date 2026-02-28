import React from 'react';
import { ShieldAlert, Zap, Activity } from 'lucide-react';

interface SwarmStatusBadgeProps {
  tension: number;
  momentum: number;
  label?: string;
  isInsulated?: boolean;
}

export const SwarmStatusBadge: React.FC<SwarmStatusBadgeProps> = ({ tension, momentum, label, isInsulated }) => {
  if (tension > 0.7 && !isInsulated) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
        <ShieldAlert className="w-4 h-4" />
        <span className="text-xs font-semibold">{label || "تأهب للخلية"} (M: {momentum})</span>
      </div>
    );
  }
  if (tension > 0.4 && !isInsulated) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
        <Zap className="w-4 h-4" />
        <span className="text-xs font-semibold">{label || "تأثير خارجي نشط"} (M: {momentum})</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
      <Activity className="w-4 h-4" />
      <span className="text-xs font-semibold">{label || "استقرار خلوي"} (M: {momentum})</span>
    </div>
  );
};
