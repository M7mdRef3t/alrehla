import React from 'react';

export const AwarenessSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-md ${className}`}>
      &nbsp;
    </div>
  );
};

export default AwarenessSkeleton;
