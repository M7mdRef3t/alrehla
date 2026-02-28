import React from 'react';

export const AwarenessSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
    </div>
  );
};
