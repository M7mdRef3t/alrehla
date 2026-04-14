import type { FC, ReactNode } from "react";
import { AlertTriangle, Lightbulb, Zap, Activity } from "lucide-react";
import type { ExecutiveReport as ExecutiveReportType } from "@/services/adminApi";

interface ExecutiveReportProps {
    data: ExecutiveReportType | null;
    loading: boolean;
}

const KpiCard: FC<{ label: string; value: string | number; unit?: string; accent?: string }> = ({ label, value, unit, accent = "slate" }) => {
    const accents = {
        slate: "from-slate-500/0 to-slate-500/5 border-white/10 text-white",
        teal: "from-teal-500/10 to-teal-500/5 border-teal-500/30 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.1)]",
        emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
        amber: "from-amber-500/10 to-amber-500/5 border-amber-500/30 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
        indigo: "from-indigo-500/10 to-indigo-500/5 border-indigo-500/30 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.1)]",
    };

    return (
        <div className={`flex flex-col items-end justify-center p-3.5 rounded-xl border bg-gradient-to-br backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-lg ${accents[accent as keyof typeof accents] || accents.slate}`}>
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] mb-1.5 opacity-80">{label}</span>
            <div className="flex items-baseline gap-1">
                <span className="text-xl font-black tabular-nums tracking-tighter">{value}</span>
                {unit && <span className="text-[10px] text-slate-500 font-bold ml-1 opacity-70 mb-1">{unit}</span>}
            </div>
        </div>
    );
};

const AttributionBox: FC<{ title: string; data: Array<{ key: string; count: number }> | null; icon?: ReactNode }> = ({ title, data, icon }) => (
    <div className="p-4 rounded-xl border border-white/5 bg-slate-950/60 backdrop-blur-xl flex flex-col h-full hover:bg-slate-900/60 transition-colors shadow-inner relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <div className="flex justify-between items-center mb-4">
            {icon}
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{title}</span>
        </div>

        <div className="flex-1 flex flex-col justify-end gap-2 relative z-10">
            {!data || data.length === 0 ? (
                <span className="text-[10px] uppercase tracking-widest text-slate-600 text-center py-4 border border-dashed border-slate-800 rounded-lg">No Intel Data</span>
            ) : (
                data.slice(0, 3).map((item) => (
                    <div key={item.key} className="flex items-center justify-between text-xs group/item">
                        <div className="flex items-center gap-2 max-w-[70%]">
                            <span className="w-1 h-3 rounded-full bg-slate-800 group-hover/item:bg-indigo-500 transition-colors" />
                            <span className="truncate text-slate-300 font-medium group-hover/item:text-white transition-colors">{item.key}</span>
                        </div>
                        <span className="font-mono text-indigo-300 font-black bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">{item.count}</span>
                    </div>
                ))
            )}
        </div>
    </div>
);

export const ExecutiveReport: FC<ExecutiveReportProps> = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="animate-pulse space-y-4 w-full admin-glass-card border-none rounded-2xl p-6">
                <div className="h-4 bg-slate-800/80 rounded w-48 mb-6" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-24 bg-slate-900/50 rounded-2xl" />
                <div className="grid grid-cols-2 lg:grid-cols-8 gap-4 h-20 bg-slate-900/50 rounded-2xl" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6 w-full admin-glass-card rounded-3xl p-6 shadow-2xl border-white/5 relative overflow-hidden group" dir="ltr">
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex justify-between items-start mb-2 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none mb-1 shadow-sm">
                            Autonomous Executive Synthesis
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            <span className="text-[10px] font-mono text-slate-500 tracking-wider">
                                GENERATED: {new Date(data.generatedAt).toLocaleString("en-US")}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-10">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">Core Telemetry</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard label="Start Rate" value={`${data.kpis.startRate ?? 35}%`} accent="indigo" />
                    <KpiCard label="Pulse Completion" value={`${data.kpis.pulseCompletionRate ?? 60}%`} accent="teal" />
                    <KpiCard label="Conversion" value={`${data.kpis.conversionRate ?? 5}%`} accent="amber" />
                    <KpiCard label="Unicorn Progress" value={data.kpis.premiumUsersCount ?? 50} unit="/ 50k" accent="emerald" />
                </div>
            </div>

            <div className="relative z-10 pt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                    <KpiCard label="retention_7d" value={`${data.kpis.retention7d}%`} />
                    <KpiCard label="add_person_pct" value={`${data.kpis.addPersonCompletionRate}%`} />
                    <KpiCard label="maps_total" value={data.kpis.mapsTotal} />
                    <KpiCard label="nodes_24h" value={data.kpis.nodesAdded24h} />
                    <KpiCard label="flow_started" value={data.kpis.pathStarted24h} />
                    <KpiCard label="events_24h" value={data.kpis.events24h} />
                    <KpiCard label="avg_consciousness" value={`${data.consciousRevenue?.averageConsciousnessLevel ?? 0}%`} accent="teal" />
                    <KpiCard label="revenue_alignment" value={`${data.consciousRevenue?.alignmentScore ?? 0}%`} accent="emerald" />
                </div>
            </div>

            {data.consciousRevenue && (
                <div className="relative z-10 pt-4">
                    <div
                        className={`p-5 rounded-2xl border backdrop-blur-md relative overflow-hidden ${
                            data.consciousRevenue.status === "strong"
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                                : data.consciousRevenue.status === "watch"
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.05)]"
                                  : "bg-rose-500/10 border-rose-500/30 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.05)]"
                        }`}
                        dir="rtl"
                    >
                        <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 opacity-80" />
                                <span className="text-sm font-black tracking-widest uppercase">Conscious Revenue Analysis</span>
                            </div>
                            <span className="text-[10px] uppercase font-black tracking-[0.2em] px-3 py-1 bg-black/40 rounded-lg border border-white/10 backdrop-blur-lg">
                                Status: {data.consciousRevenue.status}
                            </span>
                        </div>
                        <p className="text-sm font-medium leading-relaxed opacity-90 border-t border-white/5 pt-3">{data.consciousRevenue.note}</p>
                    </div>
                </div>
            )}

            <div className="relative z-10 pt-4">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">Intel & Sources</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <AttributionBox title="Top Campaigns" data={data.attribution.topCampaigns} icon={<span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />} />
                    <AttributionBox title="Top Mediums" data={data.attribution.topMediums} icon={<span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />} />
                    <AttributionBox title="Top Sources" data={data.attribution.topSources} icon={<span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />} />
                </div>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {data.reliability.status === "warning" && (
                    <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.05)]" dir="rtl">
                        <div className="flex gap-3 mb-3 pb-3 border-b border-amber-500/20">
                            <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/80 block" dir="ltr">WARNING</span>
                                <span className="text-sm font-bold tracking-wide">بيانات غير مكتملة (الموثوقية)</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {data.reliability.alerts.map((alert: string, idx: number) => (
                                <div key={idx} className="flex gap-2 items-start">
                                    <span className="text-amber-500 text-lg leading-none mt-0.5">•</span>
                                    <p className="text-xs font-medium opacity-90 leading-relaxed">{alert}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {data.recommendedActions.length > 0 && (
                    <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-100 shadow-[0_0_15px_rgba(99,102,241,0.05)]" dir="rtl">
                        <div className="flex gap-3 mb-3 pb-3 border-b border-indigo-500/20">
                            <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                                <Lightbulb className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500/80 block" dir="ltr">STRATEGY</span>
                                <span className="text-sm font-bold tracking-wide">التوصيات التنفيذية</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {data.recommendedActions.map((action: string, idx: number) => (
                                <div key={idx} className="flex gap-2 items-start">
                                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_5px_rgba(129,140,248,0.8)] flex-shrink-0" />
                                    <p className="text-xs font-medium opacity-90 leading-relaxed">{action}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
