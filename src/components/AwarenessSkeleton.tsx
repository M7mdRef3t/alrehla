import React from 'react';

export const AwarenessSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm z-50 animate-pulse">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-emerald-400/70 font-arabic text-sm tracking-widest">جاري تهيئة النظام...</p>
        </div>
    </div>
  );
};
