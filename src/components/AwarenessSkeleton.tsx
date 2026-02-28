import React from 'react';

export const AwarenessSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-4 w-full h-full p-4 flex flex-col justify-center items-center">
      <div className="h-4 bg-gray-200 rounded w-3/4 dark:bg-gray-700"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 dark:bg-gray-700"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6 dark:bg-gray-700"></div>
    </div>
  );
};
