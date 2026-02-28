
import React from 'react';

export function SwarmStatusBadge({ tension, momentum, label, isInsulated }: { tension?: any, momentum?: number, label?: any, isInsulated?: boolean }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      {label || 'Swarm Status'}
    </span>
  );
}
