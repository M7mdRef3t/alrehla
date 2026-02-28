import React from 'react';

interface SwarmStatusBadgeProps {
  tension?: number;
  momentum?: number;
  label?: string;
  isInsulated?: boolean;
}

export const SwarmStatusBadge: React.FC<SwarmStatusBadgeProps> = ({ label }) => {
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-surface-base rounded-full text-xs font-mono">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span>{label || 'السرب نشط'}</span>
    </div>
  );
};
