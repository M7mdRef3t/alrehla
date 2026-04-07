import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ShieldCheck, Siren } from "lucide-react";
import {
  getPerformanceWatchdogSnapshot,
  startPerformanceWatchdog,
  subscribePerformanceWatchdog,
  type WatchdogSnapshot
} from "@/services/performanceWatchdog";
import { sendNotification } from "@/services/notifications";

const CRITICAL_ALERT_AFTER_MS = 10_000;
const CRITICAL_ALERT_COOLDOWN_MS = 5 * 60_000;

export const LiveFreezePill: FC = () => {
  const [snap, setSnap] = useState<WatchdogSnapshot>(getPerformanceWatchdogSnapshot);
  const criticalSinceRef = useRef<number | null>(null);
  const lastAlertAtRef = useRef<number>(0);

  useEffect(() => {
    startPerformanceWatchdog();
    return subscribePerformanceWatchdog(setSnap);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (snap.status !== "critical") {
      criticalSinceRef.current = null;
      return;
    }

    const now = Date.now();
    if (criticalSinceRef.current == null) {
      criticalSinceRef.current = now;
      return;
    }

    const criticalDuration = now - criticalSinceRef.current;
    const canAlert = now - lastAlertAtRef.current >= CRITICAL_ALERT_COOLDOWN_MS;
    const permissionGranted = window.Notification.permission === "granted";

    if (permissionGranted && canAlert && criticalDuration >= CRITICAL_ALERT_AFTER_MS) {
      lastAlertAtRef.current = now;
      void sendNotification({
        title: "تحذير أداء في المنصة",
        body: `رصد تهنيج حرج مستمر. p95=${snap.p95LagMs}ms, تجمدات/دقيقة=${snap.freezes1m}`,
        tag: "owner-live-freeze-alert",
        requireInteraction: true
      });
    }
  }, [snap.status, snap.p95LagMs, snap.freezes1m, snap.updatedAt]);

  const ui =
    snap.status === "critical"
      ? { label: "تهنيج خطر", className: "text-rose-300 bg-rose-500/15 border-rose-500/35", Icon: Siren }
      : snap.status === "warning"
        ? { label: "ضغط مرتفع", className: "text-amber-200 bg-amber-500/15 border-amber-500/35", Icon: AlertTriangle }
        : { label: "الأداء سليم", className: "text-emerald-200 bg-emerald-500/15 border-emerald-500/35", Icon: ShieldCheck };

  return (
    <div className={`hidden lg:inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${ui.className}`}>
      <ui.Icon className="w-3 h-3" />
      <span>{ui.label}</span>
      <span className="opacity-80">p95 {snap.p95LagMs}ms</span>
    </div>
  );
};
