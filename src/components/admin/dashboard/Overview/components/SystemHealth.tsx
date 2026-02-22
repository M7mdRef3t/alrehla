import type { FC } from "react";
import { Activity, AlertOctagon, CheckCircle2, User } from "lucide-react";
import type { SystemHealthReport } from "../../../../../services/adminApi";
import { useDigitalTwinState } from "../../../../../state/digitalTwinState";

interface SystemHealthProps {
    data: SystemHealthReport | null;
    loading: boolean;
}

const MetricBox: FC<{ label: string; value: string | number; unit?: string }> = ({ label, value, unit }) => (
    <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-slate-900/40 backdrop-blur-sm">
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1">{label}</span>
        <span className="text-lg font-bold text-white tabular-nums">
            {value}
            {unit && <span className="text-xs text-slate-400 ml-1">{unit}</span>}
        </span>
    </div>
);

export const SystemHealth: FC<SystemHealthProps> = ({ data, loading }) => {
    const { graph } = useDigitalTwinState();

    if (loading) {
        return (
            <div className="animate-pulse space-y-4 w-full">
                <div className="h-20 bg-emerald-500/10 rounded-xl" />
                <div className="grid grid-cols-6 gap-3 h-16 bg-slate-800/20 rounded-xl" />
            </div>
        );
    }

    if (!data) return null;

    const isHealthy = data.status === "healthy";
    const StatusIcon = isHealthy ? CheckCircle2 : AlertOctagon;

    return (
        <div className="space-y-4 w-full" dir="ltr">
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-mono text-slate-500">{new Date(data.generatedAt).toLocaleString()}</span>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    System Health
                </h3>
            </div>

            {/* Main Status Bar */}
            <div className={`relative overflow-hidden rounded-xl border p-4 flex flex-col md:flex-row justify-between items-center gap-4
        ${isHealthy ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-100" : "bg-rose-500/10 border-rose-500/30 text-rose-100"}`}>

                {/* Left Side: Status */}
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isHealthy ? "bg-emerald-500/20" : "bg-rose-500/20"}`}>
                        <StatusIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider opacity-70">Status</p>
                        <p className="text-xl font-black uppercase tracking-tight">{data.status}</p>
                    </div>
                </div>

                {/* Right Side: Probe Details */}
                <div className="flex items-center gap-6 text-right text-xs font-mono">
                    <div>
                        <p className="opacity-60 mb-0.5">Supabase reachable</p>
                        <p className="font-bold">{data.probe.supabaseReachable ? "YES" : "NO"}</p>
                    </div>
                    <div>
                        <p className="opacity-60 mb-0.5">Probe latency</p>
                        <p className="font-bold">{data.probe.supabaseProbeMs}ms</p>
                    </div>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <MetricBox label="p95" value={data.api.p95LatencyMs} unit="ms" />
                <MetricBox label="p50" value={data.api.p50LatencyMs} unit="ms" />
                <MetricBox label="error rate" value={Math.round(data.api.errorRate * 100)} unit="%" />
                <MetricBox label="errors" value={data.api.errors} />
                <MetricBox label="requests" value={data.api.requests} />
                <MetricBox label="uptime" value={data.api.uptimeSec} unit="s" />
                <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-sm">
                    <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider mb-1 flex items-center gap-1">
                        <User className="w-2.5 h-2.5" /> Stability
                    </span>
                    <span className="text-lg font-bold text-white tabular-nums">
                        {Math.round((graph.globalStability ?? 1) * 100)}%
                    </span>
                </div>
            </div>
        </div>
    );
};
