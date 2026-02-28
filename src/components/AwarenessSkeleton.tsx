import React from 'react';

export const AwarenessSkeleton: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-full w-full p-4 animate-pulse">
      <div className="w-12 h-12 bg-white/10 rounded-full border-t-2 border-white/20 animate-spin"></div>
    </div>
  );
};
