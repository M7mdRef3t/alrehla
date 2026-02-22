/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🗂️ TAB NAVIGATION — نظام التبويبات
 * ════════════════════════════════════════════════════════════════════════════
 *
 * شريط تبويبات للتنقل السريع بين:
 * - الخريطة
 * - التحليل
 * - الحوار
 */

import type { FC } from "react";
import { motion } from "framer-motion";
import { Map, BarChart3, MessageSquare } from "lucide-react";
import { useLayoutState, type ActiveTab } from "../state/layoutState";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TYPES
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface TabNavigationProps {
  /** إخفاء التبويبات في حالات معينة */
  hidden?: boolean;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const TabNavigation: FC<TabNavigationProps> = ({ hidden = false }) => {
  const activeTab = useLayoutState((s) => s.activeTab);
  const setActiveTab = useLayoutState((s) => s.setActiveTab);

  if (hidden) return null;

  // ─── Tab Items ────────────────────────────────────────────────────────────
  const tabs: Array<{
    id: ActiveTab;
    label: string;
    icon: typeof Map;
    color: string;
  }> = [
    {
      id: "map",
      label: "الخريطة",
      icon: Map,
      color: "var(--ring-safe)"
    },
    {
      id: "insights",
      label: "التحليل",
      icon: BarChart3,
      color: "rgba(251, 191, 36, 0.9)"
    },
    {
      id: "conversation",
      label: "الحوار",
      icon: MessageSquare,
      color: "rgba(167, 139, 250, 0.9)"
    }
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center py-3 px-4"
      style={{
        background: "rgba(15, 23, 42, 0.95)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
      }}
    >
      <div
        className="flex items-center gap-1 p-1 rounded-full"
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.08)"
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                color: isActive ? "white" : "var(--text-secondary)"
              }}
            >
              {/* Active Background */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${tab.color} 0%, ${tab.color}cc 100%)`,
                    boxShadow: `0 4px 12px ${tab.color}40`
                  }}
                  layoutId="activeTab"
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                />
              )}

              {/* Icon & Label */}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
