import React from 'react';

export const AwarenessSkeleton: React.FC = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-900" dir="rtl">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-12 w-12 animate-pulse rounded-full bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
        <p className="text-sm font-medium text-gray-400 animate-pulse tracking-widest">
          جاري تهيئة الوعي...
        </p>
      </div>
    </div>
  );
};
