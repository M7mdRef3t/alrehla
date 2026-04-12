import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToastState } from "@/domains/dawayir/store/toast.store";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

export const GlobalToast: React.FC = () => {
  const { message, isVisible, type, hideToast } = useToastState();

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => hideToast(), 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, hideToast]);

  const configs = {
    info: {
      icon: <Info className="w-4 h-4" />,
      color: "#60a5fa",
      glow: "rgba(96,165,250,0.25)",
      border: "rgba(96,165,250,0.2)",
      bg: "rgba(30,58,138,0.15)",
    },
    success: {
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: "#2dd4bf",
      glow: "rgba(45,212,191,0.3)",
      border: "rgba(45,212,191,0.2)",
      bg: "rgba(5,46,22,0.2)",
    },
    warning: {
      icon: <AlertTriangle className="w-4 h-4" />,
      color: "#fbbf24",
      glow: "rgba(251,191,36,0.3)",
      border: "rgba(251,191,36,0.2)",
      bg: "rgba(78,53,0,0.2)",
    },
    error: {
      icon: <XCircle className="w-4 h-4" />,
      color: "#f43f5e",
      glow: "rgba(244,63,94,0.3)",
      border: "rgba(244,63,94,0.2)",
      bg: "rgba(76,5,25,0.2)",
    },
  };

  const cfg = configs[type] ?? configs.info;
  // Progress bar width (animated via CSS, not JS)
  const progressKey = `${isVisible}-${message}`;

  return (
    <AnimatePresence>
      {isVisible && message && (
        <motion.div
          key={progressKey}
          initial={{ opacity: 0, y: 24, scale: 0.93, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -16, scale: 0.95, filter: "blur(6px)" }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-safe-bottom bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-sm"
        >
          <div
            className="relative overflow-hidden rounded-2xl px-4 py-3 flex items-start gap-3"
            style={{
              background: `linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(3,7,18,0.98) 100%)`,
              border: `1px solid ${cfg.border}`,
              boxShadow: `0 20px 60px rgba(0,0,0,0.7), 0 0 30px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Color accent strip */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
              style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }}
            />

            {/* Auto-dismiss progress bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-[2px] rounded-b-2xl"
              style={{ background: cfg.color, opacity: 0.4 }}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
            />

            {/* Icon */}
            <div
              className="mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: `${cfg.color}15`,
                border: `1px solid ${cfg.color}25`,
                color: cfg.color,
              }}
            >
              {cfg.icon}
            </div>

            {/* Message */}
            <p
              className="flex-1 text-sm font-medium leading-relaxed min-w-0"
              style={{ color: "rgba(226,232,240,0.9)" }}
            >
              {message}
            </p>

            {/* Close */}
            <button
              onClick={hideToast}
              className="mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 shrink-0"
              style={{ color: "rgba(148,163,184,0.5)" }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
