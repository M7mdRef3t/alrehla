/**
 * XpFloatProvider.tsx
 * ───────────────────
 * Provides floating "+N XP" toast animations anywhere in the app.
 * Usage:
 *   1. Wrap app with <XpFloatProvider>
 *   2. Call `triggerXpFloat(amount)` from anywhere
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────────────────
interface FloatItem { id: number; amount: number; x: number; }

interface XpFloatCtx { triggerXpFloat: (amount: number) => void; }

const XpFloatContext = createContext<XpFloatCtx>({ triggerXpFloat: () => {} });

export function useXpFloat() {
  return useContext(XpFloatContext);
}

// ── Provider ───────────────────────────────────────────────────────────────
export function XpFloatProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FloatItem[]>([]);
  const nextId = useRef(0);

  const triggerXpFloat = useCallback((amount: number) => {
    if (amount <= 0) return;
    const id = nextId.current++;
    // Random horizontal spread (35–65% of viewport)
    const x = 35 + Math.random() * 30;
    setItems(prev => [...prev, { id, amount, x }]);
    // Remove after animation completes (1.4 s)
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id));
    }, 1500);
  }, []);

  // Listen to xp:earned events dispatched from achievementState
  useEffect(() => {
    function onXpEarned(e: Event) {
      const amount = (e as CustomEvent<{ amount: number }>).detail?.amount;
      if (typeof amount === "number") triggerXpFloat(amount);
    }
    window.addEventListener("xp:earned", onXpEarned);
    return () => window.removeEventListener("xp:earned", onXpEarned);
  }, [triggerXpFloat]);

  return (
    <XpFloatContext.Provider value={{ triggerXpFloat }}>
      {children}
      {/* Portal-like overlay — pointer-events none so it never blocks clicks */}
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 99999 }}
      >
        <AnimatePresence>
          {items.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 0, scale: 0.7 }}
              animate={{ opacity: 1, y: -60, scale: 1 }}
              exit={{ opacity: 0, y: -90, scale: 0.8 }}
              transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "absolute",
                bottom: "22%",
                left: `${item.x}%`,
                transform: "translateX(-50%)",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: 999,
                background: "rgba(20,210,200,0.15)",
                border: "1px solid rgba(20,210,200,0.35)",
                backdropFilter: "blur(10px)",
                fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                fontSize: 13,
                fontWeight: 900,
                color: "#14d2c8",
                whiteSpace: "nowrap",
                boxShadow: "0 0 20px rgba(20,210,200,0.25)",
              }}
            >
              <span style={{ color: "#f59e0b", fontSize: 14 }}>⚡</span>
              +{item.amount} XP
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </XpFloatContext.Provider>
  );
}
