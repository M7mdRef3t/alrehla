import React from 'react';

export const SwarmStatusBadge: React.FC<{ tension?: any; momentum?: number; label?: any; isInsulated?: boolean; status?: string; metrics?: any }> = ({ status, metrics, tension, momentum, label, isInsulated }) => {
  return (
    <div className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary border border-primary/30">
      {status || label || 'Active'}
    </div>
  );
};
