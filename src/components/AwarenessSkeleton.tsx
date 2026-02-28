import React from 'react';

export const AwarenessSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-full h-64 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-indigo-500 animate-spin" />
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
      </div>
    </div>
  );
};

export default AwarenessSkeleton;
