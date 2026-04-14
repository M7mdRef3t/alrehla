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
import { useLayoutState } from '@/modules/map/dawayirIndex';
import { TEIWidget } from "./TEIWidget";
import { DailyPulseWidget } from "./DailyPulseWidget";
import { WeeklyEnergyWrapWidget } from '@/modules/action/WeeklyEnergyWrapWidget';
import { StagnationAlertWidget } from "./StagnationAlertWidget";
import { useMapState } from '@/modules/map/dawayirIndex';
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

export const InsightsSidebar: FC<InsightsSidebarProps> = ({ onOpenArchive: _onOpenArchive }) => {
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
    [isRight ? "right" : "left"]: 0,
    height: "100dvh",
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
        className="bg-slate-950/90 backdrop-blur-2xl overflow-y-auto border-x border-purple-500/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] no-scrollbar relative"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.05),transparent)] pointer-events-none" />
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-white/5 bg-slate-950/40 backdrop-blur-xl"
        >
          <h2
            className="text-lg font-black tracking-tight text-slate-100"
          >
            📊 التحليل والإحصائيات
          </h2>
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all active:scale-90"
            title="إخفاء"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* TEI Widget */}
          {activeNodes.length > 0 && (
            <div className="space-y-3">
              <h3
                className="text-[10px] font-black uppercase tracking-[0.25em] px-1 text-right text-purple-400/60"
              >
                مؤشر الوضوح العاطفي
              </h3>
              <TEIWidget />
            </div>
          )}

          {/* Stagnation Alerts */}
          <StagnationAlertWidget />

          {/* Sidebar */}
          <div>
            <h3
               className="text-[10px] font-black uppercase tracking-[0.2em] px-1 mb-2 text-right text-white/40"
            >
              ملخص النزيف الأسبوعي
            </h3>
            <WeeklyEnergyWrapWidget />
          </div>

          {/* Daily Pulse */}
          <div>
            <h3
               className="text-[10px] font-black uppercase tracking-[0.2em] px-1 mb-2 text-right text-white/40"
            >
              النبضة التكتيكية
            </h3>
            <DailyPulseWidget />
          </div>

          {/* Dashboard Stats */}
          {activeNodes.length > 0 && (
            <div
              className="rounded-3xl p-6 space-y-4 text-right bg-white/[0.02] border border-white/5 backdrop-blur-md relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3
                className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 relative z-10"
              >
                توازن الدواير
              </h3>

              {/* Mini Gauge */}
              <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-white/5 relative z-10">
                {["green", "yellow", "red"].map((ring) => {
                  const count = activeNodes.filter((n) => n.ring === ring).length;
                  if (!count) return null;
                  const colors = {
                    green: "#10b981", // Emerald-500
                    yellow: "#f59e0b", // Amber-500
                    red: "#ef4444"    // Red-500
                  };
                  return (
                    <div
                      key={ring}
                      className="transition-all duration-1000 ease-out"
                      style={{
                        width: `${(count / activeNodes.length) * 100}%`,
                        background: colors[ring as keyof typeof colors],
                        boxShadow: `0 0 10px ${colors[ring as keyof typeof colors]}40`
                      }}
                    />
                  );
                })}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 text-center relative z-10">
                {["green", "yellow", "red"].map((ring) => {
                  const count = activeNodes.filter((n) => n.ring === ring).length;
                  const colors = {
                    green: "#10b981",
                    yellow: "#f59e0b",
                    red: "#ef4444"
                  };
                  const labels = { green: "آمن", yellow: "تعب", red: "ضاغط" };
                  return (
                    <div
                      key={ring}
                      className="px-2 py-3 rounded-2xl transition-all"
                      style={{
                        background: `${colors[ring as keyof typeof colors]}08`,
                        border: `1px solid ${colors[ring as keyof typeof colors]}20`
                      }}
                    >
                      <div
                        className="text-2xl font-black mb-1"
                        style={{ color: colors[ring as keyof typeof colors] }}
                      >
                        {count}
                      </div>
                      <div
                        className="text-[9px] font-bold uppercase tracking-wider"
                        style={{ color: colors[ring as keyof typeof colors] }}
                      >
                        {labels[ring as keyof typeof labels]}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="pt-4 border-t border-white/5 space-y-2 relative z-10">
                <div className="flex justify-between items-center text-xs">
                   <span className="font-bold text-slate-200">{activeNodes.length}</span>
                   <span className="text-slate-500">إجمالي الدوائر</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                   <span className="font-bold text-emerald-400">{greenNodes.length}</span>
                   <span className="text-slate-500">دوائر آمنة</span>
                </div>
                {archivedNodes.length > 0 && (
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-500">{archivedNodes.length}</span>
                    <span className="text-slate-600">في الأرشيف</span>
                  </div>
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
            className="fixed top-1/2 -translate-y-1/2 z-30 p-4 rounded-3xl bg-slate-950/80 border border-purple-500/30 backdrop-blur-2xl shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:bg-slate-900 transition-all active:scale-90"
            style={{
              [isRight ? "right" : "left"]: "1.5rem"
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1, boxShadow: "0 0 50px rgba(168,85,247,0.25)" }}
            whileTap={{ scale: 0.95 }}
            title="فتح الإحصائيات"
          >
            {isRight ? (
              <ChevronLeft className="w-5 h-5 text-purple-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-purple-400" />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};


