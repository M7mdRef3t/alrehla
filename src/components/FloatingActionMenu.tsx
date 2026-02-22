/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🎯 FLOATING ACTION MENU — القائمة العائمة الذكية
 * ════════════════════════════════════════════════════════════════════════════
 *
 * قائمة عائمة تجمع كل الأدوات الرئيسية:
 * - إضافة شخص
 * - مهندس الوعي (Gemini Live)
 * - الإحصائيات
 * - الإعدادات
 */

import type { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MessageSquare,
  BarChart3,
  Settings,
  X,
  Sparkles
} from "lucide-react";
import { useLayoutState } from "../state/layoutState";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TYPES
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface FloatingActionMenuProps {
  onAddPerson: () => void;
  onOpenInsights: () => void;
  onOpenSettings: () => void;
  onToggleAI: () => void;
  isAIConnected?: boolean;
  showAIOption?: boolean;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const FloatingActionMenu: FC<FloatingActionMenuProps> = ({
  onAddPerson,
  onOpenInsights,
  onOpenSettings,
  onToggleAI,
  isAIConnected = false,
  showAIOption = true
}) => {
  const fabState = useLayoutState((s) => s.fabState);
  const toggleFAB = useLayoutState((s) => s.toggleFAB);

  // ─── Menu Items ───────────────────────────────────────────────────────────
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
      show: true
    },
    {
      id: "ai-conversation",
      icon: MessageSquare,
      label: isAIConnected ? "مهندس الوعي (متصل)" : "مهندس الوعي",
      color: isAIConnected ? "var(--ring-safe)" : "rgba(167, 139, 250, 0.9)",
      onClick: () => {
        onToggleAI();
        toggleFAB();
      },
      show: showAIOption,
      badge: isAIConnected ? "🟢" : null
    },
    {
      id: "insights",
      icon: BarChart3,
      label: "الإحصائيات والتحليل",
      color: "rgba(251, 191, 36, 0.9)",
      onClick: () => {
        onOpenInsights();
        toggleFAB();
      },
      show: true
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
      show: true
    }
  ].filter((item) => item.show);

  // ─── Position Styles ──────────────────────────────────────────────────────
  const positionStyles =
    fabState.position === "bottom-left"
      ? { bottom: "1.5rem", left: "1.5rem" }
      : { bottom: "1.5rem", right: "1.5rem" };

  // ─── Animations ───────────────────────────────────────────────────────────
  const buttonVariants = {
    closed: { rotate: 0, scale: 1 },
    open: { rotate: 45, scale: 1.1 }
  };

  const menuVariants = {
    closed: {
      opacity: 0,
      scale: 0.8,
      y: 20
    },
    open: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 25,
        staggerChildren: 0.07,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    closed: { opacity: 0, y: 20, scale: 0.8 },
    open: { opacity: 1, y: 0, scale: 1 }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed z-50"
      style={positionStyles}
    >
      {/* Menu Items */}
      <AnimatePresence>
        {fabState.isOpen && (
          <motion.div
            className="absolute bottom-20 space-y-3"
            style={
              fabState.position === "bottom-left"
                ? { left: 0 }
                : { right: 0 }
            }
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className="flex items-center gap-3 px-4 py-3 rounded-full glass-card hover:bg-white/10 transition-all group"
                  style={{
                    minWidth: "200px",
                    justifyContent:
                      fabState.position === "bottom-left"
                        ? "flex-start"
                        : "flex-end",
                    flexDirection:
                      fabState.position === "bottom-left"
                        ? "row"
                        : "row-reverse"
                  }}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, x: fabState.position === "bottom-left" ? 5 : -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: `${item.color}20`,
                      border: `1px solid ${item.color}40`
                    }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: item.color }}
                    />
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="text-xs">{item.badge}</span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.button
        type="button"
        onClick={toggleFAB}
        className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
        style={{
          background: "linear-gradient(135deg, rgba(45, 212, 191, 0.9) 0%, rgba(20, 184, 166, 0.9) 100%)",
          boxShadow: fabState.isOpen
            ? "0 8px 32px rgba(45, 212, 191, 0.4)"
            : "0 4px 20px rgba(45, 212, 191, 0.3)"
        }}
        variants={buttonVariants}
        animate={fabState.isOpen ? "open" : "closed"}
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
              <X className="w-7 h-7 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sparkles className="w-7 h-7 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Backdrop (عند الفتح) */}
      <AnimatePresence>
        {fabState.isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleFAB}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
