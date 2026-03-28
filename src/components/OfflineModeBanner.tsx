/**
 * OfflineModeBanner.tsx
 * ──────────────────────
 * Detects online/offline status via browser events.
 * Shows a sticky bottom banner when offline.
 * Shows a brief "عدت للاتصال" confirmation toast on reconnect.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi, Cloud } from "lucide-react";

type Status = "online" | "offline" | "reconnected";

export function OfflineModeBanner() {
  const [status, setStatus] = useState<Status>(
    typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "online"
  );

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function handleOffline() {
      setStatus("offline");
    }

    function handleOnline() {
      setStatus("reconnected");
      // Hide the "reconnected" banner after 3s
      reconnectTimer = setTimeout(() => setStatus("online"), 3000);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      clearTimeout(reconnectTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {status === "offline" && (
        <motion.div
          key="offline"
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
          role="alert"
          aria-live="assertive"
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 99200,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 20px",
            borderRadius: 16,
            background: "rgba(15,17,30,0.95)",
            border: "1px solid rgba(239,68,68,0.3)",
            boxShadow: "0 0 40px rgba(239,68,68,0.15), 0 8px 32px rgba(0,0,0,0.6)",
            backdropFilter: "blur(16px)",
            fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', sans-serif",
            maxWidth: "calc(100vw - 40px)",
            direction: "rtl",
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <WifiOff size={15} style={{ color: "#ef4444" }} />
          </div>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 900, color: "#fff" }}>
              أنت غير متصل بالإنترنت
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              بياناتك تُحفظ محلياً وستُزامَن عند العودة
            </p>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.15)",
            borderRadius: 99, padding: "4px 10px",
            marginRight: 4, flexShrink: 0,
          }}>
            <Cloud size={12} style={{ color: "#ef4444" }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: "#ef4444" }}>OFFLINE</span>
          </div>
        </motion.div>
      )}

      {status === "reconnected" && (
        <motion.div
          key="reconnected"
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 99200,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 20px",
            borderRadius: 16,
            background: "rgba(15,17,30,0.95)",
            border: "1px solid rgba(20,210,200,0.25)",
            boxShadow: "0 0 30px rgba(20,210,200,0.12), 0 8px 32px rgba(0,0,0,0.6)",
            backdropFilter: "blur(16px)",
            fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', sans-serif",
            direction: "rtl",
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(20,210,200,0.1)",
            border: "1px solid rgba(20,210,200,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Wifi size={15} style={{ color: "#14d2c8" }} />
          </div>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 900, color: "#fff" }}>
              عدت للاتصال ✓
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              جارٍ مزامنة بياناتك…
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
