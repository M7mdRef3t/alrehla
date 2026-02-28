import React from 'react';

export const SwarmStatusBadge = ({ label = "Calibrating", tension = 0, momentum = 0, isInsulated = false }: any) => {
  return (
    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
      {label}
    </div>
  );
};
