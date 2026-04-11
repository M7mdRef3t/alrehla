import type { FC } from "react";
import { motion } from "framer-motion";
import { Map, Activity, HeartPulse, BookOpen, User } from "lucide-react";
import { useLayoutState } from "@/domains/dawayir/store/layout.store";

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
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 p-1 shadow-2xl backdrop-blur-3xl">
            <div className="flex items-center gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.isActive;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={tab.onClick}
                    className="relative flex items-center justify-center min-w-[3.5rem] sm:min-w-[4.5rem] h-12 rounded-full transition-all duration-500 overflow-hidden"
                    style={{
                      color: isActive ? "white" : "rgba(255,255,255,0.35)"
                    }}
                  >
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 z-0 bg-gradient-to-br from-teal-500/20 via-teal-500/10 to-transparent"
                        layoutId="activeTabGlow"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.6)]"
                        layoutId="activeTabUnderline"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}

                    <div className="relative z-10 flex flex-col items-center gap-1">
                      <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} />
                      <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
    </div>
  );
};


