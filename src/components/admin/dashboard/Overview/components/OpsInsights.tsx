import type { FC } from "react";
import { AlertTriangle, Zap } from "lucide-react";
import type { OpsInsights as OpsInsightsType } from "../../../../../services/adminApi";

interface OpsInsightsProps {
    data: OpsInsightsType | null;
    loading: boolean;
}

const MetricCard: FC<{ label: string; value: string | number; subValue?: string; trend?: "up" | "down" | "neutral" }> = ({ label, value, subValue, trend }) => (
    <div className="flex flex-col p-3 rounded-xl border border-white/5 bg-slate-900/40 backdrop-blur-sm">
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1">{label}</span>
        <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-white tabular-nums">{value}</span>
            {subValue && (
                <span className={`text-[10px] font-bold ${trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-slate-400"}`}>
                    {subValue}
                </span>
            )}
        </div>
    </div>
);

const AlertBox: FC<{ alert: OpsInsightsType["alerts"][0] }> = ({ alert }) => (
    <div className={`p-4 rounded-xl border flex flex-col gap-1 ${alert.level === "critical"
        ? "bg-rose-500/10 border-rose-500/30 text-rose-200"
        : alert.level === "warning"
            ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
            : "bg-blue-500/10 border-blue-500/30 text-blue-200"
        }`}>
        <div className="flex items-center justify-between">
            <span className="font-bold text-xs">{alert.title}</span>
            {alert.level === "critical" && <AlertTriangle className="w-4 h-4 text-rose-400" />}
        </div>
        <div className="flex justify-end text-[10px] font-mono opacity-70">
            metric: {alert.metric} | threshold: {alert.threshold}
        </div>
    </div>
);

const SegmentBox: FC<{ title: string; data: Array<{ key: string; count: number }> | null }> = ({ title, data }) => (
    <div className="p-3 rounded-xl border border-white/5 bg-slate-900/40 backdrop-blur-sm flex flex-col h-full">
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2 text-right">{title}</span>
        <div className="flex-1 flex flex-col justify-end gap-1">
            {(!data || data.length === 0) ? (
                <span className="text-xs text-slate-600 text-center py-2">no data</span>
            ) : (
                data.map((item) => (
                    <div key={item.key} className="flex justify-between text-[10px] text-slate-300">
                        <span>{item.key}</span>
                        <span className="font-mono text-white">{item.count}</span>
                    </div>
                ))
            )}
        </div>
    </div>
);

export const OpsInsights: FC<OpsInsightsProps> = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-slate-800/50 rounded-lg w-1/3"></div>
                <div className="grid grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-slate-800/50 rounded-xl"></div>)}
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-4 w-full" dir="rtl">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    التحليلات التشغيلية (Ops Insights)
                </h3>
                <span className="text-[10px] font-mono text-slate-500" dir="ltr">{new Date(data.generatedAt).toLocaleString('en-US')}</span>
            </div>

            {/* Funnel Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <MetricCard label="start_path_cta" value={data.funnel.startPathCTA} />
                <MetricCard label="add_person_done" value={data.funnel.addPersonDone} />
                <MetricCard label="add_person_opened" value={data.funnel.addPersonOpened} />
                <MetricCard label="start_clicked" value={data.funnel.startClicked} />
                <MetricCard label="landing_viewed" value={data.funnel.landingViewed} />
            </div>

            {/* Cohorts Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard label="activation" value={`${data.cohort.activationRate}%`} />
                <MetricCard label="cohort new (30d)" value={data.cohort.newSessions30d} />
                <MetricCard
                    label="delta 7d"
                    value={`${data.comparisons.events7dDelta > 0 ? '+' : ''}${data.comparisons.events7dDelta}%`}
                    trend={data.comparisons.events7dDelta > 0 ? 'up' : 'down'}
                />
                <MetricCard
                    label="delta 24h"
                    value={`${data.comparisons.events1dDelta > 0 ? '+' : ''}${data.comparisons.events1dDelta}%`}
                    trend={data.comparisons.events1dDelta > 0 ? 'up' : 'down'}
                />
            </div>

            {/* Alerts Grid */}
            {data.alerts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3" dir="rtl">
                    {data.alerts.map((alert, idx) => (
                        <AlertBox key={idx} alert={alert} />
                    ))}
                </div>
            )}

            {/* Segments Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <SegmentBox title="segments.device" data={data.segments.byDevice} />
                <SegmentBox title="segments.channel" data={data.segments.byChannel} />
                <div className="p-3 rounded-xl border border-white/5 bg-slate-900/40 backdrop-blur-sm flex flex-col h-full">
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2 text-right">segments.mode</span>
                    <div className="flex-1 flex flex-col justify-end gap-1">
                        <div className="flex justify-between text-[10px] text-slate-300">
                            <span>identified</span>
                            <span className="font-mono text-white">{data.tracking.identified}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-300">
                            <span>anonymous</span>
                            <span className="font-mono text-white">{data.tracking.anonymous}</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
