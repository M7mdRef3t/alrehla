import React from 'react';

export const AwarenessSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 space-y-4 animate-pulse">
      <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700"></div>
      <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
      <div className="h-2 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
    </div>
  );
};

export default AwarenessSkeleton;
