import type { FC } from "react";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { useMapState } from "../state/mapState";
import type { Ring } from "../modules/map/mapTypes";

/* ══════════════════════════════════════════
   RELATIONSHIP PULSE — نبض العلاقات
   Summary of recent relationship movements
   across ALL people — "مين اتحرك مؤخراً؟"
   ══════════════════════════════════════════ */

const RING_COLORS: Record<Ring, string> = {
  green: "#34d399",
  yellow: "#fbbf24",
  red: "#f87171",
};

const RING_LABELS: Record<Ring, string> = {
  green: "آمن",
  yellow: "مختلط",
  red: "مُرهق",
};

interface MovementEvent {
  nodeId: string;
  label: string;
  fromRing: Ring;
  toRing: Ring;
  timestamp: number;
  direction: "up" | "down" | "neutral";
}

function getDirection(from: Ring, to: Ring): "up" | "down" | "neutral" {
  const RING_ORDER: Record<Ring, number> = { green: 0, yellow: 1, red: 2 };
  const diff = RING_ORDER[to] - RING_ORDER[from];
  if (diff > 0) return "down"; // moved toward red = worsening
  if (diff < 0) return "up";   // moved toward green = improving
  return "neutral";
}

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

export const RelationshipPulse: FC = () => {
  const nodes = useMapState((s) => s.nodes);
  const [expanded, setExpanded] = useState(false);

  const { movements, summary } = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const mvts: MovementEvent[] = [];

    for (const node of nodes) {
      if (node.isNodeArchived) continue;
      const history = node.orbitHistory ?? [];

      for (const entry of history) {
        if (
          entry.type === "ring_changed" &&
          entry.fromRing &&
          entry.timestamp > thirtyDaysAgo
        ) {
          mvts.push({
            nodeId: node.id,
            label: node.label,
            fromRing: entry.fromRing,
            toRing: entry.ring,
            timestamp: entry.timestamp,
            direction: getDirection(entry.fromRing, entry.ring),
          });
        }
      }
    }

    mvts.sort((a, b) => b.timestamp - a.timestamp);

    const sm = {
      total: mvts.length,
      toRed: mvts.filter((m) => m.toRing === "red").length,
      toGreen: mvts.filter((m) => m.toRing === "green").length,
      toYellow: mvts.filter((m) => m.toRing === "yellow").length,
    };

    return { movements: mvts, summary: sm };
  }, [nodes]);

  if (movements.length === 0) return null;

  const DirectionIcon = ({ dir }: { dir: "up" | "down" | "neutral" }) => {
    if (dir === "down") return <TrendingDown className="w-3 h-3 text-rose-400" />;
    if (dir === "up") return <TrendingUp className="w-3 h-3 text-emerald-400" />;
    return <Minus className="w-3 h-3 text-white/30" />;
  };

  return (
    <motion.div
      className="rounded-2xl border border-white/8 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,27,75,0.9))",
        backdropFilter: "blur(12px)",
      }}
      dir="rtl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Compact header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs">💫</span>
          <span className="text-xs font-bold text-white/80">نبض العلاقات</span>
          <span className="text-[10px] text-white/30">آخر 30 يوم</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Mini badges */}
          {summary.toRed > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>
              {summary.toRed} 🔴
            </span>
          )}
          {summary.toGreen > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>
              {summary.toGreen} 🟢
            </span>
          )}
          {summary.toYellow > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
              {summary.toYellow} 🟡
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-white/30" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-white/30" />
          )}
        </div>
      </button>

      {/* Expanded list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {movements.slice(0, 8).map((mvt, i) => (
                <motion.div
                  key={`${mvt.nodeId}-${mvt.timestamp}`}
                  className="flex items-center gap-3 py-1.5"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <DirectionIcon dir={mvt.direction} />

                  <span className="text-xs font-semibold text-white/80 min-w-[60px] truncate">
                    {mvt.label}
                  </span>

                  <div className="flex items-center gap-1 text-[10px]">
                    <span
                      className="px-1.5 py-0.5 rounded"
                      style={{
                        background: `${RING_COLORS[mvt.fromRing]}20`,
                        color: RING_COLORS[mvt.fromRing],
                      }}
                    >
                      {RING_LABELS[mvt.fromRing]}
                    </span>
                    <span className="text-white/20">→</span>
                    <span
                      className="px-1.5 py-0.5 rounded font-bold"
                      style={{
                        background: `${RING_COLORS[mvt.toRing]}20`,
                        color: RING_COLORS[mvt.toRing],
                      }}
                    >
                      {RING_LABELS[mvt.toRing]}
                    </span>
                  </div>

                  <span className="text-[10px] text-white/20 mr-auto font-mono">
                    {formatRelativeTime(mvt.timestamp)}
                  </span>
                </motion.div>
              ))}

              {movements.length > 8 && (
                <p className="text-[10px] text-white/20 text-center pt-1">
                  +{movements.length - 8} حركة أخرى
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
