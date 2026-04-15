"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface BoardColumnProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export default function BoardColumn({ id, title, children }: BoardColumnProps) {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: "Column",
    },
  });

  return (
    <div className="flex flex-col flex-shrink-0 w-80 bg-neutral-900/50 rounded-2xl border border-white/5 overflow-hidden">
      <div className="p-4 bg-black/20 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-neutral-200">{title}</h3>
        {/* Placeholder for item count if needed */}
      </div>
      
      <div 
        ref={setNodeRef}
        className="flex-1 p-3 overflow-y-auto space-y-3"
      >
        {children}
      </div>
    </div>
  );
}
