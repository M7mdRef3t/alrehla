import React from 'react';

export const AwarenessSkeleton: React.FC = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <div className="animate-pulse space-y-4 text-center">
        <div className="h-12 w-12 rounded-full bg-slate-800 mx-auto"></div>
        <div className="h-4 w-32 bg-slate-800 rounded mx-auto"></div>
        <div className="h-2 w-24 bg-slate-800/50 rounded mx-auto"></div>
      </div>
    </div>
  );
};
