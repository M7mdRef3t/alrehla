import type { FC } from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import type { OrbitHistoryEntry, Ring } from "../map/mapTypes";

/* ══════════════════════════════════════════
   ORBIT TIMELINE — تاريخ حركة العلاقة
   Mini visual showing how this person moved
   between circles over time
   ══════════════════════════════════════════ */

const RING_COLORS: Record<Ring, string> = {
  green: "#34d399",
  yellow: "#fbbf24",
  red: "#f87171",
};

const RING_BG: Record<Ring, string> = {
  green: "rgba(52,211,153,0.15)",
  yellow: "rgba(251,191,36,0.15)",
  red: "rgba(248,113,113,0.15)",
};

const RING_LABELS: Record<Ring, string> = {
  green: "آمن",
  yellow: "مختلط",
  red: "مُرهق",
};

const EVENT_ICONS: Record<OrbitHistoryEntry["type"], string> = {
  created: "✦",
  ring_changed: "↻",
  archived: "📦",
  restored: "↩",
};

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `${mins} د`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} س`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} يوم`;
  const months = Math.floor(days / 30);
  return `${months} شهر`;
}

interface OrbitTimelineProps {
  history: OrbitHistoryEntry[];
  personLabel?: string;
  compact?: boolean;
}

export const OrbitTimeline: FC<OrbitTimelineProps> = ({
  history,
  personLabel,
  compact = false,
}) => {
  const sorted = useMemo(
    () => [...history].sort((a, b) => a.timestamp - b.timestamp),
    [history]
  );

  if (sorted.length === 0) return null;

  const hasMovements = sorted.some((e) => e.type === "ring_changed");

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <span className="text-xs">📊</span>
          </div>
          <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">
            {personLabel ? `تاريخ مدار ${personLabel}` : "تاريخ المدار"}
          </h4>
        </div>
        {hasMovements && (
          <span className="text-[10px] text-white/30 font-mono">
            {sorted.length} حدث
          </span>
        )}
      </div>

      {/* Timeline dots */}
      <div className="relative">
        {/* Connection line */}
        <div className="absolute top-3 right-3 left-3 h-px bg-white/10" />

        <div className={`flex ${compact ? "gap-1" : "gap-2"} overflow-x-auto pb-1 custom-scrollbar`}>
          {sorted.map((entry, i) => {
            const color = RING_COLORS[entry.ring];
            const bg = RING_BG[entry.ring];
            const isLast = i === sorted.length - 1;

            return (
              <motion.div
                key={entry.id}
                className="flex flex-col items-center shrink-0"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                {/* Dot */}
                <div
                  className={`relative w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                    isLast ? "ring-2 ring-offset-1 ring-offset-slate-900" : ""
                  }`}
                  style={{
                    background: bg,
                    color,
                    ...(isLast ? { ringColor: color } : {}),
                    border: `1.5px solid ${color}`,
                  }}
                  title={`${EVENT_ICONS[entry.type]} ${RING_LABELS[entry.ring]} — ${formatRelativeTime(entry.timestamp)}`}
                >
                  {EVENT_ICONS[entry.type]}
                </div>

                {/* Label */}
                {!compact && (
                  <span
                    className="text-[9px] mt-1 font-medium"
                    style={{ color }}
                  >
                    {formatRelativeTime(entry.timestamp)}
                  </span>
                )}

                {/* Arrow between dots */}
                {entry.type === "ring_changed" && entry.fromRing && !compact && (
                  <span className="text-[8px] text-white/30 mt-0.5">
                    {RING_LABELS[entry.fromRing]} → {RING_LABELS[entry.ring]}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {!compact && hasMovements && (
        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-white/30">
            {sorted.filter((e) => e.type === "ring_changed").length} تغيير مدار
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: RING_BG[sorted[sorted.length - 1].ring],
              color: RING_COLORS[sorted[sorted.length - 1].ring],
            }}
          >
            حالياً: {RING_LABELS[sorted[sorted.length - 1].ring]}
          </span>
        </div>
      )}
    </div>
  );
};
