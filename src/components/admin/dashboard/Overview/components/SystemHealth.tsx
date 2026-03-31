import type { FC } from "react";
import { Activity, AlertOctagon, CheckCircle2, User, Server } from "lucide-react";
import type { SystemHealthReport } from "../../../../../services/adminApi";
import { useDigitalTwinState } from "../../../../../state/digitalTwinState";
import { AdminTooltip } from "./AdminTooltip";

interface SystemHealthProps {
    data: SystemHealthReport | null;
    loading: boolean;
}

const MetricBox: FC<{ label: string; value: string | number; unit?: string; hint?: string; tone?: 'good' | 'bad' | 'neutral' }> = ({ label, value, unit, hint, tone = 'neutral' }) => {
    const toneClass = tone === 'good' ? 'text-emerald-400' : tone === 'bad' ? 'text-rose-400' : 'text-white';
    return (
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-sm shadow-inner hover:bg-slate-900/80 transition-colors group/metric relative overflow-hidden">
            <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-slate-500/50 to-transparent left-0 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
            <div className="flex items-center gap-1.5 justify-center mb-1.5">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{label}</span>
                {hint && <AdminTooltip content={hint} position="bottom" />}
            </div>
            <span className={`text-xl font-black tabular-nums transition-transform group-hover/metric:scale-105 ${toneClass}`}>
                {value}
                {unit && <span className="text-[10px] font-mono text-slate-500 ml-1">{unit}</span>}
            </span>
        </div>
    );
};

export const SystemHealth: FC<SystemHealthProps> = ({ data, loading }) => {
    const { graph } = useDigitalTwinState();

    if (loading) {
        return (
            <div className="admin-glass-card animate-pulse space-y-4 w-full p-6 rounded-3xl border border-white/5">
                <div className="h-24 bg-slate-900/40 rounded-2xl" />
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 h-24 bg-slate-900/30 rounded-2xl" />
            </div>
        );
    }

    if (!data) return null;

    const isHealthy = data.status === "healthy";
    const StatusIcon = isHealthy ? CheckCircle2 : AlertOctagon;

    return (
        <div className="space-y-4 w-full admin-glass-card p-6 rounded-3xl border border-white/5 bg-slate-950/60 shadow-2xl relative overflow-hidden group" dir="rtl">
            <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />

            <div className="flex justify-between items-start mb-2 relative z-10 border-b border-white/5 pb-4">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 shadow-lg ring-1 ring-white/5">
                        <Server className="w-5 h-5 text-slate-300" />
                    </div>
                    <div>
                         <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-1">
                             صحة النظام والخوادم
                             <AdminTooltip content="مراقب (Backend) بيشيك على استجابة السيرفر وقاعدة البيانات Supabase عشان نتأكد إن مفيش وقوع للسيستم." position="bottom" />
                         </h3>
                         <span className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center gap-2">
                             INFRASTRUCTURE HEALTH
                         </span>
                    </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 px-3 py-1.5 bg-black/30 rounded-lg">{new Date(data.generatedAt).toLocaleString()}</span>
            </div>

            {/* Main Status Bar */}
            <div className={`relative overflow-hidden rounded-2xl border p-5 flex flex-col md:flex-row justify-between items-center gap-5 z-10 shadow-inner
                ${isHealthy ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-100 shadow-[0_0_15px_rgba(52,211,153,0.1)]" : "bg-rose-500/10 border-rose-500/30 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.1)]"}`} dir="ltr">
                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />

                {/* Left Side: Status */}
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl shadow-lg ${isHealthy ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30" : "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30"}`}>
                        <StatusIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-0.5">Global Status</p>
                        <p className="text-2xl font-black uppercase tracking-tight drop-shadow-md">{data.status}</p>
                    </div>
                </div>

                {/* Right Side: Probe Details */}
                <div className="flex items-center gap-6 text-right text-xs font-mono bg-black/20 p-3 rounded-xl border border-white/5">
                    <div className="flex flex-col gap-1">
                        <p className="text-[9px] uppercase tracking-widest opacity-60 flex items-center gap-1.5">
                            Supabase 
                            <span className={`w-1.5 h-1.5 rounded-full ${data.probe.supabaseReachable ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                        </p>
                        <p className={`font-black tracking-widest ${data.probe.supabaseReachable ? 'text-emerald-300' : 'text-rose-400'}`}>{data.probe.supabaseReachable ? "ONLINE" : "OFFLINE"}</p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex flex-col gap-1">
                        <p className="text-[9px] uppercase tracking-widest opacity-60 text-left">DB Latency</p>
                        <p className="font-black text-left">{data.probe.supabaseProbeMs}<span className="text-[9px] text-slate-500 ml-1">MS</span></p>
                    </div>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 relative z-10" dir="ltr">
                <MetricBox label="P95 Latency" value={data.api.p95LatencyMs} unit="ms" hint="تأخير أسوأ 5% من الاستجابات للسيرفر." />
                <MetricBox label="P50 Latency" value={data.api.p50LatencyMs} unit="ms" hint="متوسط وقت الاستجابة الطبيعي." />
                <MetricBox label="Error Rate" value={Math.round(data.api.errorRate * 100)} unit="%" tone={data.api.errorRate > 0.05 ? 'bad' : 'good'} hint="نسبة الأخطاء (500s) مقارنة بكل الطلبات." />
                <MetricBox label="500 Errors" value={data.api.errors} tone={data.api.errors > 0 ? 'bad' : 'good'} hint="عدد الطلبات الفاشلة فعلياً." />
                <MetricBox label="Total Req" value={data.api.requests} hint="إجمالي الريكويستس للسيرفر في المدى الزمني." />
                <MetricBox label="Uptime" value={data.api.uptimeSec} unit="s" hint="زمن بقاء السيرفر مرفوع بدون ريستارت." />
                
                {/* Visual Gene / Stability Card */}
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm shadow-inner relative overflow-hidden group/stab hover:bg-cyan-500/10 transition-colors">
                    <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent left-0 opacity-50" />
                    <span className="text-[10px] text-cyan-500/80 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <User className="w-3 h-3" /> 
                        Stability
                        <AdminTooltip content="مؤشر الثبات المرتبط بالتوأم الرقمي وحالة الجينوم البصري." position="top" />
                    </span>
                    <span className="text-xl font-black text-cyan-400 tabular-nums drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] group-hover/stab:scale-105 transition-transform">
                        {Math.round((graph.globalStability ?? 1) * 100)}%
                    </span>
                </div>
            </div>
        </div>
    );
};
