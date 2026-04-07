import React, { type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, TrendingUp, AlertCircle } from "lucide-react";

interface RecoveryInsightsProps {
  title: string;
  description: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  type?: "info" | "warning" | "success";
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

export const RecoveryInsights: FC<RecoveryInsightsProps> = ({
  title,
  description,
  isExpanded = true,
  onToggle,
  type = "info",
  actions = []
}) => {
  const bgClass = {
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/40",
    warning: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/40",
    success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/40"
  }[type];

  const iconClass = {
    info: "text-blue-600 dark:text-blue-400",
    warning: "text-amber-600 dark:text-amber-400",
    success: "text-green-600 dark:text-green-400"
  }[type];

  const textClass = {
    info: "text-blue-900 dark:text-blue-100",
    warning: "text-amber-900 dark:text-amber-100",
    success: "text-green-900 dark:text-green-100"
  }[type];

  const Icon = type === "warning" ? AlertCircle : type === "success" ? TrendingUp : Lightbulb;

  return (
    <motion.div
      className={`p-4 rounded-lg border transition-all ${bgClass}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-3 text-right hover:opacity-75 transition-opacity"
      >
        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconClass}`} />
        <div className="flex-1 text-left">
          <h4 className={`text-sm font-bold ${textClass}`}>{title}</h4>
          {isExpanded && (
            <p className={`text-xs mt-1 leading-relaxed ${textClass} opacity-85`}>{description}</p>
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && actions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex gap-2"
          >
            {actions.map((action, i) => (
              <button
                key={i}
                type="button"
                onClick={action.onClick}
                className={`text-xs font-semibold px-3 py-1.5 rounded transition-all ${
                  type === "info"
                    ? "bg-blue-200 text-blue-800 hover:bg-blue-300 dark:bg-blue-700 dark:text-blue-200"
                    : type === "warning"
                      ? "bg-amber-200 text-amber-800 hover:bg-amber-300 dark:bg-amber-700 dark:text-amber-200"
                      : "bg-green-200 text-green-800 hover:bg-green-300 dark:bg-green-700 dark:text-green-200"
                }`}
              >
                {action.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
