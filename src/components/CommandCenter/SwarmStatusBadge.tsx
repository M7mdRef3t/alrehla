import React from 'react';

export interface SwarmStatusBadgeProps {
  tension?: number;
  momentum?: number;
  label?: string;
  isInsulated?: boolean;
}

export const SwarmStatusBadge: React.FC<SwarmStatusBadgeProps> = ({
  tension = 0,
  momentum = 0,
  label = '',
  isInsulated = false,
}) => {
  return (
    <div className={`p-4 rounded border ${isInsulated ? 'border-green-500 bg-green-900/20' : 'border-gray-500 bg-gray-900/20'}`}>
      <h3 className="text-lg font-bold">Swarm Status</h3>
      <div className="text-sm opacity-80 mt-1">
        Tension: {tension.toFixed(2)} | Momentum: {momentum.toFixed(2)}
      </div>
      {label && <div className="mt-2 text-xs uppercase tracking-wider text-blue-400">{label}</div>}
      {isInsulated && <div className="mt-1 text-xs text-green-400">Insulated</div>}
    </div>
  );
};
