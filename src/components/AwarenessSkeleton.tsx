import React from 'react';

export const AwarenessSkeleton: React.FC = () => {
    return (
        <div className="flex h-full w-full items-center justify-center p-8">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 rounded-full border-4 border-teal-500/20 border-t-teal-500 animate-spin"></div>
                <div className="text-sm font-medium text-slate-400 animate-pulse">جاري التحميل...</div>
            </div>
        </div>
    );
};
