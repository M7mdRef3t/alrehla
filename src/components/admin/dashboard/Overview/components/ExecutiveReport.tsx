import type { FC } from "react";
import { TrendingUp, AlertTriangle, Lightbulb, Users, ArrowUpRight } from "lucide-react";
import type { ExecutiveReport as ExecutiveReportType } from "../../../../../services/adminApi";

interface ExecutiveReportProps {
    data: ExecutiveReportType | null;
    loading: boolean;
}

const KpiCard: FC<{ label: string; value: string | number; unit?: string }> = ({ label, value, unit }) => (
    <div className="flex flex-col items-end justify-center p-3 rounded-xl border border-white/5 bg-slate-900/40 backdrop-blur-sm">
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1">{label}</span>
        <span className="text-lg font-bold text-white tabular-nums">
            {value}
            {unit && <span className="text-xs text-slate-400 ml-1">{unit}</span>}
        </span>
    </div>
);

const AttributionBox: FC<{ title: string; data: Array<{ key: string; count: number }> | null }> = ({ title, data }) => (
    <div className="p-3 rounded-xl border border-white/5 bg-slate-900/40 backdrop-blur-sm flex flex-col h-full">
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2 text-right">{title}</span>
        <div className="flex-1 flex flex-col justify-end gap-1">
            {(!data || data.length === 0) ? (
                <span className="text-xs text-slate-600 text-center py-2">no data</span>
            ) : (
                data.slice(0, 3).map((item) => (
                    <div key={item.key} className="flex justify-between text-[10px] text-slate-300">
                        <span className="truncate max-w-[70%]">{item.key}</span>
                        <span className="font-mono text-white">{item.count}</span>
                    </div>
                ))
            )}
        </div>
    </div>
);

export const ExecutiveReport: FC<ExecutiveReportProps> = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="animate-pulse space-y-4 w-full">
                <div className="h-8 bg-slate-800/50 rounded-lg w-1/4 mb-4"></div>
                <div className="grid grid-cols-6 gap-3 h-16 bg-slate-800/20 rounded-xl" />
                <div className="grid grid-cols-3 gap-3 h-24 bg-slate-800/20 rounded-xl" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-4 w-full" dir="ltr">
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-mono text-slate-500">{new Date(data.generatedAt).toLocaleString()}</span>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                    Executive Report
                </h3>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <KpiCard label="retention_7d" value={`${data.kpis.retention7d}%`} />
                <KpiCard label="add_person_completion" value={`${data.kpis.addPersonCompletionRate}%`} />
                <KpiCard label="maps_total" value={data.kpis.mapsTotal} />
                <KpiCard label="nodes_added_24h" value={data.kpis.nodesAdded24h} />
                <KpiCard label="path_started_24h" value={data.kpis.pathStarted24h} />
                <KpiCard label="events_24h" value={data.kpis.events24h} />
            </div>

            {/* Attribution Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <AttributionBox title="top campaigns" data={data.attribution.topCampaigns} />
                <AttributionBox title="top mediums" data={data.attribution.topMediums} />
                <AttributionBox title="top sources" data={data.attribution.topSources} />
            </div>

            {/* Reliability Warning */}
            {data.reliability.status === "warning" && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-100 flex flex-col gap-1" dir="rtl">
                    <div className="flex justify-between items-center w-full mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-200/70" dir="ltr">Reliability: warning</span>
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                    </div>
                    {data.reliability.alerts.map((alert, idx) => (
                        <p key={idx} className="text-xs font-medium opacity-90">{alert}</p>
                    ))}
                </div>
            )}

            {/* Recommended Actions */}
            {data.recommendedActions.length > 0 && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-100 flex flex-col gap-1" dir="rtl">
                    <div className="flex justify-between items-center w-full mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-200/70" dir="ltr">Recommended Actions</span>
                        <Lightbulb className="w-4 h-4 text-blue-400" />
                    </div>
                    {data.recommendedActions.map((action, idx) => (
                        <p key={idx} className="text-xs font-medium opacity-90">{action}</p>
                    ))}
                </div>
            )}
        </div>
    );
};
