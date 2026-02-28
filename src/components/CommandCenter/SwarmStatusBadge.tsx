import React from 'react';

export interface SwarmStatusBadgeProps {
  tension?: number;
  momentum?: number;
  label?: string;
  isInsulated?: boolean;
}

export const SwarmStatusBadge: React.FC<SwarmStatusBadgeProps> = ({
  tension = 0,
  momentum,
  label,
  isInsulated
}) => {
  return (
    <div className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-800">
      Swarm Tension: {tension.toFixed(2)}
    </div>
  );
};
