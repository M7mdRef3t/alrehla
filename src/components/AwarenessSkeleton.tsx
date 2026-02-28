import React from 'react';

export const AwarenessSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-surface-dark/20 rounded-lg h-32 w-full ${className}`} />
  );
};

export default AwarenessSkeleton;
