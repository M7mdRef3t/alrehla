import type { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageSquare, BarChart3, Settings, X, Sparkles } from "lucide-react";
import { useLayoutState } from "../state/layoutState";


interface FloatingActionMenuProps {
  onAddPerson: () => void;
  onOpenInsights: () => void;
  onOpenSettings: () => void;
  onToggleAI: () => void;
  isAIConnected?: boolean;
  showAIOption?: boolean;
}

export const FloatingActionMenu: FC<FloatingActionMenuProps> = ({
  onAddPerson,
  onOpenInsights,
  onOpenSettings,
  onToggleAI,
  isAIConnected = false,
  showAIOption = true,
}) => {
  const fabState = useLayoutState((state) => state.fabState);
  const toggleFAB = useLayoutState((state) => state.toggleFAB);

  const menuItems = [
    {
      id: "add-person",
      icon: Plus,
      label: "إضافة شخص",
      color: "var(--ring-safe)",
      onClick: () => {
        onAddPerson();
        toggleFAB();
      },
      show: true,
    },
    {
      id: "ai-conversation",
      icon: MessageSquare,
      label: isAIConnected ? "Dawayir Live (مفتوح)" : "Dawayir Live",
      color: isAIConnected ? "var(--ring-safe)" : "rgba(45, 212, 191, 0.9)",
      onClick: () => {
        onToggleAI();
        toggleFAB();
      },
      show: showAIOption,
      badge: isAIConnected ? "●" : null,
    },
    {
      id: "insights",
      icon: BarChart3,
      label: "الإحصاءات والتحليل",
      color: "rgba(251, 191, 36, 0.9)",
      onClick: () => {
        onOpenInsights();
        toggleFAB();
      },
      show: true,
    },
    {
      id: "settings",
      icon: Settings,
      label: "الإعدادات",
      color: "var(--text-secondary)",
      onClick: () => {
        onOpenSettings();
        toggleFAB();
      },
      show: true,
    },
  ].filter((item) => item.show);

  const positionStyles =
    fabState.position === "bottom-left"
      ? { bottom: "1.5rem", left: "1.5rem" }
      : { bottom: "1.5rem", right: "1.5rem" };

  return (
    <div className="fixed z-50" style={positionStyles}>
      <AnimatePresence>
        {fabState.isOpen && (
          <motion.div
            className="absolute bottom-20 space-y-3"
            style={fabState.position === "bottom-left" ? { left: 0 } : { right: 0 }}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
                staggerChildren: 0.07,
                delayChildren: 0.1,
              },
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
          >
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className="group flex items-center gap-3 rounded-full px-4 py-3 glass-card transition-all hover:bg-white/10"
                  style={{
                    minWidth: "220px",
                    justifyContent: fabState.position === "bottom-left" ? "flex-start" : "flex-end",
                    flexDirection: fabState.position === "bottom-left" ? "row" : "row-reverse",
                  }}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  whileHover={{ scale: 1.05, x: fabState.position === "bottom-left" ? 5 : -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      background: `${item.color}20`,
                      border: `1px solid ${item.color}40`,
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: item.color }} />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {item.label}
                  </span>
                  {item.badge && <span className="text-xs text-emerald-300">{item.badge}</span>}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={toggleFAB}
        className="flex h-16 w-16 items-center justify-center rounded-full shadow-lg"
        style={{
          background: "linear-gradient(135deg, rgba(45, 212, 191, 0.9) 0%, rgba(20, 184, 166, 0.9) 100%)",
          boxShadow: fabState.isOpen
            ? "0 8px 32px rgba(45, 212, 191, 0.4)"
            : "0 4px 20px rgba(45, 212, 191, 0.3)",
        }}
        animate={{ rotate: fabState.isOpen ? 45 : 0, scale: fabState.isOpen ? 1.1 : 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title={fabState.isOpen ? "إغلاق القائمة" : "فتح القائمة"}
      >
        <AnimatePresence mode="wait">
          {fabState.isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-7 w-7 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sparkles className="h-7 w-7 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};
