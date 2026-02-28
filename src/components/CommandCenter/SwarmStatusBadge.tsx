import React from 'react';

interface SwarmStatusBadgeProps {
  tension?: number;
  momentum?: number;
  label?: string;
  isInsulated?: boolean;
}

export const SwarmStatusBadge: React.FC<SwarmStatusBadgeProps> = ({
  tension = 0, // eslint-disable-line @typescript-eslint/no-unused-vars
  momentum = 0, // eslint-disable-line @typescript-eslint/no-unused-vars
  label = '',
  isInsulated = false
}) => {
  return (
    <div className={`px-2 py-1 rounded-full text-xs font-medium ${isInsulated ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
      {label || 'Status'}
    </div>
  );
};

export default SwarmStatusBadge;
