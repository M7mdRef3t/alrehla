/**
 * ════════════════════════════════════════════════════════════════════════════
 * 📊 INSIGHTS SIDEBAR — الشريط الجانبي للإحصائيات
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Sidebar قابل للطي يحتوي على:
 * - TEI Widget (مؤشر الوضوح)
 * - Daily Pulse (سؤال اليوم)
 * - Dashboard Stats (إحصائيات الدوائر)
 * - Shadow Pulse Alerts (تنبيهات السلوك الخفي)
 */

import type { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { useLayoutState } from "../state/layoutState";
import { TEIWidget } from "./TEIWidget";
import { DailyPulseWidget } from "./DailyPulseWidget";
import { useMapState } from "../state/mapState";
import { useMemo } from "react";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TYPES
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface InsightsSidebarProps {
  onOpenArchive: () => void;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const InsightsSidebar: FC<InsightsSidebarProps> = ({ onOpenArchive }) => {
  const sidebarExpanded = useLayoutState((s) => s.sidebarExpanded);
  const sidebarPosition = useLayoutState((s) => s.sidebarPosition);
  const toggleSidebar = useLayoutState((s) => s.toggleSidebar);

  const nodes = useMapState((s) => s.nodes);
  const activeNodes = useMemo(() => nodes.filter((n) => !n.isNodeArchived), [nodes]);
  const archivedNodes = useMemo(() => nodes.filter((n) => n.isNodeArchived), [nodes]);
  const greenNodes = useMemo(
    () => activeNodes.filter((n) => n.ring === "green" && !n.isDetached),
    [activeNodes]
  );

  // ─── Position & Width ─────────────────────────────────────────────────────
  const isRight = sidebarPosition === "right";
  const sidebarWidth = 380;

  const sidebarStyles = {
    position: "fixed" as const,
    top: 0,
    [isRight ? "right" : "left"]: 0,
    height: "100vh",
    width: `${sidebarWidth}px`,
    zIndex: 40
  };

  const translateX = sidebarExpanded
    ? 0
    : isRight
    ? sidebarWidth
    : -sidebarWidth;

  // ─── Render ───────────────────────────────────────────────────────────────
  if (sidebarPosition === "hidden") return null;

  return (
    <>
      {/* Backdrop (عند الفتح على الموبايل) */}
      <AnimatePresence>
        {sidebarExpanded && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        style={sidebarStyles}
        animate={{ x: translateX }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="glass-card overflow-y-auto"
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between p-4 border-b"
          style={{
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(16px)",
            borderColor: "rgba(255, 255, 255, 0.1)"
          }}
        >
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            📊 التحليل والإحصائيات
          </h2>
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-secondary)" }}
            title="إخفاء"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* TEI Widget */}
          {activeNodes.length > 0 && (
            <div>
              <h3
                className="text-xs font-semibold mb-2 text-right"
                style={{ color: "var(--text-muted)" }}
              >
                مؤشر الوضوح العاطفي
              </h3>
              <TEIWidget />
            </div>
          )}

          {/* Daily Pulse */}
          <div>
            <h3
              className="text-xs font-semibold mb-2 text-right"
              style={{ color: "var(--text-muted)" }}
            >
              سؤال اليوم
            </h3>
            <DailyPulseWidget onOpenArchive={onOpenArchive} />
          </div>

          {/* Dashboard Stats */}
          {activeNodes.length > 0 && (
            <div
              className="rounded-xl p-4 space-y-4 text-right"
              style={{
                background: "rgba(15,23,42,0.5)",
                border: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(12px)"
              }}
            >
              <h3
                className="text-xs font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                توازن الدواير
              </h3>

              {/* Mini Gauge */}
              <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
                {["green", "yellow", "red"].map((ring) => {
                  const count = activeNodes.filter((n) => n.ring === ring).length;
                  if (!count) return null;
                  const colors = {
                    green: "#34d399",
                    yellow: "#fbbf24",
                    red: "#f87171"
                  };
                  return (
                    <div
                      key={ring}
                      className="transition-all duration-700"
                      style={{
                        width: `${(count / activeNodes.length) * 100}%`,
                        background: colors[ring as keyof typeof colors]
                      }}
                    />
                  );
                })}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {["green", "yellow", "red"].map((ring) => {
                  const count = activeNodes.filter((n) => n.ring === ring).length;
                  const colors = {
                    green: "#34d399",
                    yellow: "#fbbf24",
                    red: "#f87171"
                  };
                  const labels = { green: "آمن", yellow: "تعب", red: "ضاغط" };
                  return (
                    <div
                      key={ring}
                      className="px-3 py-2 rounded-lg"
                      style={{
                        background: `${colors[ring as keyof typeof colors]}15`,
                        border: `1px solid ${colors[ring as keyof typeof colors]}30`
                      }}
                    >
                      <div
                        className="text-2xl font-bold"
                        style={{ color: colors[ring as keyof typeof colors] }}
                      >
                        {count}
                      </div>
                      <div
                        className="text-[10px]"
                        style={{ color: colors[ring as keyof typeof colors] }}
                      >
                        {labels[ring as keyof typeof labels]}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="pt-2 border-t border-white/10 space-y-1">
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  إجمالي الدوائر: <span className="font-bold">{activeNodes.length}</span>
                </p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  دوائر آمنة: <span className="font-bold">{greenNodes.length}</span>
                </p>
                {archivedNodes.length > 0 && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    في الأرشيف: <span className="font-bold">{archivedNodes.length}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {activeNodes.length === 0 && (
            <div
              className="text-center py-8 px-4 rounded-xl"
              style={{
                border: "1px dashed rgba(255,255,255,0.1)",
                color: "var(--text-muted)"
              }}
            >
              <p className="text-sm mb-2">لا توجد دوائر بعد</p>
              <p className="text-xs">ابدأ برسم أول علاقة لرؤية الإحصائيات</p>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Toggle Button (عند الإخفاء) */}
      <AnimatePresence>
        {!sidebarExpanded && (
          <motion.button
            type="button"
            onClick={toggleSidebar}
            className="fixed top-1/2 -translate-y-1/2 z-30 p-3 rounded-full glass-card hover:bg-white/10 transition-colors"
            style={{
              [isRight ? "right" : "left"]: "1rem"
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title="فتح الإحصائيات"
          >
            {isRight ? (
              <ChevronLeft className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
            ) : (
              <ChevronRight className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};
