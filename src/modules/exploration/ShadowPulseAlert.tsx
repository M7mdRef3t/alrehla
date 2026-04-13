import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, X } from "lucide-react";
import { useShadowPulseState } from "@/domains/consciousness/store/shadowPulse.store";
import { useMapState } from '@/modules/map/dawayirIndex';
import { getShadowMessage, getShadowLevel } from "@/utils/shadowPulseEngine";

const DISMISSED_KEY = "dawayir-shadow-dismissed";

function getDismissedIds(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addDismissedId(nodeId: string) {
  try {
    const ids = getDismissedIds();
    if (!ids.includes(nodeId)) {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids, nodeId]));
    }
  } catch {
    // ignore
  }
}

interface ShadowPulseAlertProps {
  onSelectNode?: (id: string) => void;
}

export const ShadowPulseAlert: FC<ShadowPulseAlertProps> = ({ onSelectNode }) => {
  const getHighShadowNodes = useShadowPulseState((s) => s.getHighShadowNodes);
  const hydrate = useShadowPulseState((s) => s.hydrate);
  const nodes = useMapState((s) => s.nodes);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    hydrate();
    setDismissed(getDismissedIds());
  }, [hydrate]);

  // أظهر التنبيه بعد ثانيتين من الدخول
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const highShadowNodes = getHighShadowNodes(35);
  const activeNodes = nodes.filter((n) => !n.isNodeArchived);

  // أول شخص له score عالي ولم يُرفض تنبيهه
  const target = highShadowNodes.find(
    (s) => !dismissed.includes(s.nodeId) && activeNodes.some((n) => n.id === s.nodeId)
  );

  if (!target || !visible) return null;

  const node = activeNodes.find((n) => n.id === target.nodeId);
  if (!node) return null;

  const level = getShadowLevel(target.score);
  if (level === "none" || level === "low") return null;

  const message = getShadowMessage(target, node);

  const levelColors = {
    medium: { accent: "#fbbf24", bg: "rgba(251,191,36,0.07)", border: "rgba(251,191,36,0.2)" },
    high: { accent: "#f87171", bg: "rgba(248,113,113,0.07)", border: "rgba(248,113,113,0.2)" },
  };
  const colors = level === "high" ? levelColors.high : levelColors.medium;

  const handleDismiss = () => {
    addDismissedId(target.nodeId);
    setDismissed((prev) => [...prev, target.nodeId]);
  };

  const handleOpen = () => {
    onSelectNode?.(target.nodeId);
    handleDismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        key={target.nodeId}
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.96 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-40 text-right"
        role="alert"
        aria-live="polite"
      >
        <div
          className="cosmic-shimmer rounded-2xl p-4 shadow-xl"
          style={{
            background: `linear-gradient(135deg, ${colors.bg}, rgba(15,23,42,0.95))`,
            border: `1px solid ${colors.border}`,
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={handleDismiss}
              className="organic-tap shrink-0 mt-0.5 rounded-full p-1 hover:bg-white/5 transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-3.5 h-3.5" style={{ color: "rgba(148,163,184,0.6)" }} />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5 justify-end">
                <span
                  className="text-[10px] font-bold tracking-wide"
                  style={{ color: colors.accent }}
                >
                  نبضة الظل
                </span>
                <Eye className="w-3 h-3" style={{ color: colors.accent }} />
              </div>

              <p className="text-[13px] leading-[1.7]" style={{ color: "rgba(226,232,240,0.85)" }}>
                {message}
              </p>

              {onSelectNode && (
                <button
                  type="button"
                  onClick={handleOpen}
                  className="organic-tap mt-2.5 text-[12px] font-semibold transition-colors"
                  style={{ color: colors.accent }}
                >
                  افتح الدايرة ←
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};


