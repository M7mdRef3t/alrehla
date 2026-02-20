import type { FC } from "react";
import { useEffect, useState } from "react";
import { Bot, AlertTriangle, ShieldCheck, Siren } from "lucide-react";
import {
  getAIGuardrailSnapshot,
  subscribeAIGuardrail
} from "../../../../../services/aiGuardrails";

export const AIGuardrailCard: FC = () => {
  const [snap, setSnap] = useState(getAIGuardrailSnapshot);

  useEffect(() => subscribeAIGuardrail(setSnap), []);

  const ui: { label: string; className: string; Icon: FC<{ className?: string }> } =
    snap.status === "critical"
      ? { label: "خطر اقتصادي", className: "text-rose-300 bg-rose-500/15 border-rose-500/35", Icon: Siren }
      : snap.status === "warning"
        ? { label: "تحذير تكاليف", className: "text-amber-300 bg-amber-500/15 border-amber-500/35", Icon: AlertTriangle }
        : { label: "AI مستقر", className: "text-emerald-300 bg-emerald-500/15 border-emerald-500/35", Icon: ShieldCheck };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-teal-300" />
          <h3 className="text-sm font-black text-white">حوكمة تكلفة الذكاء</h3>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black ${ui.className}`}>
          <ui.Icon className="w-3 h-3" />
          {ui.label}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <div className="rounded-xl bg-black/20 border border-white/5 px-3 py-2">
          <p className="text-slate-500">طلبات/دقيقة</p>
          <p className="text-white font-bold">{snap.requests1m}</p>
        </div>
        <div className="rounded-xl bg-black/20 border border-white/5 px-3 py-2">
          <p className="text-slate-500">متوسط زمن</p>
          <p className="text-white font-bold">{snap.avgLatencyMs1m}ms</p>
        </div>
        <div className="rounded-xl bg-black/20 border border-white/5 px-3 py-2">
          <p className="text-slate-500">Fallback/دقيقة</p>
          <p className="text-white font-bold">{snap.fallbacks1m}</p>
        </div>
        <div className="rounded-xl bg-black/20 border border-white/5 px-3 py-2">
          <p className="text-slate-500">إجمالي تكلفة اليوم</p>
          <p className="text-white font-bold">${snap.totalCostUsdToday.toFixed(3)}</p>
        </div>
      </div>

      <div className="text-xs text-slate-400 rounded-xl bg-black/20 border border-white/5 p-3">
        in-flight: {snap.inFlight} | queued: {snap.queued} | rate-limited: {snap.rateLimited1m} | dropped: {snap.queueDropped1m}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-xl bg-black/20 border border-white/5 px-3 py-2">
          <p className="text-slate-500">Metered (Usage فعلي)</p>
          <p className="text-white font-bold">${snap.meteredCostUsdToday.toFixed(3)}</p>
        </div>
        <div className="rounded-xl bg-black/20 border border-white/5 px-3 py-2">
          <p className="text-slate-500">Estimated (تقديري)</p>
          <p className="text-white font-bold">${snap.estimatedCostUsdToday.toFixed(3)}</p>
        </div>
      </div>

      <p className="text-[11px] text-slate-500">
        دقة القياس: {snap.requestsToday > 0 ? Math.round((snap.meteredRequestsToday / snap.requestsToday) * 100) : 0}% من طلبات اليوم metered
      </p>
    </div>
  );
};
