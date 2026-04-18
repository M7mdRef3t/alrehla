"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DiscoveryItem } from "@/types/discovery";

interface ItemCardProps {
  item: DiscoveryItem;
  isOverlay?: boolean;
  onClick?: (item: DiscoveryItem) => void;
}

export default function ItemCard({ item, isOverlay, onClick }: ItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: "Item",
      item,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColors = {
    low: "bg-neutral-500/20 text-neutral-300",
    medium: "bg-blue-500/20 text-blue-300",
    high: "bg-orange-500/20 text-orange-300",
    critical: "bg-red-500/20 text-red-300",
  };

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="opacity-30 border-2 border-dashed border-emerald-500 rounded-xl p-4 bg-neutral-800/50 min-h-[120px]"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(_e) => {
        if (!isOverlay && onClick) {
          onClick(item);
        }
      }}
      className={`bg-white/[0.03] backdrop-blur-md border border-white/5 rounded-2xl p-4 cursor-grab active:cursor-grabbing hover:border-purple-500/30 hover:bg-white/[0.05] transition-all duration-300 shadow-xl group relative overflow-hidden ${
        isOverlay ? "rotate-2 scale-105 shadow-2xl border-purple-500/50 bg-neutral-900" : ""
      }`}
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity bg-gradient-to-br ${
         item.priority === 'critical' ? 'from-rose-500' : 
         item.priority === 'high' ? 'from-orange-500' : 
         'from-purple-500'
      }`} />

      <div className="flex justify-between items-center mb-3 relative z-10">
        <span className={`text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded-lg border ${
            item.priority === 'critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
            item.priority === 'high' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
            item.priority === 'medium' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
            'bg-neutral-500/10 border-white/5 text-neutral-400'
        }`}>
          {item.priority}
        </span>
        <span className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">
          {item.source.replace('_', ' ')}
        </span>
      </div>
      
      <h4 className="text-[13px] font-bold text-white leading-snug mb-2 group-hover:text-purple-300 transition-colors relative z-10">
        {item.title}
      </h4>
      
      <p className="text-[11px] text-neutral-400 leading-relaxed line-clamp-2 mb-4 relative z-10">
        {item.description}
      </p>

      <div className="flex items-center justify-between mt-auto relative z-10">
        <div className="flex items-center gap-3">
            <span title="Facts" className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                <div className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]"></div>
                {item.facts.length}
            </span>
            <span title="Interpretations" className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                <div className="w-1 h-1 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.5)]"></div>
                {item.interpretations.length}
            </span>
        </div>
        
        {item.execution_link && (
            <div className="px-2 py-1 bg-emerald-500/10 rounded-lg text-emerald-400">
                <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></div>
            </div>
        )}
      </div>
    </div>
  );
}
