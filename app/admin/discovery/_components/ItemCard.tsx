"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreVertical, Trash2, Archive, Hash, AlertCircle } from "lucide-react";
import { DiscoveryItem } from "@/types/discovery";

interface ItemCardProps {
  item: DiscoveryItem;
  isOverlay?: boolean;
  onClick?: (item: DiscoveryItem) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
}

export default function ItemCard({ item, isOverlay, onClick, onDelete, onArchive }: ItemCardProps) {
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

  const confidence = item.confidence ?? 50;
  const confColor = confidence > 75 ? "bg-emerald-500" : confidence > 40 ? "bg-blue-500" : "bg-amber-500";

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="opacity-30 border-2 border-dashed border-purple-500/50 rounded-xl p-4 bg-neutral-900 min-h-[140px]"
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
        if (!isOverlay && onClick) onClick(item);
      }}
      className={`bg-neutral-900 border border-white/5 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-white/10 hover:bg-neutral-800/80 transition-all shadow-sm group relative overflow-hidden ${
        isOverlay ? "rotate-2 scale-105 shadow-2xl border-purple-500/50 z-50" : ""
      }`}
    >
      {/* Confidence Bar (Top) */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5">
        <div className={`h-full ${confColor} transition-all duration-1000`} style={{ width: `${confidence}%` }} />
      </div>

      {/* Actions Layer (Visible on Hover) */}
      {!isOverlay && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button 
            onClick={(e) => { e.stopPropagation(); onArchive?.(item.id); }}
            title="Archive"
            className="p-1.5 bg-neutral-800 border border-white/5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete?.(item.id); }}
            title="Delete"
            className="p-1.5 bg-neutral-800 border border-white/5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button 
            className="p-1.5 bg-neutral-800 border border-white/5 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Priority & Source */}
      <div className="flex justify-between items-start mb-2.5">
        <span className={`text-[9px] uppercase font-black tracking-tighter px-2 py-0.5 rounded-md ${priorityColors[item.priority as keyof typeof priorityColors]}`}>
          {item.priority}
        </span>
        <span className="text-[9px] text-neutral-600 font-mono flex items-center gap-1 group-hover:text-neutral-400 transition-colors">
          <AlertCircle className="w-2.5 h-2.5" />
          {item.source.replace('_', ' ')}
        </span>
      </div>
      
      {/* Title */}
      <h4 className="text-[13px] font-bold text-white leading-snug mb-1.5 group-hover:text-purple-300 transition-colors line-clamp-2">
        {item.title}
      </h4>
      
      {/* Description */}
      <p className="text-[11px] text-neutral-500 leading-relaxed line-clamp-2 mb-3 group-hover:text-neutral-400 transition-colors">
        {item.description}
      </p>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[9px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded border border-white/5 flex items-center gap-0.5">
              <Hash className="w-2 h-2" />
              {tag}
            </span>
          ))}
          {item.tags.length > 3 && <span className="text-[9px] text-neutral-600">+{item.tags.length - 3}</span>}
        </div>
      )}

      {/* Footer Metrics */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex items-center gap-3 text-[10px] text-neutral-600">
          <span title="Facts" className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.5)]"></span>
            {item.facts?.length || 0}
          </span>
          <span title="Interpretations" className="flex items-center gap-1 hover:text-purple-400 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)]"></span>
            {item.interpretations?.length || 0}
          </span>
        </div>
        <div className="text-[9px] font-bold text-neutral-700 uppercase group-hover:text-neutral-500 transition-colors">
          Conf: {confidence}%
        </div>
      </div>
    </div>
  );
}
