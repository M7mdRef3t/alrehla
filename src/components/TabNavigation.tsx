import type { FC } from "react";
import { motion } from "framer-motion";
import { Map, Activity, HeartPulse, BookOpen, User } from "lucide-react";
import { useLayoutState } from "../state/layoutState";

interface TabNavigationProps {
  hidden?: boolean;
  onPulse?: () => void;
  onLibrary?: () => void;
  onProfile?: () => void;
}

type AppTab = "map" | "trajectory" | "pulse" | "library" | "profile";

export const TabNavigation: FC<TabNavigationProps> = ({
  hidden = false,
  onPulse,
  onLibrary,
  onProfile
}) => {
  const activeTab = useLayoutState((s) => s.activeTab);
  const setActiveTab = useLayoutState((s) => s.setActiveTab);

  if (hidden) return null;

  const tabs: Array<{
    id: AppTab;
    label: string;
    icon: typeof Map;
    color: string;
    isActive: boolean;
    onClick: () => void;
  }> = [
    {
      id: "map",
      label: "الخريطة",
      icon: Map,
      color: "var(--layer-operational)",
      isActive: activeTab === "operational",
      onClick: () => setActiveTab("operational")
    },
    {
      id: "trajectory",
      label: "المسار",
      icon: Activity,
      color: "var(--layer-analytical)",
      isActive: activeTab === "analytical" || activeTab === "narrative",
      onClick: () => setActiveTab("analytical")
    },
    {
      id: "pulse",
      label: "النبض",
      icon: HeartPulse,
      color: "var(--soft-teal)",
      isActive: false,
      onClick: () => onPulse?.()
    },
    {
      id: "library",
      label: "المكتبة",
      icon: BookOpen,
      color: "var(--layer-narrative)",
      isActive: false,
      onClick: () => onLibrary?.()
    },
    {
      id: "profile",
      label: "أنا",
      icon: User,
      color: "var(--layer-muted)",
      isActive: activeTab === "settings",
      onClick: () => onProfile?.()
    }
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-center py-6 px-4 pb-10 sm:pb-6"
      style={{
        background: "linear-gradient(to top, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0))",
        backdropFilter: "blur(12px)",
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
          const isActive = tab.isActive;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={tab.onClick}
              className="relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                color: isActive ? "white" : "var(--text-secondary)"
              }}
            >
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
