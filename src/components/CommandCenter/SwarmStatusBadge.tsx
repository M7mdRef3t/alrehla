import React from 'react';
import { ShieldAlert, Zap } from 'lucide-react';

interface SwarmStatusBadgeProps {
  tension: number;
  momentum: number;
  label?: string;
  isInsulated?: boolean;
}

export const SwarmStatusBadge: React.FC<SwarmStatusBadgeProps> = ({ tension, momentum, label, isInsulated }) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg text-sm text-slate-300">
      <div className="flex items-center gap-1">
        <ShieldAlert className="w-4 h-4 text-orange-400" />
        <span>Tension: {(tension * 100).toFixed(0)}%</span>
      </div>
      <div className="flex items-center gap-1">
        <Zap className="w-4 h-4 text-yellow-400" />
        <span>Momentum: {momentum.toFixed(1)}</span>
      </div>
      {label && <span className="ml-2 font-medium text-slate-200">{label}</span>}
      {isInsulated && <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-300 rounded-full">Insulated</span>}
    </div>
  );
};
