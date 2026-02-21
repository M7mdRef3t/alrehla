import type { FC } from "react";
import { useState } from "react";
import { AlertTriangle, RefreshCw, TrendingUp } from "lucide-react";
import { runCronReport, type WeeklyReport } from "../../../../../services/adminApi";
import { computeConsciousRevenueMetrics } from "../../../../../services/consciousRevenueLink";

interface RevenueEngineCardProps {
  data: WeeklyReport | null;
  loading: boolean;
  windowDays: 7 | 14 | 30;
  onWindowChange?: (days: 7 | 14 | 30) => void;
  onRefresh?: (days?: 7 | 14 | 30) => Promise<void> | void;
}

const Metric: FC<{ label: string; value: string | number; tone?: "default" | "good" | "warn" }> = ({
  label,
  value,
  tone = "default"
}) => {
  const toneClass =
    tone === "good" ? "text-emerald-300" : tone === "warn" ? "text-rose-300" : "text-white";
  return (
    <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
};

export const RevenueEngineCard: FC<RevenueEngineCardProps> = ({
  data,
  loading,
  windowDays,
  onWindowChange,
  onRefresh
}) => {
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/5 bg-slate-950/30 p-6 animate-pulse">
        <div className="h-6 w-48 rounded bg-slate-800/40" />
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="h-16 rounded bg-slate-800/30" />
          <div className="h-16 rounded bg-slate-800/30" />
          <div className="h-16 rounded bg-slate-800/30" />
          <div className="h-16 rounded bg-slate-800/30" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const exposed = Number(data.affiliate?.linkExposed ?? 0);
  const clicked = Number(data.affiliate?.linkClicked ?? 0);
  const ctr = Number(data.affiliate?.ctr ?? 0);
  const variants = data.affiliate?.variants ?? [];
  const topMissions = data.affiliate?.topMissions ?? [];
  const gate7Critical = data.gate7?.status === "critical";
  const gate7InsufficientTraffic = data.gate7?.code === "gate7_insufficient_traffic";
  const consciousMetrics = data.consciousRevenue ?? computeConsciousRevenueMetrics(data);
  const alignmentTone =
    consciousMetrics?.status === "strong"
      ? "text-emerald-300 border-emerald-500/20 bg-emerald-500/10"
      : consciousMetrics?.status === "watch"
      ? "text-amber-200 border-amber-500/20 bg-amber-500/10"
      : "text-rose-200 border-rose-500/20 bg-rose-500/10";

  const handleRefreshWeekly = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await runCronReport("weekly");
      if (!result?.ok) {
        setSyncMessage("فشل توليد التقرير الأسبوعي.");
        return;
      }
      const generated = String(result.generatedAt ?? result.reportGeneratedAt ?? "").trim();
      if (generated) setLastGeneratedAt(generated);
      await onRefresh?.(windowDays);
      setSyncMessage("تم تحديث تقرير الربحية الأسبوعي.");
    } catch {
      setSyncMessage("تعذر الاتصال أثناء توليد التقرير.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-950/30 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-200">Revenue Engine</h3>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 rounded-lg border border-white/10 bg-slate-900/40 p-1">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => onWindowChange?.(days as 7 | 14 | 30)}
                className={`rounded-md px-2 py-1 text-[10px] font-bold transition-colors ${
                  windowDays === days
                    ? "bg-indigo-500/30 text-indigo-100"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleRefreshWeekly}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-bold text-indigo-200 transition-colors hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "جاري التحديث..." : "تحديث التقرير"}
          </button>
          <span className="text-[10px] text-slate-500">
            {lastGeneratedAt
              ? new Date(lastGeneratedAt).toLocaleString("ar-EG")
              : new Date(data.to).toLocaleDateString("ar-EG")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Metric label="affiliate_exposed" value={exposed} />
        <Metric label="affiliate_clicked" value={clicked} />
        <Metric label="affiliate_ctr" value={`${ctr}%`} tone={ctr > 0 ? "good" : "default"} />
        <Metric
          label="gate_7_status"
          value={gate7Critical ? "CRITICAL" : "OK"}
          tone={gate7Critical ? "warn" : "good"}
        />
      </div>

      {variants.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/5 bg-slate-900/30 p-3" dir="rtl">
          <p className="text-[11px] font-bold tracking-wide text-slate-300 mb-2">A/B Affiliate CTR</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <span
                key={variant.variant}
                className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[11px] text-indigo-200"
              >
                {variant.variant.toUpperCase()}: {variant.ctr}% ({variant.clicked}/{variant.exposed})
              </span>
            ))}
          </div>
        </div>
      )}

      {topMissions.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/5 bg-slate-900/30 p-3" dir="rtl">
          <p className="text-[11px] font-bold tracking-wide text-slate-300 mb-2">أفضل 3 مهام (CTR)</p>
          <div className="space-y-2">
            {topMissions.map((mission) => (
              <div key={mission.missionKey} className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-950/40 px-3 py-2">
                <span className="text-[11px] text-slate-200 truncate pl-2">
                  {mission.missionLabel} <span className="text-slate-500">({mission.ring})</span>
                </span>
                <span className="text-[11px] text-indigo-200 font-semibold">
                  {mission.ctr}% ({mission.clicked}/{mission.exposed})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {gate7Critical && (
        <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-rose-100" dir="rtl">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide">Gate-7 إنذار</span>
            <AlertTriangle className="h-4 w-4 text-rose-300" />
          </div>
          <p className="text-xs">
            لم يتم تسجيل أي <span className="font-bold">path_started</span> خلال آخر{" "}
            <span className="font-bold">{data.gate7?.windowHours ?? 48}</span> ساعة.
          </p>
        </div>
      )}

      {!gate7Critical && (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-100" dir="rtl">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide">Gate-7 مستقر</span>
            <TrendingUp className="h-4 w-4 text-emerald-300" />
          </div>
          {gate7InsufficientTraffic ? (
            <p className="text-xs">
              الترافيك أقل من baseline المطلوب. أحداث 48 ساعة:{" "}
              <span className="font-bold">{Number(data.gate7?.trafficEvents48h ?? 0)}</span> | جلسات:{" "}
              <span className="font-bold">{Number(data.gate7?.trafficSessions48h ?? 0)}</span>
              {" "} (الحد الأدنى: {Number(data.gate7?.minEvents48h ?? 20)} حدث / {Number(data.gate7?.minSessions48h ?? 8)} جلسات)
            </p>
          ) : (
            <p className="text-xs">
              path_started خلال 48 ساعة:{" "}
              <span className="font-bold">{Number(data.gate7?.pathStarted48h ?? 0)}</span>
            </p>
          )}
        </div>
      )}

      {consciousMetrics && (
        <div className={`mt-4 rounded-xl border p-3 ${alignmentTone}`} dir="rtl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold tracking-wide">وعي الرحلة قبل العائد</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {consciousMetrics.status === "strong"
                ? "STRONG ALIGNMENT"
                : consciousMetrics.status === "watch"
                ? "WATCH"
                : "CRITICAL"}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <Metric label="avg_consciousness_level" value={`${consciousMetrics.averageConsciousnessLevel}%`} tone={consciousMetrics.averageConsciousnessLevel >= 60 ? "good" : "default"} />
            <Metric label="revenue_signal" value={`${consciousMetrics.revenueSignal}%`} tone={consciousMetrics.revenueSignal >= 40 ? "good" : "default"} />
            <Metric label="conscious_revenue_alignment" value={`${consciousMetrics.alignmentScore}%`} tone={consciousMetrics.alignmentScore >= 70 ? "good" : consciousMetrics.alignmentScore < 45 ? "warn" : "default"} />
          </div>
          <p className="mt-3 text-xs leading-relaxed">{consciousMetrics.note}</p>
        </div>
      )}

      {syncMessage && (
        <div className="mt-3 rounded-lg border border-white/5 bg-slate-900/40 px-3 py-2 text-xs text-slate-300" dir="rtl">
          {syncMessage}
        </div>
      )}
    </div>
  );
};
