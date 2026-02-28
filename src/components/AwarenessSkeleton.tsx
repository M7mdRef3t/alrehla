import React from 'react';

export function AwarenessSkeleton() {
  return (
    <div className="w-full flex-1 flex flex-col p-4 md:p-6 lg:p-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2 mb-8 mt-4 md:mt-0 max-w-2xl">
        <div className="h-6 md:h-8 bg-zinc-800 rounded w-3/4"></div>
        <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid gap-4 w-full">
        {/* Card 1 */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 w-full">
          <div className="flex items-start justify-between mb-4">
            <div className="flex flex-col gap-2">
              <div className="h-5 bg-zinc-800 rounded w-32"></div>
              <div className="h-3 bg-zinc-800 rounded w-48"></div>
            </div>
            <div className="h-8 w-8 bg-zinc-800 rounded-full"></div>
          </div>
          <div className="h-2 bg-zinc-800 rounded w-full mt-6"></div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 w-full">
          <div className="flex items-start justify-between mb-4">
            <div className="flex flex-col gap-2">
              <div className="h-5 bg-zinc-800 rounded w-40"></div>
              <div className="h-3 bg-zinc-800 rounded w-36"></div>
            </div>
            <div className="h-8 w-8 bg-zinc-800 rounded-full"></div>
          </div>
          <div className="flex gap-2 mt-4">
            <div className="h-8 bg-zinc-800 rounded w-24"></div>
            <div className="h-8 bg-zinc-800 rounded w-24"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
