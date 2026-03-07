import type { FC } from "react";
import { BarChart3, Target } from "lucide-react";
import type { OverviewStats } from "../../../../../services/adminApi";

type MarketingLeadsStats = NonNullable<OverviewStats["marketingLeads"]>;

interface MarketingLeadsPanelProps {
  data: MarketingLeadsStats | null | undefined;
  loading: boolean;
}

const fmtPct = (value: number | null | undefined): string => {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value}%`;
};

export const MarketingLeadsPanel: FC<MarketingLeadsPanelProps> = ({ data, loading }) => {
  if (loading) {
    return <div className="h-64 rounded-2xl bg-slate-900/20 animate-pulse mb-6" />;
  }

  if (!data) {
    return (
      <div className="admin-glass-card p-6 border-white/5 bg-slate-950/30 rounded-2xl backdrop-blur-sm mb-6">
        <p className="text-sm text-slate-400">لا توجد بيانات Leads بعد.</p>
      </div>
    );
  }

  const topSources = data.bySource.slice(0, 5);
  const topCampaigns = data.byCampaign.slice(0, 5);
  const peakDaily = data.dailyTrend.reduce((max, day) => Math.max(max, day.count), 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
      <div className="admin-glass-card p-6 border-white/5 bg-slate-950/30 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-teal-300" />
          <h3 className="text-lg font-bold text-white">Marketing Leads</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
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
          <p className="text-xs text-slate-400 font-bold">Top Sources</p>
          {topSources.length === 0 ? (
            <p className="text-xs text-slate-500">لا يوجد مصادر بعد.</p>
          ) : (
            topSources.map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-900/30 px-3 py-2">
                <span className="text-sm text-slate-200">{item.key || "direct"}</span>
                <span className="text-sm font-mono text-emerald-300">{item.count}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="admin-glass-card p-6 border-white/5 bg-slate-950/30 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-indigo-300" />
          <h3 className="text-lg font-bold text-white">Lead Conversion</h3>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <p className="text-[10px] text-slate-400 uppercase">Start/L</p>
            <p className="text-lg font-black text-white">{fmtPct(data.conversion.startClickRatePct)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <p className="text-[10px] text-slate-400 uppercase">Pulse/L</p>
            <p className="text-lg font-black text-white">{fmtPct(data.conversion.pulseCompletedRatePct)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <p className="text-[10px] text-slate-400 uppercase">Map/L</p>
            <p className="text-lg font-black text-white">{fmtPct(data.conversion.mapCreatedRatePct)}</p>
          </div>
        </div>
        <div className="mb-4">
          <p className="text-xs text-slate-400 font-bold mb-2">Daily Trend (14d)</p>
          <div className="flex items-end gap-1 h-20">
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
          <p className="text-xs text-slate-400 font-bold">Top Campaigns</p>
          {topCampaigns.length === 0 ? (
            <p className="text-xs text-slate-500">لا يوجد حملات UTM بعد.</p>
          ) : (
            topCampaigns.map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-900/30 px-3 py-2">
                <span className="text-sm text-slate-200">{item.key || "unknown"}</span>
                <span className="text-sm font-mono text-indigo-300">{item.count}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
