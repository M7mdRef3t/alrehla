import React from 'react';

interface SwarmStatusBadgeProps {
  label?: string;
  tension?: number;
  momentum?: number;
  isInsulated?: boolean;
}

export const SwarmStatusBadge: React.FC<SwarmStatusBadgeProps> = ({
  label = "Calibrating",
  tension = 0,
  momentum = 0,
  isInsulated = false
}) => {
  return (
    <div
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"
      data-tension={tension}
      data-momentum={momentum}
      data-insulated={isInsulated}
    >
      {label}
    </div>
  );
};
