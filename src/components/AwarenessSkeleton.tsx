import React from 'react';

export const AwarenessSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse w-full h-full min-h-[100px] flex items-center justify-center bg-gray-100/10 dark:bg-gray-800/10 rounded-xl border border-white/5">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-t-2 border-primary/50 animate-spin" />
        <div className="h-2 w-16 bg-white/10 rounded-full" />
      </div>
    </div>
  );
};
