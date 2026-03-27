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
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-center pointer-events-none"
    >
      <div
        className="flex items-center gap-1.5 p-1.5 rounded-full pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        style={{
          background: "rgba(10, 10, 18, 0.75)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          backdropFilter: "blur(20px)",
          boxShadow: "inset 0 0 20px rgba(255,255,255,0.02)"
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
              className="relative flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300"
              style={{
                color: isActive ? "white" : "rgba(255,255,255,0.4)"
              }}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${tab.color} 0%, ${tab.color}cc 100%)`,
                    boxShadow: `0 8px 20px ${tab.color}30, inset 0 0 10px rgba(255,255,255,0.1)`
                  }}
                  layoutId="activeTab"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30
                  }}
                />
              )}

              <span className="relative z-10 flex items-center gap-2.5">
                <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} />
                <span className="hidden sm:inline-block">{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
