import type { FC } from "react";
import { AlertTriangle, Lightbulb, Users, Activity, MousePointerClick } from "lucide-react";
import type { OverviewStats } from "../../../../../services/adminApi";

interface ConversionDiagnosisProps {
    data: OverviewStats["conversionHealth"] | undefined | null;
    loading: boolean;
}

const MetricCard: FC<{ label: string; value: number; subValue?: string; highlighted?: boolean }> = ({ label, value, subValue, highlighted }) => (
    <div className={`p-4 rounded-xl border flex flex-col items-center text-center h-full justify-center
    ${highlighted ? "bg-slate-800/60 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]" : "bg-slate-900/40 border-white/5"}`}>
        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-2">{label}</span>
        <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white tabular-nums">{value}</span>
            {subValue && <span className="text-xs font-bold text-emerald-400">({subValue})</span>}
        </div>
    </div>
);

export const ConversionDiagnosis: FC<ConversionDiagnosisProps> = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="animate-pulse space-y-4 w-full p-6 bg-slate-900/40 rounded-2xl border border-slate-800">
                <div className="h-6 w-32 bg-slate-800 rounded mb-4" />
                <div className="grid grid-cols-5 gap-4 h-20 bg-slate-800/50 rounded-xl" />
                <div className="h-12 bg-slate-800/30 rounded-xl" />
            </div>
        );
    }

    if (!data) return null;

    const conversionRate = data.addPersonOpened > 0
        ? Math.round((data.addPersonDoneShowOnMap / data.addPersonOpened) * 100)
        : 0;

    // Generate warnings dynamically
    const warnings = [];
    if (data.pathStarted24h === 0) warnings.push("لا توجد أي بدايات مسار خلال آخر 24 ساعة.");
    if (data.journeyMapsTotal === 0) warnings.push("لا توجد خرائط محفوظة حتى الآن على السيرفر.");
    if (data.addPersonOpened > 0 && conversionRate < 10) warnings.push("نسبة إكمال إضافة شخص منخفضة جدًا (أقل من 10%).");

    const hasWarnings = warnings.length > 0;

    return (
        <div className="w-full space-y-4" dir="rtl">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-200">تشخيص التحويل</h3>
                {hasWarnings && (
                    <span className="bg-rose-500/10 text-rose-400 text-[10px] px-2 py-0.5 rounded-full border border-rose-500/20 font-bold">
                        تحذير
                    </span>
                )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <MetricCard label="بدايات المسار (24 ساعة)" value={data.pathStarted24h} />
                <MetricCard label="إجمالي الخرائط المحفوظة" value={data.journeyMapsTotal} />
                <MetricCard label="فتح إضافة شخص" value={data.addPersonOpened} />
                <MetricCard
                    label="أنهى الإضافة وعرض على الخريطة"
                    value={data.addPersonDoneShowOnMap}
                    subValue={`${conversionRate}%`}
                    highlighted
                />
                {/* Placeholder for CTA click as it's not in the main interface yet */}
                <MetricCard label="ضغط ابدأ المسار الآن" value={0} />
            </div>

            {/* Warnings Section */}
            {hasWarnings && (
                <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 flex flex-col gap-2">
                    {warnings.map((w, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-rose-400/90 text-xs font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{w}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Suggestions Section */}
            {/* Logic for suggestions can be static or dynamic based on thresholds */}
            <div className="bg-slate-900/30 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
                    <h4 className="text-xs font-bold text-cyan-400">إجراءات مقترحة تلقائيًا</h4>
                </div>
                <div className="space-y-2 text-xs text-slate-400 leading-relaxed font-medium pl-4">
                    <p>• فعّل حملة دفع فورية: رسالة واضحة بعد إضافة الشخص بزر واحد &quot;ابدأ المسار الآن&quot;.</p>
                    <p>• راجع نقطة حفظ الخريطة: نفّذ اختبار داخلي (إضافة شخص - تحديث - تأكد من ظهور الخريطة بعد إعادة الدخول).</p>
                    <p>• بسّط خطوه إضافة الشخص: قلّل الحقول إلزامية واجعل الإكمال في خطوة واحده.</p>
                </div>
            </div>
        </div>
    );
};
