import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Zap, Hash, Calendar } from "lucide-react";
import { Insight } from "@/services/insightService";

interface InsightModalProps {
  insight: Insight | null;
  onClose: () => void;
}

export const InsightModal: React.FC<InsightModalProps> = ({ insight, onClose }) => {
  return (
    <AnimatePresence>
      {insight && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl shadow-indigo-500/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-none mb-1">
                    بصيرة محفوظة
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(insight.created_at).toLocaleDateString("ar-EG")}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-medium text-indigo-300">
                    {insight.category === "relationships" ? "علاقات" : insight.category}
                  </span>
                </div>
                
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-300">
                    طاقة: {insight.energy_level}/10
                  </span>
                </div>

                {insight.exercise_code && (
                  <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-300">
                      تمرين: {insight.exercise_code}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-300 leading-relaxed text-base whitespace-pre-wrap">
                  {insight.content}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-slate-800/30 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                إغلاق
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
