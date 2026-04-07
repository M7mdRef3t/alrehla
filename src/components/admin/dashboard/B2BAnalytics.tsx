/**
 * B2B Analytics — تحليلات المؤسسات 🏢
 * ==========================================
 * يعرض بيانات مجمّعة للمنظمات (مدارس، شركات) مع الحفاظ على الخصوصية.
 */

import React, { useMemo } from "react";
import { Users, Activity, AlertCircle, TrendingDown, Lightbulb, Download } from "lucide-react";
import { loadEnterpriseData, generateMockMetrics, ENTERPRISE_TYPE_LABELS } from "@/services/enterpriseAnalytics";
import { AdminTooltip } from "./Overview/components/AdminTooltip";

export const B2BAnalytics: React.FC = () => {
    const data = useMemo(() => loadEnterpriseData(), []);
    const metrics = useMemo(() => generateMockMetrics(data.profile?.memberCount ?? 0), [data.profile?.memberCount]);

    if (!data.profile) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/30 rounded-3xl border border-dashed border-white/10">
                <Users className="w-16 h-16 text-slate-700 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">لا توجد مؤسسة مسجلة</h3>
                <p className="text-slate-500 max-w-xs mx-auto">
                    هذا القسم مخصص للمسؤولين عن المجموعات الكبيرة (شركات أو مدارس).
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 text-right" dir="rtl">
            {/* Enterprise Header */}
            <div className="p-8 bg-slate-950/40 rounded-3xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <Users className="w-7 h-7 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">{data.profile.name}</h2>
                        <p className="text-xs text-slate-500 font-bold">
                            {ENTERPRISE_TYPE_LABELS[data.profile.type]} • {data.profile.memberCount} عضو نشط
                        </p>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-all">
                    <Download className="w-4 h-4" />
                    تصدير التقرير الشهري
                </button>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatusCard
                    icon={<Activity className="w-5 h-5 text-emerald-400" />}
                    label="متوسط مستوى الطاقة"
                    value={metrics.avgEnergyLevel.toString()}
                    subValue="من 10"
                    trend="+0.2 عن الشهر الماضي"
                    tooltip="مقياس يعكس حالة النشاط والاندماج للأعضاء. الرقم العالي يعني بيئة صحية."
                />
                <StatusCard
                    icon={<AlertCircle className="w-5 h-5 text-rose-400" />}
                    label="مؤشر الضغط النفسي"
                    value={metrics.stressIndex.toString()}
                    subValue="تصاعدي"
                    trend="تنبيه: نمو طفيف في القلق"
                    tooltip="مؤشر يتنبأ باحتمالية الاحتراق الوظيفي أو التوتر بناءً على مسارات التشخيص."
                />
                <StatusCard
                    icon={<Users className="w-5 h-5 text-teal-400" />}
                    label="نسبة التفاعل الأسبوعية"
                    value={(metrics.weeklyActiveRate * 100).toFixed(0) + "%"}
                    subValue="مشاركة يومية"
                    trend="استقرار في النشاط"
                    tooltip="نسبة الأعضاء اللي بيفتحوا التطبيق أو بيكملوا المهام والتشخيصات أسبوعياً."
                />
            </div>

            {/* Strategic Recommendation */}
            <div className="p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-3xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-indigo-300">توصية جارفيس الاستراتيجية</h4>
                        <AdminTooltip content="نصيحة تلقائية مبنية على تحليل سلوك الفريق للتوجيه نحو أفضل إجراء يمكن للإدارة اتخاذه الآن." position="top" />
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{metrics.recommendation}</p>
                </div>
            </div>

            {/* Top Boundary Patterns */}
            <div className="admin-glass-card p-6">
                <div className="flex items-center gap-2 mb-6">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-emerald-400" />
                        أبرز تحديات الحدود (أصوات مجمّعة)
                    </h3>
                    <AdminTooltip content="أكثر الأنماط النفسية تكراراً التي يعاني منها الموظفون/الأعضاء (مثل فقدان الشغف، صعوبة قول لا). البيانات مجهّلة لحفظ الخصوصية." position="top" />
                </div>
                <div className="flex flex-wrap gap-3">
                    {metrics.topBoundaryPatterns.map((pattern: string, i: number) => (
                        <div key={i} className="px-4 py-2 rounded-xl bg-slate-900 border border-white/5 text-xs text-slate-300">
                            {pattern}
                        </div>
                    ))}
                </div>
                <p className="mt-4 text-[10px] text-slate-600">
                    * يتم جمع هذه البيانات بشكل مجهول تماماً لضمان خصوصية الأعضاء. لا يمكن تحديد هوية صاحب الإجابة.
                </p>
            </div>
        </div>
    );
};

const StatusCard: React.FC<{ icon: React.ReactNode; label: string; value: string; subValue: string; trend: string; tooltip?: string }> = ({ icon, label, value, subValue, trend, tooltip }) => (
    <div className="admin-glass-card p-6 group">
        <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-white/5 font-bold group-hover:bg-white/10 transition-colors">
                {icon}
            </div>
            <span className="text-[10px] text-slate-500 font-bold uppercase">{subValue}</span>
        </div>
        <div className="mb-2">
            <span className="text-3xl font-black text-white">{value}</span>
        </div>
        <div>
            <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-400">{label}</h4>
                {tooltip && <AdminTooltip content={tooltip} position="bottom" />}
            </div>
            <p className="text-[10px] text-emerald-500/80 mt-1">{trend}</p>
        </div>
    </div>
);
