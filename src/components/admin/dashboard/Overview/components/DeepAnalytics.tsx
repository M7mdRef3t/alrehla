import type { FC } from "react";
import { Activity, Zap, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { OverviewStats } from "../../../../../services/adminApi";

interface DeepAnalyticsProps {
    flowStats: OverviewStats["flowStats"];
    weeklyRhythm: OverviewStats["weeklyRhythm"];
    loading: boolean;
}

// Helper to translate step keys to Arabic labels mentioned in the image
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
        "add_person_completed": "أنهى الإضافة وطلب عرض الشخص على الخريطة",
        "add_person_escape": "هروب من إضافة شخص",
        "app_installed": "ضغط تثبيت التطبيق",
        "platform_action": "فعل المنصة من الهبوط",
        "account_created": "ضغط الحساب",
        // Add more as needed based on actual API keys
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
        <div className="admin-glass-card p-6 border-white/5 bg-slate-950/30 rounded-2xl backdrop-blur-sm mb-6" dir="rtl">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-xs font-bold text-cyan-400">تحديث مباشر</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-slate-400 transform scale-x-[-1]" />
                        <h3 className="text-lg font-bold text-white">مسارات التدفق (آخر 30 يوم)</h3>
                    </div>
                </div>
                <div className="text-left">
                    <p className="text-xs font-bold text-slate-400">
                        متوسط زمن القرار (حتى "يلا نبدأ"): <span className="text-white font-mono">{avgTime} ثانية</span>
                        <span className="mx-2 text-slate-600">|</span>
                        نسبة إتمام الإضافة: <span className="text-emerald-400 font-mono">{completionRate}%</span>
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                {steps.map((step) => (
                    <div key={step.key} className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700 text-xs font-bold text-slate-300 flex items-center gap-2">
                        <span>{translateStep(step.key)}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-700 text-white font-mono text-[10px]">{step.count}</span>
                    </div>
                ))}
            </div>

            {abandonReasons.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                    {abandonReasons.map(([reason, count]) => (
                        <div key={reason} className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-300 flex items-center gap-2">
                            <span>{translateStep(reason)}</span>
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-100 font-mono text-[10px]" dir="ltr">({count}%)</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const WeeklyRhythmCard: FC<{ data: OverviewStats["weeklyRhythm"] }> = ({ data }) => {
    if (!data) return null;

    const chartData = data.byDay.map(d => ({
        name: d.dayName,
        value: d.count,
        key: d.dayName // using arabic day name directly as key
    }));

    const lowestDay = data.lowestDayName || "غير محدد";

    return (
        <div className="admin-glass-card p-6 border-white/5 bg-slate-950/30 rounded-2xl backdrop-blur-sm mb-6" dir="rtl">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-xs font-bold text-cyan-400">تحديث مباشر</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-slate-400" />
                        <h3 className="text-lg font-bold text-white">إيقاع الطاقة الأسبوعي</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">يوم استنزاف الطاقة: <span className="text-white font-bold">{lowestDay}</span></p>
                </div>
            </div>

            <div className="h-48 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                            itemStyle={{ color: '#e2e8f0' }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.name === lowestDay ? '#f97316' : '#14b8a6'} /> // Orange for lowest, Teal for others
                            ))}
                        </Bar>
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
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

    // Simulate or extract these specific metrics if they exist in byStep, otherwise define fallback logic
    const focusChange = stats.byStep['focus_change_current'] || 0;
    const explanationUsage = stats.byStep['explanation_step_usage'] || stats.byStep['compass_explained'] || 0;

    return (
        <div className="admin-glass-card p-6 border-white/5 bg-slate-950/30 rounded-2xl backdrop-blur-sm mb-6" dir="rtl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-xs font-bold text-cyan-400">تحديث مباشر</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-slate-400" />
                        <h3 className="text-lg font-bold text-white">قوة الخطوتين 3 و 4 (التركيز والشرح)</h3>
                    </div>
                </div>
                <p className="text-xs text-slate-400">متوسط زمن التفاعل: <span className="text-white font-mono">387ث</span></p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Focus Card */}
                <div className="p-4 rounded-xl bg-slate-900/30 border border-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-slate-400 mb-2">تغيير التركيز الحالي</span>
                    <span className="text-3xl font-bold text-white font-mono mb-1">{focusChange}</span>
                    <span className="text-[10px] text-slate-500">0% من إجمالي الإكمالات</span>
                </div>

                {/* Explanation Card */}
                <div className="p-4 rounded-xl bg-slate-900/30 border border-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-slate-400 mb-2">استخدام خطوة الشرح</span>
                    <span className="text-3xl font-bold text-white font-mono mb-1">{explanationUsage}</span>
                    <span className="text-[10px] text-slate-500 mb-1">{stats.addPersonCompletionRate ? Math.round(stats.addPersonCompletionRate / 2) : 0}% من إجمالي الإكمالات</span> {/* Dummy calc for demo */}
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20">اختصارات سريعة مستخدمة: 0</span>
                </div>
            </div>
        </div>
    );
};

export const DeepAnalytics: FC<DeepAnalyticsProps> = ({ flowStats, weeklyRhythm, loading }) => {
    if (loading) {
        return (
            <div className="space-y-6 w-full opacity-50 pointer-events-none">
                <div className="h-40 bg-slate-900/20 rounded-2xl animate-pulse" />
                <div className="h-40 bg-slate-900/20 rounded-2xl animate-pulse" />
                <div className="h-40 bg-slate-900/20 rounded-2xl animate-pulse" />
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
