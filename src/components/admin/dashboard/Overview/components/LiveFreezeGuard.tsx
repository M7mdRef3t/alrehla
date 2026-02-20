import type { FC } from "react";
import { useEffect, useState } from "react";
import { AlertTriangle, ShieldCheck, Siren } from "lucide-react";
import {
  getPerformanceWatchdogSnapshot,
  startPerformanceWatchdog,
  subscribePerformanceWatchdog,
  type WatchdogSnapshot
} from "../../../../../services/performanceWatchdog";

const fmtTime = (ts: number | null): string => {
  if (!ts) return "لا يوجد";
  return new Date(ts).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

export const LiveFreezeGuard: FC = () => {
  const [snap, setSnap] = useState<WatchdogSnapshot>(getPerformanceWatchdogSnapshot);

  useEffect(() => {
    startPerformanceWatchdog();
    return subscribePerformanceWatchdog(setSnap);
  }, []);

  const statusUi =
    snap.status === "critical"
      ? { label: "خطر", className: "text-rose-300 bg-rose-500/15 border-rose-500/40", Icon: Siren }
      : snap.status === "warning"
        ? { label: "تحذير", className: "text-amber-200 bg-amber-500/15 border-amber-500/40", Icon: AlertTriangle }
        : { label: "سليم", className: "text-emerald-200 bg-emerald-500/15 border-emerald-500/40", Icon: ShieldCheck };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-black text-white uppercase tracking-widest">مراقب التهنيج اللحظي</h3>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black ${statusUi.className}`}>
          <statusUi.Icon className="w-3 h-3" />
          {statusUi.label}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
        <div className="rounded-xl bg-black/20 px-2 py-2 border border-white/5">
          <p className="text-slate-500">Avg Lag</p>
          <p className="text-white font-bold">{snap.avgLagMs}ms</p>
        </div>
        <div className="rounded-xl bg-black/20 px-2 py-2 border border-white/5">
          <p className="text-slate-500">P95 Lag</p>
          <p className="text-white font-bold">{snap.p95LagMs}ms</p>
        </div>
        <div className="rounded-xl bg-black/20 px-2 py-2 border border-white/5">
          <p className="text-slate-500">Long Tasks/1m</p>
          <p className="text-white font-bold">{snap.longTasks1m}</p>
        </div>
        <div className="rounded-xl bg-black/20 px-2 py-2 border border-white/5">
          <p className="text-slate-500">Freezes/1m</p>
          <p className="text-white font-bold">{snap.freezes1m}</p>
        </div>
        <div className="rounded-xl bg-black/20 px-2 py-2 border border-white/5">
          <p className="text-slate-500">آخر تجمد</p>
          <p className="text-white font-bold">{fmtTime(snap.lastFreezeAt)}</p>
        </div>
      </div>
    </div>
  );
};
