import type { FC } from "react";
import { useEffect, useState } from "react";
import { Compass, Activity, ShieldAlert, Cpu } from "lucide-react";

import { StatCard, formatNumber } from "./components/StatCard";
import { GrowthAndFriction } from "../Overview/components/GrowthAndFriction";
import { DeepAnalytics } from "../Overview/components/DeepAnalytics";
import { fetchOverviewStats, type OverviewStats } from "@/services/adminApi";
import { AdminTooltip } from "../Overview/components/AdminTooltip";

export const FlowDynamicsDashboard: FC = () => {
    const [remoteStats, setRemoteStats] = useState<OverviewStats | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const refresh = async () => {
            try {
                const overviewData = await fetchOverviewStats();
                if (mounted) {
                    setRemoteStats(overviewData ?? null);
                    setInitialLoading(false);
                }
            } catch {
                if (mounted) setInitialLoading(false);
            }
        };

        refresh();
        const timer = window.setInterval(refresh, 60_000);
        return () => {
            mounted = false;
            window.clearInterval(timer);
        };
    }, []);

    if (initialLoading || !remoteStats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
                 <div className="relative">
                     <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full animate-pulse" />
                     <Compass className="w-12 h-12 text-cyan-400 animate-spin-slow relative z-10" />
                 </div>
                <p className="text-slate-400 text-sm font-black uppercase tracking-widest text-shadow-sm">تحليل مسارات التدفق الحيوية...</p>
            </div>
        );
    }

    const routingV2 = remoteStats.routingV2;
    const routingTelemetry = remoteStats.routingTelemetry;
    
    // Derived values
    const latencyQuality = routingTelemetry?.latencyQuality ?? null;
    const hasLowNoiseFilter = latencyQuality?.noiseFilteredPct != null && latencyQuality.noiseFilteredPct < 15;
    const hasLowLatencySample = (latencyQuality?.sampleCount ?? 0) < 30;
    
    const latencyQualityStatus: "healthy" | "warning" | "critical" =
        hasLowNoiseFilter && hasLowLatencySample
        ? "critical"
        : hasLowNoiseFilter || hasLowLatencySample
            ? "warning"
            : "healthy";

    const latencyQualityStatusLabel =
        latencyQualityStatus === "critical"
        ? "خطر: بيانات التوجيه غير مكتملة"
        : latencyQualityStatus === "warning"
            ? "تحذير: ضوضاء في مسارات التوجيه"
            : "صحي: استجابات التوجيه مستقرة";

    return (
        <div className="space-y-6 max-w-7xl mx-auto" dir="rtl">
            <header className="admin-glass-card rounded-3xl p-6 md:p-8 border-none bg-slate-950/60 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
                
                <div className="flex items-center gap-6 relative z-10 w-full md:w-auto mb-4 md:mb-0">
                    <div className="p-4 bg-slate-900/80 rounded-2xl border border-cyan-500/20 shadow-lg ring-1 ring-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-cyan-500/10 opacity-50 group-hover:opacity-80 transition-opacity" />
                        <Compass className="w-8 h-8 text-cyan-400 relative z-10" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1 flex items-center gap-3">
                            ديناميكية المسار والمحرك الموزع
                            <AdminTooltip content="مركز تحكم V2 Dynamic Routing. الذكاء الاصطناعي بيوزع الحمل النفسي على المستخدمين عشان ما يحبطوش، وبيدخل بقرارات لحظية." position="bottom" />
                        </h2>
                        <div className="flex items-center gap-2 mt-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 w-fit">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                            <p className="text-xs font-black uppercase tracking-widest text-cyan-400">تحليل قرارات التوجيه والتدخل اللحظي</p>
                        </div>
                    </div>
                </div>
            </header>

            {routingV2 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Decisions (V2)"
                        value={formatNumber(routingV2.decisions ?? 0)}
                        hint="حجم قرارات المحرك الديناميكي"
                        tooltip="إجمالي المرات اللي الذكاء الاصطناعي قرر مسار معين لمستخدم (مثلاً: يكمل قراءة، أو يدخل على إضافة دائرة)."
                    />
                    <StatCard
                        title="Exploration Rate"
                        value={routingV2.explorationRate != null ? `${routingV2.explorationRate}%` : "—"}
                        hint="نسبة الخروج من الـ Echo Chamber"
                        glowColor="indigo"
                        tooltip="الخوارزمية بتتعمد تدي المستخدم اقتراحات عكس متوقع لتوسيع مداركه.. نسبة الـ (15% أو أكتر) معناها السيستم شغال صح."
                    />
                    <StatCard
                        title="Completion Acted"
                        value={routingV2.completionRateActedOnly != null ? `${routingV2.completionRateActedOnly}%` : "—"}
                        hint="معدل إكمال المهام التفاعلية"
                        glowColor="teal"
                        tooltip="نسبة الناس اللي التزموا بقرار المحرك ونفذوا المهمة للآخر."
                    />
                </div>
            )}

            {routingTelemetry && (
                <div className="space-y-6">
                    <div className={`rounded-xl border px-5 py-4 text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-inner relative overflow-hidden
                         ${latencyQualityStatus === "critical"
                        ? "border-rose-500/40 bg-rose-500/10 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.1)]"
                        : latencyQualityStatus === "warning"
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.1)]"
                    }`}>
                        <div className="absolute right-0 top-0 h-full w-1 border-r border-inherit opacity-50 bg-inherit" />
                        {latencyQualityStatus === "critical" ? <ShieldAlert className="w-5 h-5 animate-pulse" /> : <Activity className="w-5 h-5" />}
                        <span>
                            {latencyQualityStatusLabel}
                            {hasLowNoiseFilter ? " | Noise < 15%" : ""}
                            {hasLowLatencySample ? " | Samples < 30" : ""}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Active Duration" value={latencyQuality?.avgActiveElapsedSec != null ? `${latencyQuality.avgActiveElapsedSec}s` : "—"} hint="متوسط الزمن النشط الفعلي" tooltip="متوسط ثواني التفاعل الإيجابي مع المحرك بدون ضوضاء تشتت الانتباه." />
                        <StatCard title="Hesitation Lag" value={latencyQuality?.avgHesitationSec != null ? `${latencyQuality.avgHesitationSec}s` : "—"} hint={`حجم العينة: ${formatNumber(latencyQuality?.sampleCount ?? 0)}`} glowColor="indigo" tooltip="متوسط الزمن اللي المستخدم بيتردد فيه قبل ما يضغط. لو عالي، معناه في Friction في الـ UX أو حيرة مشاعر." />
                        <StatCard title="Safety Interventions" value={formatNumber(routingTelemetry.interventionHealth?.totalInterventions ?? 0)} hint="تدخلات الإنقاذ اللحظي (24h)" glowColor="rose" tooltip="عدد المرات اللى السيستم حوّل فيها مسار المستخدم إجبارياً لمسار آمن (زي الطوارئ) لأنه حس بوجود استنزاف." />
                        <StatCard title="Intervention Rate" value={routingTelemetry.interventionHealth?.interventionRatePct != null ? `${routingTelemetry.interventionHealth.interventionRatePct}%` : "—"} hint="نسبة تدخلات الإنقاذ من الإجمالي" glowColor="rose" tooltip="لو النسبة دي زادت فجأة، معناه في أزمة جماعية أو تريند بيخلي الناس محبطة." />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
                        <div className="admin-glass-card p-6 md:p-8 border border-white/5 bg-slate-950/60 shadow-xl rounded-3xl group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-slate-500/10 blur-[80px] rounded-full pointer-events-none opacity-50 transition-opacity" />
                            
                            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                                 <p className="text-xs text-slate-400 uppercase tracking-widest font-black flex items-center gap-2"><Cpu className="w-4 h-4 text-slate-500" /> Routing Cognitive Matrix</p>
                                 <AdminTooltip content="مصفوفة بتشوف العلاقة بين استيعاب المستخدم للمحتوى، وبين الحمل اللي بنطلبه منه يعمله، وبتحسب نسب النجاح للتطوير." position="top" />
                            </div>

                            <div className="overflow-x-auto relative z-10 custom-scrollbar pr-2">
                                <table className="w-full text-xs text-right text-slate-300">
                                    <thead>
                                        <tr className="text-[10px] text-slate-500 uppercase tracking-widest border-b border-white/5">
                                            <th className="py-3 px-3 font-black text-left">Capacity</th>
                                            <th className="py-3 px-3 font-black text-center">Load Band</th>
                                            <th className="py-3 px-3 font-black text-center">Decisions</th>
                                            <th className="py-3 px-3 font-black text-center">Compl. %</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-mono">
                                        {(routingTelemetry.cognitiveEffectiveness?.completionMatrix ?? []).slice(0, 10).map((row: any) => (
                                            <tr key={`${row.capacityBand}-${row.selectedLoadBand}`} className="border-b border-white/5 last:border-0 hover:bg-slate-900/60 transition-colors">
                                                <td className="py-3 px-3 text-left font-bold text-slate-200 bg-slate-900/40">{row.capacityBand}</td>
                                                <td className="py-3 px-3 text-center text-indigo-300 bg-slate-900/20">{row.selectedLoadBand}</td>
                                                <td className="py-3 px-3 text-center">{formatNumber(row.decisions ?? 0)}</td>
                                                <td className="py-3 px-3 text-center text-emerald-400 font-bold drop-shadow-md">{row.completionRatePct != null ? `${row.completionRatePct}%` : "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="admin-glass-card p-6 md:p-8 border border-white/5 bg-slate-950/60 shadow-xl rounded-3xl group relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-rose-500/10 blur-[80px] rounded-full pointer-events-none opacity-50 transition-opacity" />
                            
                             <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                                 <p className="text-xs text-rose-400/80 uppercase tracking-widest font-black flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-rose-500/80" /> Interventions By Segment</p>
                                 <AdminTooltip content="شريحة المستخدمين اللى السيستم بيضطر يتدخل عشان ينقذهم.. مفيدة لتقسيم التسويق (لو شريحة معينة محبطة جداً)." position="top" />
                            </div>

                            <div className="overflow-x-auto relative z-10 custom-scrollbar pr-2">
                                <table className="w-full text-xs text-right text-slate-300">
                                    <thead>
                                        <tr className="text-[10px] text-slate-500 uppercase tracking-widest border-b border-white/5">
                                            <th className="py-3 px-3 font-black text-left">Segment</th>
                                            <th className="py-3 px-3 font-black text-center">Interventions</th>
                                            <th className="py-3 px-3 font-black text-center">Rate %</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-mono">
                                        {(routingTelemetry.interventionHealth?.bySegment ?? []).slice(0, 10).map((row: any) => (
                                            <tr key={row.segmentKey} className="border-b border-white/5 last:border-0 hover:bg-slate-900/60 transition-colors">
                                                <td className="py-3 px-3 text-left font-bold text-slate-200 bg-slate-900/40">{row.segmentKey}</td>
                                                <td className="py-3 px-3 text-center text-rose-300 bg-rose-500/5">{formatNumber(row.interventions ?? 0)}</td>
                                                <td className="py-3 px-3 text-center text-rose-400 font-bold drop-shadow-md bg-rose-500/10">{row.interventionRatePct != null ? `${row.interventionRatePct}%` : "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 relative z-10">
                <GrowthAndFriction 
                    growthData={remoteStats?.growthData ?? []}
                    frictionData={remoteStats?.taskFriction ?? null}
                    loading={initialLoading}
                />
            </div>
            
            <div className="mt-8 relative z-10">
                <DeepAnalytics 
                    flowStats={remoteStats?.flowStats}
                    weeklyRhythm={remoteStats?.weeklyRhythm}
                    loading={initialLoading}
                />
            </div>
        </div>
    );
};
