import React from 'react';

export function AwarenessSkeleton() {
  return (
    <div className="animate-pulse flex flex-col items-center space-y-4">
      <div className="h-12 w-12 bg-gray-300 rounded-full" />
      <div className="h-4 w-32 bg-gray-300 rounded" />
      <div className="h-4 w-24 bg-gray-300 rounded" />
    </div>
  );
}
