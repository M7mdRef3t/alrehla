import React from 'react';
import { Users, Shield } from 'lucide-react';

interface SwarmStatusBadgeProps {
  tension: number;
  momentum: number;
  label?: string;
  isInsulated?: boolean;
}

export const SwarmStatusBadge: React.FC<SwarmStatusBadgeProps> = ({
  tension,
  momentum,
  label,
  isInsulated,
}) => {
  return (
    <div className={`flex flex-col gap-1 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isInsulated ? <Shield className="w-4 h-4 text-amber-400" /> : <Users className="w-4 h-4 text-sky-400" />}
          <span className="text-sm font-medium text-slate-200">الوعي الجماعي</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isInsulated ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isInsulated ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
          </span>
          <span className="text-xs text-slate-400">{isInsulated ? 'معزول' : 'متصل'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="bg-slate-900/50 rounded p-1.5 flex flex-col items-center">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">الزخم</span>
          <span className="text-sm font-semibold text-sky-400">{momentum.toFixed(2)}x</span>
        </div>
        <div className="bg-slate-900/50 rounded p-1.5 flex flex-col items-center">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">التوتر</span>
          <span className="text-sm font-semibold text-rose-400">{(tension * 100).toFixed(0)}%</span>
        </div>
      </div>

      {label && (
        <div className="mt-1 text-[11px] text-center text-slate-400 italic">
          "{label}"
        </div>
      )}
    </div>
  );
};
