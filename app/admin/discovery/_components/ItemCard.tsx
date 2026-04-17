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
        // Only trigger click if not an overlay and not dragging
        if (!isOverlay && onClick) {
          onClick(item);
        }
      }}
      className={`bg-neutral-800 border border-white/10 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-white/20 transition-colors shadow-sm group ${
        isOverlay ? "rotate-2 scale-105 shadow-xl border-emerald-500/50" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${priorityColors[item.priority as keyof typeof priorityColors]}`}>
          {item.priority}
        </span>
        <span className="text-[10px] text-neutral-500 font-mono">
          {item.source}
        </span>
      </div>
      
      <h4 className="text-sm font-semibold text-white leading-tight mb-2">
        {item.title}
      </h4>
      
      <p className="text-xs text-neutral-400 line-clamp-2 mb-3">
        {item.description}
      </p>

      <div className="flex items-center gap-2 mt-auto text-xs text-neutral-500">
        <span title="Facts" className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
          {item.facts.length}
        </span>
        <span title="Interpretations" className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          {item.interpretations.length}
        </span>
      </div>
    </div>
  );
}
