import React from 'react';
import { motion } from 'framer-motion';

export const SwarmStatusBadge: React.FC<{
    tension: number;
    momentum: number;
    label?: string;
    isInsulated?: boolean;
}> = ({ tension, momentum, label, isInsulated }) => {
  let status: 'STABLE' | 'UNSTABLE' | 'CRITICAL' = 'STABLE';
  if (tension > 0.8) status = 'CRITICAL';
  else if (tension > 0.5) status = 'UNSTABLE';

  const colors = {
    STABLE: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
    UNSTABLE: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
    CRITICAL: 'bg-red-500/20 text-red-600 border-red-500/30'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[status]} flex items-center gap-2 w-fit`}
    >
      <span className="relative flex h-2 w-2">
        {status !== 'STABLE' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === 'CRITICAL' ? 'bg-red-400' : 'bg-amber-400'}`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${status === 'CRITICAL' ? 'bg-red-500' : status === 'UNSTABLE' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
      </span>
      {label || status}
      {isInsulated && <span className="ml-1 opacity-70">(Insulated)</span>}
    </motion.div>
  );
};
