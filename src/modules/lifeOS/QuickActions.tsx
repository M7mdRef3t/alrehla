"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { QuickAction } from "@/services/ritualsEngine";

interface QuickActionsProps {
  actions: QuickAction[];
  onAction: (action: QuickAction) => void;
}

export const QuickActions = memo(({ actions, onAction }: QuickActionsProps) => {
  if (actions.length === 0) return null;

  return (
    <div className="w-full overflow-hidden">
      <div 
        className="flex items-center gap-2.5 overflow-x-auto pb-4 scrollbar-hide px-1"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {actions.map((action, idx) => (
          <motion.button
            key={action.id}
            onClick={() => onAction(action)}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl whitespace-nowrap border shrink-0 transition-all active:scale-95 shadow-sm"
            style={{
              background: `${action.color}08`, // Subtle background
              borderColor: `${action.color}25`,
              color: action.color,
              scrollSnapAlign: "start"
            }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08, ease: "easeOut" }}
          >
            <span className="text-base">{action.icon}</span>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[11px] font-black uppercase tracking-wider">{action.label}</span>
              {action.priority >= 95 && (
                <span className="text-[8px] font-bold opacity-50 mt-0.5 uppercase">أولوية حاسمة</span>
              )}
            </div>
            <ArrowRight className="w-3.5 h-3.5 opacity-30 ml-1" />
          </motion.button>
        ))}
      </div>
    </div>
  );
});

QuickActions.displayName = "QuickActions";
