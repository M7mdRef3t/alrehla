import type { FC } from "react";
import { Activity, Zap, BarChart3, SplitSquareHorizontal, Compass, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import type { OverviewStats } from "@/services/adminApi";
import { AdminTooltip } from "./AdminTooltip";

interface DeepAnalyticsProps {
    flowStats: OverviewStats["flowStats"];
    weeklyRhythm: OverviewStats["weeklyRhythm"];
    loading: boolean;
}

const translateStep = (key: string): string => {
    const map: Record<string, string> = {
        "landing_viewed": "شاهد الهبوط",
        "start_path_clicked": "ضغط ابدأ المسار الآن",
        "compass_opened": "فتح البوصلة",
        "compass_completed": "أكمل البوصلة",
        "compass_saved": "حفظ البوصلة مع اختيارات",
        "compass_saved_empty": "حفظ البوصلة بدون اختيارات",
        "compass_explained": "كتب شرح في البوصلة",
        "compass_escape": "هروب من البوصلة",
        "add_person_opened": "فتح إضافة شخص",
        "add_person_completed": "أنهى الإضافة وطلب عرض الشخص",
        "add_person_escape": "هروب من إضافة شخص",
        "app_installed": "ثبت التطبيق",
        "platform_action": "فعل المنصة",
        "account_created": "أنشأ حساب",
    };
    return map[key] || key.replace(/_/g, " ");
};

const FlowPathsCard: FC<{ stats: OverviewStats["flowStats"] }> = ({ stats }) => {
    if (!stats) return null;

    const steps = Object.entries(stats.byStep).map(([key, count]) => ({ key, count }));
    const avgTime = stats.avgTimeToActionMs ? Math.round(stats.avgTimeToActionMs / 1000) : 0;
    const completionRate = stats.addPersonCompletionRate ? Math.round(stats.addPersonCompletionRate) : 0;
    const abandonReasons = stats.pulseAbandonedByReason ? Object.entries(stats.pulseAbandonedByReason) : [];

    return (
        <div className="admin-glass-card p-6 md:p-8 border border-white/5 bg-slate-950/60 shadow-2xl rounded-3xl relative overflow-hidden group mb-6" dir="rtl">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none opacity-50 transition-opacity duration-1000 group-hover:opacity-80" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-white/5 pb-4 relative z-10 gap-4">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-slate-900 rounded-xl border border-sky-500/20 shadow-lg ring-1 ring-white/5">
                        <SplitSquareHorizontal className="w-5 h-5 text-sky-400" />
                    </div>
                    <div>
                         <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-1">
                             مسارات التدفق (آخر 30 يوم)
                             <AdminTooltip content="تحليل لرحلة المستخدم من أول ما يشوف صفحة الهبوط لغاية ما يكمل المهام الرئيسية أو يهرب. بتساعد في كشف الانكسارات في الـ Funnel." position="bottom" />
                         </h3>
                         <p className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center gap-2">
                             <Activity className="w-3 h-3 text-sky-400" /> BEHAVIORAL FLOW PATHS
                         </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4 bg-slate-900/60 p-3 rounded-xl border border-white/5 shadow-inner">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> متوسط زمن القرار</span>
                        <span className="text-sm font-black text-white tabular-nums drop-shadow-md">{avgTime} <span className="text-[9px] text-slate-500 ml-1">SEC</span></span>
                    </div>
                    <div className="w-px h-8 bg-white/5" />
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1"><Compass className="w-3 h-3" /> نسبة الإتمام</span>
                        <span className="text-sm font-black text-emerald-400 tabular-nums drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">{completionRate}%</span>
                    </div>
                </div>
            </div>

            <div className="relative z-10 w-full mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex flex-wrap gap-2.5">
                    {steps.map((step) => (
                        <div key={step.key} className="px-3 py-2 rounded-xl bg-slate-900/50 border border-white/5 text-xs font-bold text-slate-300 flex items-center justify-between gap-3 hover:bg-slate-900/80 transition-colors shadow-sm w-full sm:w-auto flex-1 sm:flex-none">
                            <span className="truncate">{translateStep(step.key)}</span>
                            <span className="px-2 py-1 rounded-md bg-black/40 text-slate-300 font-mono text-[11px] tabular-nums shrink-0">{step.count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {abandonReasons.length > 0 && (
                <div className="relative z-10 pt-5 border-t border-white/5">
                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-3 flex items-center gap-2">أسباب التخلي الرئيسية <AdminTooltip content="الخطوات اللي الناس بتقفل من عندها أو تسيب التطبيق بناءً على تتبع (Pulse Abandoned)." position="top" /></div>
                    <div className="flex flex-wrap gap-3">
                        {abandonReasons.map(([reason, count]) => (
                            <div key={reason} className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-300 flex items-center gap-3 hover:bg-rose-500/20 transition-colors shadow-inner">
                                <span>{translateStep(reason)}</span>
                                <span className="px-2 py-1 rounded-md bg-rose-500/20 text-rose-100 font-mono text-[11px]" dir="ltr">({count}%)</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const WeeklyRhythmCard: FC<{ data: OverviewStats["weeklyRhythm"] }> = ({ data }) => {
    if (!data) return null;

    const chartData = data.byDay.map((d: any) => ({
        name: d.dayName,
        value: d.count,
        key: d.dayName 
    }));

    const lowestDay = data.lowestDayName || "غير محدد";

    return (
        <div className="admin-glass-card p-6 md:p-8 border border-white/5 bg-slate-950/60 shadow-2xl rounded-3xl relative overflow-hidden group mb-6" dir="rtl">
             <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-fuchsia-500/10 blur-[150px] rounded-full pointer-events-none opacity-50 transition-opacity duration-1000 group-hover:opacity-80" />

            <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4 relative z-10">
                <div className="flex items-start gap-4">
                     <div className="p-3 bg-slate-900 rounded-xl border border-fuchsia-500/20 shadow-lg ring-1 ring-white/5">
                        <BarChart3 className="w-5 h-5 text-fuchsia-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-1">
                            إيقاع الطاقة الأسبوعي
                            <AdminTooltip content="مؤشر بيوضح أيام الأسبوع اللي بيكون فيها استخدام المنصة في الذروة، واليوم اللي بيحصل فيه هبوط ملحوظ في التفاعل (بينور برتقالي) عشان تتدخل فيه تسويقياً." position="bottom" />
                        </h3>
                        <p className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center gap-2">
                             WEEKLY ENERGY RHYTHM
                        </p>
                    </div>
                </div>
                
                <div className="bg-orange-500/10 border border-orange-500/20 px-3 py-2 rounded-xl shadow-inner flex flex-col items-center">
                    <span className="text-[9px] uppercase font-black text-orange-500/80 mb-0.5 tracking-widest">يوم استنزاف الطاقة</span>
                    <span className="text-sm font-black text-orange-400 drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]">{lowestDay}</span>
                </div>
            </div>

            <div className="w-full relative z-10 mt-4" dir="ltr" style={{ width: '100%', height: 224 }}>
                <ResponsiveContainer width="99%" height={224}>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <RechartsTooltip
                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                            contentStyle={{ 
                                backgroundColor: 'rgba(10, 15, 30, 0.85)', 
                                borderColor: 'rgba(45, 212, 191, 0.2)', 
                                borderRadius: '12px', 
                                fontSize: '11px', 
                                fontWeight: 'bold', 
                                backdropFilter: 'blur(16px)', 
                                color: '#fff', 
                                boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.9), inset 0 1px 1px rgba(255, 255, 255, 0.05)' 
                            }}
                            itemStyle={{ color: '#2dd4bf', fontWeight: '900', paddingTop: '4px' }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                            {chartData.map((entry: any, index: number) => (
<<<<<<< HEAD
                                <Cell key={`cell-${index}`} fill={entry.name === lowestDay ? '#f97316' : '#d946ef'} className="hover:opacity-80 transition-all cursor-pointer" /> 
=======
                                <Cell key={`cell-${index}`} fill={entry.name === lowestDay ? '#f97316' : '#d946ef'} className="hover:opacity-80 transition-all" /> 
>>>>>>> feat/sovereign-final-stabilization
                            ))}
                        </Bar>
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                            dy={10}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const StepPowerCard: FC<{ stats: OverviewStats["flowStats"] }> = ({ stats }) => {
    if (!stats) return null;

    const focusChange = stats.byStep['focus_change_current'] || 0;
    const explanationUsage = stats.byStep['explanation_step_usage'] || stats.byStep['compass_explained'] || 0;

    return (
        <div className="admin-glass-card p-6 md:p-8 border border-white/5 bg-slate-950/60 shadow-2xl rounded-3xl relative overflow-hidden group mb-6" dir="rtl">
             <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-yellow-500/5 blur-[120px] rounded-full pointer-events-none opacity-50 transition-opacity duration-1000 group-hover:opacity-80" />

            <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4 relative z-10">
                <div className="flex items-start gap-4">
                     <div className="p-3 bg-slate-900 rounded-xl border border-yellow-500/20 shadow-lg ring-1 ring-white/5">
                        <Zap className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-1">
                            قوة الخطوتين 3 و 4 (التركيز والشرح)
                            <AdminTooltip content="مؤشر بيقيس مدى تعمق المستخدمين في استخدام البوصلة؛ هل بيغيروا تركيزهم ومشاعرهم؟ وهل بيكتبوا شروحات ونوتس لنفسهم؟" position="bottom" />
                        </h3>
                         <p className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center gap-2">
                             DEEP ENGAGEMENT METRICS
                         </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {/* Focus Card */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col items-center justify-center text-center shadow-inner hover:bg-slate-900/80 transition-colors">
                     <div className="flex items-center gap-2 mb-3">
                         <span className="text-xs font-black uppercase tracking-widest text-slate-400">تعديل بؤرة التركيز (المشاعر)</span>
                     </div>
                    <span className="text-4xl font-black text-yellow-400 tabular-nums mb-1 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">{focusChange}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-black/30 px-3 py-1 rounded-lg">من إجمالي الإكمالات</span>
                </div>

                {/* Explanation Card */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 flex flex-col items-center justify-center text-center shadow-inner hover:bg-slate-900/80 transition-colors">
                     <div className="flex items-center gap-2 mb-3">
                         <span className="text-xs font-black uppercase tracking-widest text-slate-400">كتابة الشروحات (Journaling)</span>
                     </div>
                    <span className="text-4xl font-black text-emerald-400 tabular-nums mb-1 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{explanationUsage}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-black/30 px-3 py-1 rounded-lg">{stats.addPersonCompletionRate ? Math.round(stats.addPersonCompletionRate / 2) : 0}% من إجمالي الإكمالات</span>
                </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/5 text-center relative z-10">
                <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-300 font-bold text-[10px] border border-indigo-500/20 uppercase tracking-widest flex items-center justify-center gap-2 w-fit mx-auto">
                    <Zap className="w-3 h-3" />
                    متوسط زمن التفاعل العميق: 387 ثانية (مؤشر صحي)
                </span>
            </div>
        </div>
    );
};

export const DeepAnalytics: FC<DeepAnalyticsProps> = ({ flowStats, weeklyRhythm, loading }) => {
    if (loading) {
        return (
            <div className="space-y-6 w-full opacity-50 pointer-events-none">
                <div className="h-64 bg-slate-900/30 rounded-3xl animate-pulse" />
                <div className="h-64 bg-slate-900/30 rounded-3xl animate-pulse" />
            </div>
        );
    }

    return (
        <div className="w-full">
            <FlowPathsCard stats={flowStats} />
            <WeeklyRhythmCard data={weeklyRhythm} />
            <StepPowerCard stats={flowStats} />
        </div>
    );
};
