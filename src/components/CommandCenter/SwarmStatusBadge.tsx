import React from 'react';

export const SwarmStatusBadge: React.FC<{ momentum: number; label: string }> = ({ momentum, label }) => {
  return (
    <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300">
      Swarm Sync: {momentum}% {label ? `| ${label}` : ''}
    </div>
  );
};
