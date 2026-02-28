import React from 'react';

export interface SwarmStatusBadgeProps {
  tension: number;
  momentum: number;
  label?: string;
  isInsulated?: boolean;
}

export const SwarmStatusBadge: React.FC<SwarmStatusBadgeProps> = ({ tension, momentum, label, isInsulated }) => {
  return (
    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
      <span className="w-2 h-2 rounded-full bg-indigo-400 mr-2 animate-pulse"></span>
      Swarm Sync: {(momentum * 100).toFixed(0)}%
      {label && <span className="ml-2 text-indigo-300">({label})</span>}
      {isInsulated && <span className="ml-2 bg-indigo-500/20 px-2 py-0.5 rounded text-[10px]">Insulated</span>}
    </div>
  );
};
