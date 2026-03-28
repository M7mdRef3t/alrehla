import type { FC } from "react";
import { BarChart3, Target } from "lucide-react";
import type { OverviewStats } from "../../../../../services/adminApi";

type MarketingLeadsStats = NonNullable<OverviewStats["marketingLeads"]>;

interface MarketingLeadsPanelProps {
  data: MarketingLeadsStats | null | undefined;
  loading: boolean;
}

const fmtPct = (value: number | null | undefined): string => {
  if (value == null || Number.isNaN(value)) return "-";
  return `${value}%`;
};

const EmptyList = ({ label }: { label: string }) => (
  <p className="text-xs text-slate-500">{label}</p>
);

const BreakdownList = ({
  items,
  emptyLabel,
  valueClassName,
  fallbackKey
}: {
  items: Array<{ key: string; count: number }>;
  emptyLabel: string;
  valueClassName: string;
  fallbackKey: string;
}) => {
  if (items.length === 0) {
    return <EmptyList label={emptyLabel} />;
  }

  return (
    <>
      {items.map((item) => (
        <div
          key={`${fallbackKey}-${item.key || "empty"}`}
          className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-900/30 px-3 py-2"
        >
          <span className="text-sm text-slate-200">{item.key || fallbackKey}</span>
          <span className={`text-sm font-mono ${valueClassName}`}>{item.count}</span>
        </div>
      ))}
    </>
  );
};

export const MarketingLeadsPanel: FC<MarketingLeadsPanelProps> = ({ data, loading }) => {
  if (loading) {
    return <div className="mb-6 h-64 animate-pulse rounded-2xl bg-slate-900/20" />;
  }

  if (!data) {
    return (
      <div className="admin-glass-card mb-6 rounded-2xl border-white/5 bg-slate-950/30 p-6 backdrop-blur-sm">
        <p className="text-sm text-slate-400">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª leads Ø¨Ø¹Ø¯.</p>
      </div>
    );
  }

  const topSources = data.bySource.slice(0, 5);
  const topSourceTypes = data.bySourceType.slice(0, 4);
  const topStatuses = data.byStatus.slice(0, 4);
  const topCampaigns = data.byCampaign.slice(0, 5);
  const peakDaily = data.dailyTrend.reduce((max, day) => Math.max(max, day.count), 0);

  return (
    <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="admin-glass-card rounded-2xl border-white/5 bg-slate-950/30 p-6 backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-teal-300" />
          <h3 className="text-lg font-bold text-white">Marketing Leads</h3>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Total</p>
            <p className="text-2xl font-black text-white">{data.total.toLocaleString("ar-EG")}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Last 24h</p>
            <p className="text-2xl font-black text-teal-300">{data.last24h.toLocaleString("ar-EG")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <p className="text-xs font-bold text-slate-400">Top Sources</p>
          <BreakdownList
            items={topSources}
            emptyLabel="Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù…ØµØ§Ø¯Ø± Ø¨Ø¹Ø¯."
            valueClassName="text-emerald-300"
            fallbackKey="direct"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2">
          <p className="text-xs font-bold text-slate-400">Source Types</p>
          <BreakdownList
            items={topSourceTypes}
            emptyLabel="Ù„Ø§ ØªÙˆØ¬Ø¯ Ø£Ù†ÙˆØ§Ø¹ Ù…ØµØ§Ø¯Ø± Ø¨Ø¹Ø¯."
            valueClassName="text-cyan-300"
            fallbackKey="website"
          />
        </div>

        <div className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-4">
          <p className="text-xs font-bold text-cyan-100">Growth Plan 2025 - Advisor Interest</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-white/10 bg-slate-900/40 p-3">
              <p className="text-[10px] uppercase text-slate-400">Total</p>
              <p className="text-lg font-black text-white">{data.advisorInterest.total.toLocaleString("ar-EG")}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-900/40 p-3">
              <p className="text-[10px] uppercase text-slate-400">Last 24h</p>
              <p className="text-lg font-black text-cyan-200">{data.advisorInterest.last24h.toLocaleString("ar-EG")}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-900/40 p-3">
              <p className="text-[10px] uppercase text-slate-400">Success</p>
              <p className="text-lg font-black text-emerald-300">{data.advisorInterest.successfulSubmissions.toLocaleString("ar-EG")}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-900/40 p-3">
              <p className="text-[10px] uppercase text-slate-400">Failed</p>
              <p className="text-lg font-black text-rose-300">{data.advisorInterest.failedSubmissions.toLocaleString("ar-EG")}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-300">
            Success rate: <span className="font-mono text-cyan-100">{fmtPct(data.advisorInterest.successRatePct)}</span>
          </p>
        </div>
      </div>

      <div className="admin-glass-card rounded-2xl border-white/5 bg-slate-950/30 p-6 backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-300" />
          <h3 className="text-lg font-bold text-white">Lead Conversion</h3>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <p className="text-[10px] uppercase text-slate-400">Start/L</p>
            <p className="text-lg font-black text-white">{fmtPct(data.conversion.startClickRatePct)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <p className="text-[10px] uppercase text-slate-400">Pulse/L</p>
            <p className="text-lg font-black text-white">{fmtPct(data.conversion.pulseCompletedRatePct)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <p className="text-[10px] uppercase text-slate-400">Map/L</p>
            <p className="text-lg font-black text-white">{fmtPct(data.conversion.mapCreatedRatePct)}</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-xs font-bold text-slate-400">Daily Trend (14d)</p>
          <div className="flex h-20 items-end gap-1">
            {data.dailyTrend.map((point) => {
              const height = peakDaily > 0 ? Math.max(6, Math.round((point.count / peakDaily) * 72)) : 6;
              return (
                <div
                  key={point.date}
                  title={`${point.date}: ${point.count}`}
                  className="flex-1 rounded-sm bg-teal-400/70"
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <p className="text-xs font-bold text-slate-400">Top Campaigns</p>
          <BreakdownList
            items={topCampaigns}
            emptyLabel="Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø­Ù…Ù„Ø§Øª UTM Ø¨Ø¹Ø¯."
            valueClassName="text-indigo-300"
            fallbackKey="unknown"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2">
          <p className="text-xs font-bold text-slate-400">Lead Status</p>
          <BreakdownList
            items={topStatuses}
            emptyLabel="Ù„Ø§ ØªÙˆØ¬Ø¯ Ø­Ø§Ù„Ø§Øª leads Ø¨Ø¹Ø¯."
            valueClassName="text-amber-300"
            fallbackKey="new"
          />
        </div>
      </div>
    </div>
  );
};

