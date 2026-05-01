/**
 * ════════════════════════════════════════════════════════════════════════════
 * 🎛️ LAYOUT MODE SWITCHER — مبدل الأوضاع
 * ════════════════════════════════════════════════════════════════════════════
 *
 * قائمة تخلي المستخدم يختار وضع التخطيط:
 * - Focus (التركيز على الخريطة)
 * - Insights (الشريط الجانبي للإحصائيات)
 * - Conversation (التبويبات للحوار)
 * - Adaptive (ذكي تلقائي)
 */

import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, X, Zap as Sparkles, Check } from "lucide-react";
import { useLayoutState, type LayoutMode } from '@/modules/map/dawayirIndex';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const LayoutModeSwitcher: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const mode = useLayoutState((s) => s.mode);
  const setMode = useLayoutState((s) => s.setMode);
  const setUserPreference = useLayoutState((s) => s.setUserPreference);
  const clearUserPreference = useLayoutState((s) => s.clearUserPreference);
  const userPreferredMode = useLayoutState((s) => s.userPreferredMode);

  // ─── Mode Options ─────────────────────────────────────────────────────────
  const modes: Array<{
    id: LayoutMode;
    label: string;
    description: string;
    icon: string;
  }> = [
    {
      id: "focus",
      label: "وضع التركيز",
      description: "الخريطة فقط + قائمة عائمة",
      icon: "🎯"
    },
    {
      id: "insights",
      label: "وضع التحليل",
      description: "شريط جانبي للإحصائيات",
      icon: "📊"
    },
    {
      id: "conversation",
      label: "وضع الحوار",
      description: "تبويبات للحوار مع الذكاء الاصطناعي",
      icon: "💬"
    },
    {
      id: "adaptive",
      label: "وضع ذكي",
      description: "النظام يختار الأنسب تلقائياً",
      icon: "✨"
    }
  ];

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleSelectMode = (modeId: LayoutMode) => {
    setMode(modeId);
    if (modeId === "adaptive") {
      clearUserPreference();
    } else {
      setUserPreference(modeId);
    }
    setIsOpen(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed top-[calc(env(safe-area-inset-top)+5rem)] md:top-20 left-4 z-50 p-3 rounded-full glass-card hover:bg-white/10 transition-all group"
        style={{
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
        }}
        title="تغيير وضع العرض"
      >
        <Layers className="w-5 h-5" style={{ color: "var(--text-primary)" }} />

        {/* Active Mode Badge */}
        {userPreferredMode && userPreferredMode !== "adaptive" && (
          <span
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
            style={{
              background: "var(--ring-safe)",
              boxShadow: "0 0 8px var(--ring-safe-glow)"
            }}
          />
        )}
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-md glass-card p-6 text-right"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className="text-lg font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    اختر وضع العرض
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p
                  className="text-sm mb-6"
                  style={{ color: "var(--text-secondary)" }}
                >
                  اختار الوضع اللي يناسب طريقتك في الاستخدام، أو خلي النظام يختار تلقائياً
                </p>

                {/* Mode Options */}
                <div className="space-y-3">
                  {modes.map((modeOption) => {
                    const isActive = mode === modeOption.id;
                    const isPreferred = userPreferredMode === modeOption.id;

                    return (
                      <button
                        key={modeOption.id}
                        type="button"
                        onClick={() => handleSelectMode(modeOption.id)}
                        className="w-full flex items-start gap-3 p-4 rounded-xl text-right transition-all hover:bg-white/5"
                        style={{
                          background: isActive
                            ? "rgba(45, 212, 191, 0.1)"
                            : "rgba(255, 255, 255, 0.02)",
                          border: isActive
                            ? "1px solid rgba(45, 212, 191, 0.3)"
                            : "1px solid rgba(255, 255, 255, 0.08)"
                        }}
                      >
                        {/* Icon */}
                        <span className="text-2xl shrink-0">
                          {modeOption.icon}
                        </span>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3
                              className="text-sm font-bold"
                              style={{
                                color: isActive
                                  ? "var(--ring-safe)"
                                  : "var(--text-primary)"
                              }}
                            >
                              {modeOption.label}
                            </h3>
                            {isActive && (
                              <Check
                                className="w-5 h-5"
                                style={{ color: "var(--ring-safe)" }}
                              />
                            )}
                          </div>
                          <p
                            className="text-xs leading-relaxed"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {modeOption.description}
                          </p>

                          {/* Preferred Badge */}
                          {isPreferred && modeOption.id !== "adaptive" && (
                            <span
                              className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{
                                background: "rgba(45, 212, 191, 0.15)",
                                color: "var(--ring-safe)"
                              }}
                            >
                              ✓ تفضيلك المحفوظ
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Hint */}
                <div
                  className="mt-6 p-3 rounded-lg flex items-start gap-2"
                  style={{
                    background: "rgba(167, 139, 250, 0.1)",
                    border: "1px solid rgba(167, 139, 250, 0.2)"
                  }}
                >
                  <Sparkles
                    className="w-4 h-4 shrink-0 mt-0.5"
                    style={{ color: "rgba(167, 139, 250, 0.9)" }}
                  />
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "rgba(167, 139, 250, 0.9)" }}
                  >
                    <strong>نصيحة:</strong> الوضع الذكي بيختار الأنسب ليك حسب الوقت
                    والسلوك ومستوى الوضوح العاطفي
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};


