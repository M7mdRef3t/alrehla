import React from 'react';
import { Badge } from 'lucide-react';

export const SwarmStatusBadge: React.FC<{ tension: number; momentum: number; label?: string; isInsulated?: boolean }> = ({ tension, momentum, label, isInsulated }) => {
  return (
    <div className="flex flex-col items-start p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
      <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs font-medium">
        <Badge className="w-4 h-4 text-emerald-500" />
        <span>{label || 'حالة السرب'}</span>
      </div>
      <div className="text-[10px] text-slate-500 mt-1">
        Tension: {Math.round(tension * 100)}% | Momentum: {Math.round(momentum * 100)}%
        {isInsulated && <span className="ml-2 rtl:mr-2 text-indigo-500">(معزول)</span>}
      </div>
    </div>
  );
};
