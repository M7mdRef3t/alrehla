import type { FC } from "react";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, TrendingDown, TrendingUp, Battery, BatteryLow, BatteryFull } from "lucide-react";
import { useMeState } from '@/modules/map/dawayirIndex';
import { useMapState } from '@/modules/map/dawayirIndex';

interface BatteryStateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BatteryStateModal: FC<BatteryStateModalProps> = ({ isOpen, onClose }) => {
  const battery = useMeState((s) => s.battery);
  const rawNodes = useMapState((s) => s.nodes);

  const nodes = useMemo(() => 
    rawNodes.filter(n => !n.isNodeArchived && !n.isDetached),
    [rawNodes]
  );

  const stats = useMemo(() => {
    let chargers = 0;
    let drainers = 0;
    let neutrals = 0;
    let totalNet = 0;

    for (const n of nodes) {
      const net = n.energyBalance?.netEnergy ?? 0;
      totalNet += net;
      if (net > 0) chargers++;
      else if (net < 0) drainers++;
      else neutrals++;
    }

    return { chargers, drainers, neutrals, totalNet, total: nodes.length };
  }, [nodes]);

  const batteryConfig = {
    drained: {
      label: "مستنزف",
      color: "#94a3b8",
      glowColor: "rgba(148,163,184,0.3)",
      bg: "linear-gradient(135deg,rgba(30,41,59,0.95),rgba(15,23,42,0.98))",
      border: "rgba(148,163,184,0.2)",
      icon: <BatteryLow className="w-5 h-5" />,
      message: "بطاريتك تحتاج شحن. خفّف التواصل مع المستنزفين وأعطِ نفسك وقت.",
      pct: 20,
    },
    okay: {
      label: "متوازن",
      color: "#2dd4bf",
      glowColor: "rgba(45,212,191,0.35)",
      bg: "linear-gradient(135deg,rgba(5,20,20,0.95),rgba(15,23,42,0.98))",
      border: "rgba(45,212,191,0.2)",
      icon: <Battery className="w-5 h-5" />,
      message: "طاقتك في حالة جيدة. استمر في بناء علاقاتك بوعي.",
      pct: 60,
    },
    charged: {
      label: "مشحون",
      color: "#5eead4",
      glowColor: "rgba(94,234,212,0.5)",
      bg: "linear-gradient(135deg,rgba(2,44,34,0.95),rgba(15,23,42,0.98))",
      border: "rgba(94,234,212,0.25)",
      icon: <BatteryFull className="w-5 h-5" />,
      message: "طاقتك في ذروتها! هذا هو المدى الذي تريده الملاذ دائماً.",
      pct: 100,
    },
  };

  const cfg = batteryConfig[battery] ?? batteryConfig.okay;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ background: "rgba(3,7,18,0.8)", backdropFilter: "blur(24px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-sm rounded-3xl px-6 py-7 overflow-hidden"
            style={{
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              boxShadow: `0 40px 100px rgba(0,0,0,0.85), 0 0 80px ${cfg.glowColor}`,
            }}
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient glow */}
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                background: `radial-gradient(circle at 50% 30%, ${cfg.color} 0%, transparent 65%)`,
                filter: "blur(30px)",
              }}
            />

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
              style={{ color: "rgba(148,163,184,0.6)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="text-center mb-6 relative z-10">
              {/* Animated orb */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  {[0, 0.8, 1.6].map((delay, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        inset: -8 - i * 8,
                        border: `1px solid ${cfg.color}`,
                        opacity: 0,
                      }}
                      animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.2, 1.5] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay, ease: "easeOut" }}
                    />
                  ))}
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center relative z-10"
                    style={{
                      background: `radial-gradient(circle, ${cfg.color}30 0%, transparent 70%)`,
                      border: `2px solid ${cfg.color}60`,
                      boxShadow: `0 0 30px ${cfg.glowColor}`,
                    }}
                  >
                    <span style={{ color: cfg.color }}>{cfg.icon}</span>
                  </div>
                </div>
              </div>

              <h2 className="text-lg font-black mb-1" style={{ color: "var(--text-primary)" }}>
                حالة البطارية
              </h2>
              <span
                className="text-sm font-bold px-3 py-1 rounded-full"
                style={{ background: `${cfg.color}18`, color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>

            {/* Battery bar */}
            <div className="mb-6 relative z-10">
              <div
                className="w-full h-3 rounded-full overflow-hidden mb-2"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${cfg.color}80, ${cfg.color})`,
                    boxShadow: `0 0 8px ${cfg.glowColor}`,
                  }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${cfg.pct}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                />
              </div>
              <p className="text-xs text-center" style={{ color: "rgba(148,163,184,0.5)" }}>
                {cfg.pct}% طاقة
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2 mb-5 relative z-10">
              {[
                { label: "شواحن", value: stats.chargers, color: "#2dd4bf", icon: <TrendingUp className="w-3.5 h-3.5" /> },
                { label: "محايدون", value: stats.neutrals, color: "#94a3b8", icon: <Zap className="w-3.5 h-3.5" /> },
                { label: "مستنزفون", value: stats.drainers, color: "#f43f5e", icon: <TrendingDown className="w-3.5 h-3.5" /> },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl p-3 text-center"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${s.color}20`,
                  }}
                >
                  <div className="flex justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
                  <div className="text-lg font-black tabular-nums" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[10px]" style={{ color: "rgba(148,163,184,0.5)" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Net energy */}
            <div
              className="rounded-2xl p-3 mb-5 flex items-center justify-between relative z-10"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-sm" style={{ color: "rgba(148,163,184,0.7)" }}>صافي الطاقة الكلي</span>
              <span
                className="text-xl font-black tabular-nums"
                style={{
                  color: stats.totalNet > 0 ? "#2dd4bf" : stats.totalNet < 0 ? "#f43f5e" : "#94a3b8",
                  textShadow: stats.totalNet !== 0
                    ? `0 0 15px ${stats.totalNet > 0 ? "rgba(45,212,191,0.5)" : "rgba(244,63,94,0.5)"}`
                    : "none",
                }}
              >
                {stats.totalNet > 0 ? `+${stats.totalNet}` : stats.totalNet}
              </span>
            </div>

            {/* Message */}
            <p
              className="text-sm text-center leading-relaxed relative z-10"
              style={{ color: "rgba(148,163,184,0.7)" }}
            >
              {cfg.message}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
