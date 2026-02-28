import React from 'react';

export const AwarenessSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse flex flex-col items-center justify-center p-8 space-y-4 rounded-3xl bg-slate-900/40 border border-white/5">
      <div className="w-16 h-16 bg-slate-800 rounded-full"></div>
      <div className="w-32 h-4 bg-slate-800 rounded-md"></div>
      <div className="w-48 h-3 bg-slate-800/70 rounded-md"></div>
    </div>
  );
};
