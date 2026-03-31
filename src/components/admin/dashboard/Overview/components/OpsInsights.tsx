import type { FC } from "react";
import { AlertTriangle, Zap, Activity } from "lucide-react";
import type { OpsInsights as OpsInsightsType } from "../../../../../services/adminApi";
import { AdminTooltip } from "./AdminTooltip";

interface OpsInsightsProps {
    data: OpsInsightsType | null;
    loading: boolean;
}

const MetricCard: FC<{ label: string; value: string | number; subValue?: string; trend?: "up" | "down" | "neutral"; hint: string }> = ({ label, value, subValue, trend, hint }) => (
    <div className="flex flex-col p-4 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-sm shadow-inner hover:bg-slate-900/80 transition-colors group/metric relative overflow-hidden text-right">
        <div className="absolute top-0 w-[150%] h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent left-1/2 -translate-x-1/2 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
        <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{label}</span>
            <AdminTooltip content={hint} position="bottom" />
        </div>
        <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white tabular-nums group-hover/metric:scale-105 origin-right transition-transform">{value}</span>
            {subValue && (
                <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded-lg border ${trend === "up" ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" : trend === "down" ? "text-rose-300 bg-rose-500/10 border-rose-500/20" : "text-slate-300 bg-slate-800 border-white/10"}`}>
                    {subValue}
                </span>
            )}
        </div>
    </div>
);

const AlertBox: FC<{ alert: OpsInsightsType["alerts"][0] }> = ({ alert }) => (
    <div className={`p-5 rounded-2xl border flex flex-col gap-2 relative overflow-hidden group/alert shadow-inner hover:brightness-110 transition-all ${alert.level === "critical"
        ? "bg-rose-500/10 border-rose-500/30 text-rose-200"
        : alert.level === "warning"
            ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
            : "bg-blue-500/10 border-blue-500/30 text-blue-200"
        }`}>
        <div className={`absolute top-0 right-0 w-1.5 h-full ${alert.level === "critical" ? "bg-rose-500" : alert.level === "warning" ? "bg-amber-500" : "bg-blue-500"}`} />
        <div className="flex items-center justify-between pl-2 pb-2 border-b border-white/5">
            <span className="font-black text-sm pr-2">{alert.title}</span>
            {alert.level === "critical" && <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />}
        </div>
        <div className="flex justify-end text-[10px] font-mono opacity-80 uppercase tracking-wider pr-2">
            metric: <span className="text-white ml-1 mr-3">{alert.metric}</span> | thrsh: <span className="text-white ml-1">{alert.threshold}</span>
        </div>
    </div>
);

const SegmentBox: FC<{ title: string; data: Array<{ key: string; count: number }> | null; hint: string }> = ({ title, data, hint }) => (
    <div className="p-4 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-sm flex flex-col h-full hover:bg-slate-900/80 transition-colors group/seg relative overflow-hidden">
        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-right">{title}</span>
            <AdminTooltip content={hint} position="top" />
        </div>
        <div className="flex-1 flex flex-col justify-end gap-1.5">
            {(!data || data.length === 0) ? (
                <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest text-center py-4 border border-dashed border-slate-800 rounded-xl bg-slate-900/40">NO DATA</span>
            ) : (
                data.map((item) => (
                    <div key={item.key} className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-black/20 hover:bg-black/40 transition-colors">
                        <span className="text-[11px] font-bold text-slate-300">{item.key || 'Unknown'}</span>
                        <span className="text-xs font-black font-mono text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.3)]">{item.count}</span>
                    </div>
                ))
            )}
        </div>
    </div>
);

export const OpsInsights: FC<OpsInsightsProps> = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="admin-glass-card animate-pulse space-y-4 w-full p-6 rounded-3xl border border-white/5">
                <div className="h-10 bg-slate-900/40 rounded-2xl w-1/3 mb-6"></div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-slate-900/30 rounded-2xl"></div>)}
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6 w-full admin-glass-card p-6 md:p-8 rounded-3xl border border-white/5 bg-slate-950/60 shadow-2xl relative overflow-hidden group" dir="rtl">
             <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none opacity-50 transition-opacity duration-1000 group-hover:opacity-80" />

            <div className="flex justify-between items-start mb-4 relative z-10 border-b border-white/5 pb-4">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-slate-900 rounded-xl border border-amber-500/20 shadow-lg ring-1 ring-white/5">
                        <Zap className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                         <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-1">
                             التحليلات التشغيلية
                             <AdminTooltip content="مؤشرات حيوية عن أداء المنتج نفسه، من أول ضغطة لغاية نهاية القمع، بالإضافة لتحذيرات النظام." position="bottom" />
                         </h3>
                         <span className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center gap-2">
                             OPERATIONAL INSIGHTS HUB
                         </span>
                    </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 px-3 py-1.5 bg-black/30 rounded-lg hidden sm:block" dir="ltr">{new Date(data.generatedAt).toLocaleString('en-US')}</span>
            </div>

            {/* Funnel Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
                <MetricCard label="Landing Viewed" value={data.funnel.landingViewed} hint="عدد زيارات الصفحة الرئيسية Landing." />
                <MetricCard label="Start Clicked" value={data.funnel.startClicked} hint="كام واحد ضغط 'ابدأ' في الهيرو سكشن الفوقي." />
                <MetricCard label="Add Person (Open)" value={data.funnel.addPersonOpened} hint="عدد المرات اللي اتفتح فيها كارت إضافة علاقة جديدة للصيانة." />
                <MetricCard label="Add Person (Done)" value={data.funnel.addPersonDone} hint="عدد الإضافات الناجحة وحفظ العلاقة في السيستم." />
                <MetricCard label="CTA Conversions" value={data.funnel.startPathCTA} hint="عدد استخدام الـ Call to Action اللي جوة التطبيق نفسه للترقية أو المهام." />
            </div>

            {/* Cohorts Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10 border-t border-white/5 pt-6 mt-2">
                <MetricCard label="Activation" value={`${data.cohort.activationRate}%`} hint="نسبة الأفراد اللي بمجرد ما دخلوا عملوا Use case مفيد مباشر (مش مجرد فتح الصفحة)." />
                <MetricCard label="New Cohort (30D)" value={data.cohort.newSessions30d} hint="حجم الجيل الحالي (الـ 30 يوم اللي فاتوا) اللي بيُقاس عليه التحويل." />
                <MetricCard
                    label="Delta 24H"
                    value={`${data.comparisons.events1dDelta > 0 ? '+' : ''}${data.comparisons.events1dDelta}%`}
                    trend={data.comparisons.events1dDelta > 0 ? 'up' : 'down'}
                    hint="التغير النسبي في عدد الأحداث (Events) خلال آخر 24 ساعة مقارنة باليوم اللي قبله."
                />
                <MetricCard
                    label="Delta 7D"
                    value={`${data.comparisons.events7dDelta > 0 ? '+' : ''}${data.comparisons.events7dDelta}%`}
                    trend={data.comparisons.events7dDelta > 0 ? 'up' : 'down'}
                    hint="التغير النسبي خلال أسبوع كامل للمساعدة في تحديد ترندات الهبوط أو الصعود."
                />
            </div>

            {/* Alerts Grid */}
            {data.alerts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 border-t border-white/5 pt-6 mt-2">
                    {data.alerts.map((alert, idx) => (
                        <AlertBox key={idx} alert={alert} />
                    ))}
                </div>
            )}

            {/* Segments Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 border-t border-white/5 pt-6 mt-2">
                <SegmentBox title="Devices" data={data.segments.byDevice} hint="شرائح وأنواع الأجهزة المستخدمة." />
                <SegmentBox title="Channels" data={data.segments.byChannel} hint="القنوات التسويقية الناجحة." />
                
                <div className="p-4 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-sm flex flex-col h-full hover:bg-slate-900/80 transition-colors">
                    <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-right">User Mode</span>
                        <AdminTooltip content="مقارنة بين الزوار المجهولين والمسجلين المعروفين بالهوية." position="top" />
                    </div>
                    <div className="flex-1 flex flex-col justify-end gap-1.5">
                        <div className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-black/20 hover:bg-black/40 transition-colors">
                            <span className="text-[11px] font-bold text-slate-300">Identified</span>
                            <span className="text-xs font-black font-mono text-cyan-400 drop-shadow-md">{data.tracking.identified}</span>
                        </div>
                        <div className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-black/20 hover:bg-black/40 transition-colors">
                            <span className="text-[11px] font-bold text-slate-300">Anonymous</span>
                            <span className="text-xs font-black font-mono text-slate-400 drop-shadow-md">{data.tracking.anonymous}</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
